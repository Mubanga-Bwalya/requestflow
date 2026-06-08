import { Priority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateRequestFieldAnswerDto {
  @IsString()
  fieldKey!: string;

  @IsOptional()
  @IsString()
  answerText?: string;

  @IsOptional()
  answerJson?: unknown;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class CreateRequestDto {
  @IsString()
  @MinLength(1)
  targetDepartmentName!: string;

  @IsUUID()
  templateId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequestFieldAnswerDto)
  fieldAnswers!: CreateRequestFieldAnswerDto[];
}
