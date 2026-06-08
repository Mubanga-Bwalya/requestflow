import { FieldType } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const OPTION_FIELD_TYPES: FieldType[] = [
  FieldType.DROPDOWN,
  FieldType.MULTI_SELECT,
];

export class CreateTemplateFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  fieldKey?: string;

  @IsEnum(FieldType)
  fieldType!: FieldType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ValidateIf((dto: CreateTemplateFieldDto) =>
    OPTION_FIELD_TYPES.includes(dto.fieldType),
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(120, { each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  displayOrder?: number;
}
