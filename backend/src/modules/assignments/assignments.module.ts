import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsMilestonesService } from './assignments-milestones.service';
import { AssignmentsMutationService } from './assignments-mutation.service';
import { AssignmentsQueryService } from './assignments-query.service';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    AssignmentsQueryService,
    AssignmentsMutationService,
    AssignmentsMilestonesService,
  ],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
