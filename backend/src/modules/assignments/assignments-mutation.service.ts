import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../common/auth.types';
import type { CreateAssignmentDto } from './dto/create-assignment.dto';
import type { UpdateAssignmentStatusDto } from './dto/update-assignment.dto';
import { AssignmentsCreateService } from './assignments-create.service';
import { AssignmentsStatusMutationService } from './assignments-status-mutation.service';

/** Facade — keeps AssignmentsService stable while create and status logic stay separate. */
@Injectable()
export class AssignmentsMutationService {
  constructor(
    private readonly createSvc: AssignmentsCreateService,
    private readonly statusSvc: AssignmentsStatusMutationService,
  ) {}

  create(dto: CreateAssignmentDto, user: RequestUser) {
    return this.createSvc.create(dto, user);
  }

  updateStatus(id: string, dto: UpdateAssignmentStatusDto, user: RequestUser) {
    return this.statusSvc.updateStatus(id, dto, user);
  }
}
