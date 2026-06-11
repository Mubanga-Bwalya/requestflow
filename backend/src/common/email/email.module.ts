import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationEmailService } from './notification-email.service';

@Global()
@Module({
  providers: [EmailService, NotificationEmailService],
  exports: [EmailService, NotificationEmailService],
})
export class EmailModule {}
