import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RequestsController } from './requests.controller';
import { RequestsCreateService } from './requests-create.service';
import { RequestsLifecycleService } from './requests-lifecycle.service';
import { RequestsMissingInfoLifecycleService } from './requests-missing-info-lifecycle.service';
import { RequestsStatusLifecycleService } from './requests-status-lifecycle.service';
import { RequestNumberService } from './request-number.service';
import { RequestsQueryService } from './requests-query.service';
import { RequestsService } from './requests.service';

@Module({
  imports: [NotificationsModule],
  controllers: [RequestsController],
  providers: [
    RequestsService,
    RequestsQueryService,
    RequestNumberService,
    RequestsCreateService,
    RequestsLifecycleService,
    RequestsStatusLifecycleService,
    RequestsMissingInfoLifecycleService,
  ],
  exports: [RequestsService],
})
export class RequestsModule {}
