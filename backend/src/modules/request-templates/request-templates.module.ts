import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RequestTemplatesController } from './request-templates.controller';
import { RequestTemplatesFacade } from './request-templates.facade';
import { RequestTemplatesService } from './request-templates.service';
import { TemplateFieldsService } from './template-fields.service';

@Module({
  imports: [AuthModule],
  controllers: [RequestTemplatesController],
  providers: [
    RequestTemplatesFacade,
    RequestTemplatesService,
    TemplateFieldsService,
  ],
  exports: [RequestTemplatesFacade, RequestTemplatesService],
})
export class RequestTemplatesModule {}
