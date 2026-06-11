import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentStatus, RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from './auth.types';
import { isDepartmentManager } from './department-manager';
import { ADMIN_ROLE_NAMES } from '../modules/auth/auth.service';
import type {
  AssignmentAccessContext,
  RequestAccessContext,
} from './access-policy.types';

/** Requester may set these when the request is in a reviewable state (enforced in lifecycle). */
const REQUESTER_ONLY_STATUSES: ReadonlySet<RequestStatus> = new Set([
  'APPROVED',
  'REOPENED',
]);

/** Target-department manager inbox actions. */
const MANAGER_INBOX_STATUSES: ReadonlySet<RequestStatus> = new Set([
  'ACCEPTED',
  'REJECTED',
  'NEEDS_INFORMATION',
  'CANCELLED',
]);

/** Manager-only request work/review statuses (not assignee shortcuts). */
const MANAGER_WORK_STATUSES: ReadonlySet<RequestStatus> = new Set([
  'READY_FOR_REVIEW',
  'COMPLETED',
]);

/** Members may only bump assignment work status. */
const MEMBER_ASSIGNMENT_STATUSES: ReadonlySet<AssignmentStatus> = new Set([
  'IN_PROGRESS',
]);

@Injectable()
export class AccessPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  isAdmin(user: RequestUser): boolean {
    return !!user.roleName && ADMIN_ROLE_NAMES.has(user.roleName);
  }

  isRequester(user: RequestUser, createdByUserId: string): boolean {
    return user.id === createdByUserId;
  }

  isTargetDepartmentManager(
    user: RequestUser,
    targetDepartmentId: string,
  ): boolean {
    return isDepartmentManager(
      user.id,
      targetDepartmentId,
      user.managedDepartmentIds,
    );
  }

  isAssignmentMember(
    user: RequestUser,
    memberUserIds: readonly string[],
  ): boolean {
    return memberUserIds.includes(user.id);
  }

  async loadRequestAccessContext(
    requestId: string,
  ): Promise<RequestAccessContext | null> {
    const row = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        createdByUserId: true,
        targetDepartmentId: true,
        assignment: { select: { members: { select: { userId: true } } } },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      createdByUserId: row.createdByUserId,
      targetDepartmentId: row.targetDepartmentId,
      memberUserIds: row.assignment?.members.map((m) => m.userId) ?? [],
    };
  }

  async loadAssignmentAccessContext(
    assignmentId: string,
  ): Promise<AssignmentAccessContext | null> {
    const row = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        departmentId: true,
        members: { select: { userId: true } },
        request: { select: { createdByUserId: true } },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      departmentId: row.departmentId,
      requestCreatedByUserId: row.request.createdByUserId,
      memberUserIds: row.members.map((m) => m.userId),
    };
  }

  canViewRequest(user: RequestUser, ctx: RequestAccessContext): boolean {
    if (this.isAdmin(user)) return true;
    if (this.isRequester(user, ctx.createdByUserId)) return true;
    if (this.isTargetDepartmentManager(user, ctx.targetDepartmentId))
      return true;
    if (
      ctx.memberUserIds.length > 0 &&
      this.isAssignmentMember(user, ctx.memberUserIds)
    ) {
      return true;
    }
    return false;
  }

  assertCanViewRequest(
    user: RequestUser,
    ctx: RequestAccessContext | null,
  ): asserts ctx is RequestAccessContext {
    if (!ctx || !this.canViewRequest(user, ctx)) {
      throw new NotFoundException('Request not found');
    }
  }

  canViewAssignment(user: RequestUser, ctx: AssignmentAccessContext): boolean {
    if (this.isAdmin(user)) return true;
    if (this.isAssignmentMember(user, ctx.memberUserIds)) return true;
    if (this.isTargetDepartmentManager(user, ctx.departmentId)) return true;
    if (this.isRequester(user, ctx.requestCreatedByUserId)) return true;
    return false;
  }

  assertCanViewAssignment(
    user: RequestUser,
    ctx: AssignmentAccessContext | null,
  ): asserts ctx is AssignmentAccessContext {
    if (!ctx || !this.canViewAssignment(user, ctx)) {
      throw new NotFoundException('Assignment not found');
    }
  }

  canMutateAssignment(
    user: RequestUser,
    ctx: AssignmentAccessContext,
  ): boolean {
    if (this.isAdmin(user)) return true;
    if (this.isAssignmentMember(user, ctx.memberUserIds)) return true;
    if (this.isTargetDepartmentManager(user, ctx.departmentId)) return true;
    return false;
  }

  assertCanMutateAssignment(
    user: RequestUser,
    ctx: AssignmentAccessContext | null,
  ): void {
    if (!ctx) {
      throw new NotFoundException('Assignment not found');
    }
    if (!this.canMutateAssignment(user, ctx)) {
      throw new ForbiddenException(
        'You do not have permission to modify this assignment.',
      );
    }
  }

  canChangeAssignmentStatus(
    user: RequestUser,
    ctx: AssignmentAccessContext,
    status: AssignmentStatus,
  ): boolean {
    if (this.isAdmin(user)) return true;
    if (this.isTargetDepartmentManager(user, ctx.departmentId)) return true;
    if (
      this.isAssignmentMember(user, ctx.memberUserIds) &&
      MEMBER_ASSIGNMENT_STATUSES.has(status)
    ) {
      return true;
    }
    return false;
  }

  assertCanChangeAssignmentStatus(
    user: RequestUser,
    ctx: AssignmentAccessContext | null,
    status: AssignmentStatus,
  ): void {
    if (!ctx) {
      throw new NotFoundException('Assignment not found');
    }
    if (!this.canChangeAssignmentStatus(user, ctx, status)) {
      throw new ForbiddenException(
        'You do not have permission to change assignment status.',
      );
    }
  }

  canMarkAssignmentReadyForReview(
    user: RequestUser,
    ctx: AssignmentAccessContext,
  ): boolean {
    if (this.isAdmin(user)) return true;
    return this.isTargetDepartmentManager(user, ctx.departmentId);
  }

  assertCanMarkAssignmentReadyForReview(
    user: RequestUser,
    ctx: AssignmentAccessContext | null,
  ): void {
    if (!ctx) {
      throw new NotFoundException('Assignment not found');
    }
    if (!this.canMarkAssignmentReadyForReview(user, ctx)) {
      throw new ForbiddenException(
        'Only the target department manager can mark work ready for review.',
      );
    }
  }

  canCompleteAssignment(
    user: RequestUser,
    ctx: AssignmentAccessContext,
  ): boolean {
    if (this.isAdmin(user)) return true;
    return this.isTargetDepartmentManager(user, ctx.departmentId);
  }

  assertCanCompleteAssignment(
    user: RequestUser,
    ctx: AssignmentAccessContext | null,
  ): void {
    if (!ctx) {
      throw new NotFoundException('Assignment not found');
    }
    if (!this.canCompleteAssignment(user, ctx)) {
      throw new ForbiddenException(
        'Only the target department manager can mark work completed.',
      );
    }
  }

  canMutateMilestone(
    user: RequestUser,
    ctx: AssignmentAccessContext,
    ownerUserId: string,
  ): boolean {
    if (this.isAdmin(user)) return true;
    if (this.isTargetDepartmentManager(user, ctx.departmentId)) return true;
    return (
      this.isAssignmentMember(user, ctx.memberUserIds) &&
      ownerUserId === user.id
    );
  }

  assertCanMutateMilestone(
    user: RequestUser,
    ctx: AssignmentAccessContext | null,
    ownerUserId: string,
  ): void {
    if (!ctx) {
      throw new NotFoundException('Assignment not found');
    }
    if (!this.canMutateMilestone(user, ctx, ownerUserId)) {
      throw new ForbiddenException('You can only update milestones you own.');
    }
  }

  canRequestMissingInformation(
    user: RequestUser,
    ctx: RequestAccessContext,
  ): boolean {
    if (this.isAdmin(user)) return true;
    return this.isTargetDepartmentManager(user, ctx.targetDepartmentId);
  }

  assertCanRequestMissingInformation(
    user: RequestUser,
    ctx: RequestAccessContext | null,
  ): void {
    if (!ctx) {
      throw new NotFoundException('Request not found');
    }
    if (!this.canRequestMissingInformation(user, ctx)) {
      throw new ForbiddenException(
        'Only the target department manager can request missing information.',
      );
    }
  }

  canChangeRequestStatus(
    user: RequestUser,
    ctx: RequestAccessContext,
    status: RequestStatus,
  ): boolean {
    if (this.isAdmin(user)) return true;

    if (REQUESTER_ONLY_STATUSES.has(status)) {
      return this.isRequester(user, ctx.createdByUserId);
    }
    if (MANAGER_INBOX_STATUSES.has(status)) {
      return this.isTargetDepartmentManager(user, ctx.targetDepartmentId);
    }
    if (status === 'IN_PROGRESS') {
      if (this.isTargetDepartmentManager(user, ctx.targetDepartmentId)) {
        return true;
      }
      return (
        ctx.memberUserIds.length > 0 &&
        this.isAssignmentMember(user, ctx.memberUserIds)
      );
    }
    if (MANAGER_WORK_STATUSES.has(status)) {
      return this.isTargetDepartmentManager(user, ctx.targetDepartmentId);
    }
    if (status === 'SUBMITTED') {
      return this.isRequester(user, ctx.createdByUserId);
    }
    return false;
  }

  assertCanChangeRequestStatus(
    user: RequestUser,
    ctx: RequestAccessContext | null,
    status: RequestStatus,
  ): void {
    if (!ctx) {
      throw new NotFoundException('Request not found');
    }
    if (!this.canViewRequest(user, ctx)) {
      throw new NotFoundException('Request not found');
    }
    if (!this.canChangeRequestStatus(user, ctx, status)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action on the request.',
      );
    }
  }
}
