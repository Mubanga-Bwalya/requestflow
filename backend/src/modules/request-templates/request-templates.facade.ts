import { Injectable } from '@nestjs/common';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { CreateTemplateFieldDto } from './dto/create-template-field.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import type { UpdateTemplateFieldDto } from './dto/update-template-field.dto';
import {
  RequestTemplatesService,
  type ListTemplatesQuery,
} from './request-templates.service';
import { TemplateFieldsService } from './template-fields.service';

/** Facade for controller — templates + fields. */
@Injectable()
export class RequestTemplatesFacade {
  constructor(
    private readonly templates: RequestTemplatesService,
    private readonly fields: TemplateFieldsService,
  ) {}

  findAll(query: ListTemplatesQuery) {
    return this.templates.findAll(query);
  }

  create(dto: CreateTemplateDto) {
    return this.templates.create(dto);
  }

  findOne(id: string, activeFieldsOnly?: boolean) {
    return this.templates.findOne(id, activeFieldsOnly);
  }

  updateTemplate(id: string, dto: UpdateTemplateDto) {
    return this.templates.updateTemplate(id, dto);
  }

  findFields(templateId: string, activeOnly?: boolean) {
    return this.fields.findFields(templateId, activeOnly);
  }

  createField(templateId: string, dto: CreateTemplateFieldDto) {
    return this.fields.createField(templateId, dto);
  }

  updateField(
    templateId: string,
    fieldId: string,
    dto: UpdateTemplateFieldDto,
  ) {
    return this.fields.updateField(templateId, fieldId, dto);
  }

  deactivateField(templateId: string, fieldId: string) {
    return this.fields.deactivateField(templateId, fieldId);
  }
}
