import { AccessPolicyService } from './access-policy.service';
import type { RequestUser } from './auth.types';
import type {
  AssignmentAccessContext,
  RequestAccessContext,
} from './access-policy.types';

describe('AccessPolicyService', () => {
  const service = new AccessPolicyService({} as never);

  const requester: RequestUser = {
    id: 'user-requester',
    email: 'a@x.com',
    roleName: 'Employee',
    departmentName: 'HR',
    departmentId: 'dept-hr-src',
    inboxDepartmentName: null,
    managedDepartmentIds: [],
    managedDepartmentNames: [],
  };

  const hrManager: RequestUser = {
    id: 'user-hr-mgr',
    email: 'm@x.com',
    roleName: 'HR Manager',
    departmentName: 'HR',
    departmentId: 'dept-hr',
    inboxDepartmentName: 'HR',
    managedDepartmentIds: ['dept-hr'],
    managedDepartmentNames: ['HR'],
  };

  const marketingManager: RequestUser = {
    id: 'user-mkt-mgr',
    email: 'mm@x.com',
    roleName: 'Marketing Manager',
    departmentName: 'Marketing',
    departmentId: 'dept-mkt',
    inboxDepartmentName: 'Marketing',
    managedDepartmentIds: ['dept-mkt'],
    managedDepartmentNames: ['Marketing'],
  };

  const managerRoleNotAppointed: RequestUser = {
    id: 'user-fake-mgr',
    email: 'fake@x.com',
    roleName: 'HR Manager',
    departmentName: 'HR',
    departmentId: 'dept-hr',
    inboxDepartmentName: null,
    managedDepartmentIds: [],
    managedDepartmentNames: [],
  };

  const member: RequestUser = {
    id: 'user-member',
    email: 't@x.com',
    roleName: 'HR Team Member',
    departmentName: 'HR',
    departmentId: 'dept-hr',
    inboxDepartmentName: null,
    managedDepartmentIds: [],
    managedDepartmentNames: [],
  };

  const admin: RequestUser = {
    id: 'user-admin',
    email: 'admin@x.com',
    roleName: 'Admin',
    departmentName: null,
    departmentId: null,
    inboxDepartmentName: null,
    managedDepartmentIds: [],
    managedDepartmentNames: [],
  };

  const requestCtx: RequestAccessContext = {
    id: 'req-1',
    createdByUserId: requester.id,
    targetDepartmentId: 'dept-hr',
    memberUserIds: [member.id],
  };

  const assignmentCtx: AssignmentAccessContext = {
    id: 'asg-1',
    departmentId: 'dept-hr',
    requestCreatedByUserId: requester.id,
    memberUserIds: [member.id],
  };

  describe('canViewRequest', () => {
    it('allows requester, appointed manager, member, and admin', () => {
      expect(service.canViewRequest(requester, requestCtx)).toBe(true);
      expect(service.canViewRequest(hrManager, requestCtx)).toBe(true);
      expect(service.canViewRequest(member, requestCtx)).toBe(true);
      expect(service.canViewRequest(admin, requestCtx)).toBe(true);
    });

    it('denies unrelated manager and manager role without appointment', () => {
      expect(service.canViewRequest(marketingManager, requestCtx)).toBe(false);
      expect(service.canViewRequest(managerRoleNotAppointed, requestCtx)).toBe(
        false,
      );
    });
  });

  describe('canChangeRequestStatus', () => {
    it('allows requester-only statuses for requester', () => {
      expect(
        service.canChangeRequestStatus(requester, requestCtx, 'APPROVED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(requester, requestCtx, 'REOPENED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'APPROVED'),
      ).toBe(false);
    });

    it('allows manager inbox statuses for appointed department manager only', () => {
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'ACCEPTED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(
          managerRoleNotAppointed,
          requestCtx,
          'ACCEPTED',
        ),
      ).toBe(false);
      expect(
        service.canChangeRequestStatus(
          marketingManager,
          requestCtx,
          'ACCEPTED',
        ),
      ).toBe(false);
    });

    it('allows IN_PROGRESS for members and appointed manager', () => {
      expect(
        service.canChangeRequestStatus(member, requestCtx, 'IN_PROGRESS'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'IN_PROGRESS'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(
          managerRoleNotAppointed,
          requestCtx,
          'IN_PROGRESS',
        ),
      ).toBe(false);
    });

    it('blocks members from READY_FOR_REVIEW and COMPLETED', () => {
      expect(
        service.canChangeRequestStatus(member, requestCtx, 'READY_FOR_REVIEW'),
      ).toBe(false);
      expect(
        service.canChangeRequestStatus(member, requestCtx, 'COMPLETED'),
      ).toBe(false);
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'COMPLETED'),
      ).toBe(true);
    });
  });

  describe('canRequestMissingInformation', () => {
    it('allows appointed manager and admin only', () => {
      expect(service.canRequestMissingInformation(hrManager, requestCtx)).toBe(
        true,
      );
      expect(service.canRequestMissingInformation(admin, requestCtx)).toBe(
        true,
      );
      expect(
        service.canRequestMissingInformation(
          managerRoleNotAppointed,
          requestCtx,
        ),
      ).toBe(false);
    });
  });

  describe('assignment access', () => {
    it('allows view for member, appointed manager, requester, admin', () => {
      expect(service.canViewAssignment(member, assignmentCtx)).toBe(true);
      expect(service.canViewAssignment(hrManager, assignmentCtx)).toBe(true);
      expect(service.canViewAssignment(requester, assignmentCtx)).toBe(true);
      expect(service.canViewAssignment(admin, assignmentCtx)).toBe(true);
    });

    it('denies view for unrelated manager', () => {
      expect(service.canViewAssignment(marketingManager, assignmentCtx)).toBe(
        false,
      );
    });

    it('allows member IN_PROGRESS status only', () => {
      expect(
        service.canChangeAssignmentStatus(member, assignmentCtx, 'IN_PROGRESS'),
      ).toBe(true);
      expect(
        service.canChangeAssignmentStatus(member, assignmentCtx, 'COMPLETED'),
      ).toBe(false);
      expect(
        service.canChangeAssignmentStatus(
          member,
          assignmentCtx,
          'READY_FOR_REVIEW',
        ),
      ).toBe(false);
    });

    it('allows appointed manager to complete assignment', () => {
      expect(
        service.canChangeAssignmentStatus(
          hrManager,
          assignmentCtx,
          'COMPLETED',
        ),
      ).toBe(true);
      expect(service.canCompleteAssignment(hrManager, assignmentCtx)).toBe(
        true,
      );
    });

    it('allows mark ready for review for appointed manager and admin only', () => {
      expect(
        service.canMarkAssignmentReadyForReview(hrManager, assignmentCtx),
      ).toBe(true);
      expect(
        service.canMarkAssignmentReadyForReview(admin, assignmentCtx),
      ).toBe(true);
      expect(
        service.canMarkAssignmentReadyForReview(member, assignmentCtx),
      ).toBe(false);
    });
  });

  describe('milestone access', () => {
    it('allows members to edit only their own milestones', () => {
      expect(service.canMutateMilestone(member, assignmentCtx, member.id)).toBe(
        true,
      );
      expect(
        service.canMutateMilestone(member, assignmentCtx, 'other-user'),
      ).toBe(false);
      expect(
        service.canMutateMilestone(hrManager, assignmentCtx, 'other-user'),
      ).toBe(true);
    });
  });
});
