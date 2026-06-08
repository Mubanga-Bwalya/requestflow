import { Priority } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  systemName?: string;

  @IsOptional()
  @IsEnum(Priority)
  defaultPriority?: Priority;

  @IsOptional()
  @IsBoolean()
  allowUploads?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnStatusChange?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  fileUploadLimitMb?: number;
}
