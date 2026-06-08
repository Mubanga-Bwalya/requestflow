import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { RequestTemplatesFacade } from './request-templates.facade';
import { wantsPagination } from '../../common/pagination';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateTemplateFieldDto } from './dto/create-template-field.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateTemplateFieldDto } from './dto/update-template-field.dto';

@Controller('request-templates')
export class RequestTemplatesController {
  constructor(
    private readonly requestTemplatesService: RequestTemplatesFacade,
  ) {}

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Body() body: CreateTemplateDto) {
    return this.requestTemplatesService.create(body);
  }

  @Get()
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('departmentName') departmentName?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const paginate = wantsPagination(page, limit);
    const isActiveFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.requestTemplatesService.findAll({
      departmentId,
      departmentName,
      activeOnly: isActiveFilter === undefined ? activeOnly !== 'false' : false,
      isActive: isActiveFilter,
      ...(paginate
        ? {
            page: parseInt(page ?? '1', 10),
            limit: parseInt(limit ?? '20', 10),
          }
        : {}),
    });
  }

  @Get(':id/fields')
  findFields(
    @Param('id') id: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.requestTemplatesService.findFields(id, activeOnly !== 'false');
  }

  @Post(':id/fields')
  @UseGuards(AdminRoleGuard)
  createField(@Param('id') id: string, @Body() body: CreateTemplateFieldDto) {
    return this.requestTemplatesService.createField(id, body);
  }

  @Patch(':templateId/fields/:fieldId/deactivate')
  @UseGuards(AdminRoleGuard)
  deactivateField(
    @Param('templateId') templateId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.requestTemplatesService.deactivateField(templateId, fieldId);
  }

  @Patch(':templateId/fields/:fieldId')
  @UseGuards(AdminRoleGuard)
  updateField(
    @Param('templateId') templateId: string,
    @Param('fieldId') fieldId: string,
    @Body() body: UpdateTemplateFieldDto,
  ) {
    return this.requestTemplatesService.updateField(templateId, fieldId, body);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  updateTemplate(@Param('id') id: string, @Body() body: UpdateTemplateDto) {
    return this.requestTemplatesService.updateTemplate(id, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('activeOnly') activeOnly?: string) {
    return this.requestTemplatesService.findOne(id, activeOnly !== 'false');
  }
}
