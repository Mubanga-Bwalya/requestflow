import { validate } from 'class-validator';
import { FieldType } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateTemplateFieldDto } from './dto/create-template-field.dto';
import { UpdateTemplateFieldDto } from './dto/update-template-field.dto';

describe('template DTO validation', () => {
  it('rejects create template without department UUID', async () => {
    const dto = Object.assign(new CreateTemplateDto(), {
      departmentId: 'not-a-uuid',
      name: 'Test template',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'departmentId')).toBe(true);
  });

  it('rejects empty template name', async () => {
    const dto = Object.assign(new CreateTemplateDto(), {
      departmentId: 'e1111111-1111-4111-8111-111111110001',
      name: '',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('requires options for dropdown fields', async () => {
    const dto = Object.assign(new CreateTemplateFieldDto(), {
      label: 'Priority',
      fieldType: FieldType.DROPDOWN,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'options')).toBe(true);
  });

  it('accepts valid dropdown field with options', async () => {
    const dto = Object.assign(new CreateTemplateFieldDto(), {
      label: 'Priority',
      fieldType: FieldType.DROPDOWN,
      options: ['Low', 'High'],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid field type enum', async () => {
    const dto = Object.assign(new CreateTemplateFieldDto(), {
      label: 'Notes',
      fieldType: 'NOT_A_TYPE',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'fieldType')).toBe(true);
  });

  it('rejects empty option strings on update', async () => {
    const dto = Object.assign(new UpdateTemplateFieldDto(), {
      fieldType: FieldType.MULTI_SELECT,
      options: ['Valid', ''],
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'options')).toBe(true);
  });
});
