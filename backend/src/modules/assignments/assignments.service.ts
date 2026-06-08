import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../common/auth.types';
import type { CreateAssignmentDto } from './dto/create-assignment.dto';
import type {
  CreateMilestoneDto,
  UpdateAssignmentStatusDto,
  UpdateMilestoneDto,
} from './dto/update-assignment.dto';
import { AssignmentsMilestonesService } from './assignments-milestones.service';
import { AssignmentsMutationService } from './assignments-mutation.service';
import { AssignmentsQueryService } from './assignments-query.service';

/** Facade — keeps controller stable while logic lives in focused services. */
@Injectable()
export class AssignmentsService {
  constructor(
    private readonly query: AssignmentsQueryService,
    private readonly mutation: AssignmentsMutationService,
    private readonly milestones: AssignmentsMilestonesService,
  ) {}

  findAllForUser(
    userId: string,
    query?: Parameters<AssignmentsQueryService['findAllForUser']>[1],
  ) {
    return this.query.findAllForUser(userId, query);
  }

  countForUser(userId: string) {
    return this.query.countForUser(userId);
  }

  countToStartForUser(userId: string) {
    return this.query.countToStartForUser(userId);
  }

  findOne(id: string, user: RequestUser) {
    return this.query.findOne(id, user);
  }

  create(dto: CreateAssignmentDto, user: RequestUser) {
    return this.mutation.create(dto, user);
  }

  updateStatus(id: string, dto: UpdateAssignmentStatusDto, user: RequestUser) {
    return this.mutation.updateStatus(id, dto, user);
  }

  createMilestone(
    assignmentId: string,
    dto: CreateMilestoneDto,
    user: RequestUser,
  ) {
    return this.milestones.createMilestone(assignmentId, dto, user);
  }

  updateMilestone(
    assignmentId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
    user: RequestUser,
  ) {
    return this.milestones.updateMilestone(
      assignmentId,
      milestoneId,
      dto,
      user,
    );
  }
}
