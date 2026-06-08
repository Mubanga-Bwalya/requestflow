import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RequestsModule } from '../requests/requests.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [
    PrismaModule,
    RequestsModule,
    AssignmentsModule,
    NotificationsModule,
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
})
export class WorkspaceModule {}
