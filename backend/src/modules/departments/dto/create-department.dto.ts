import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  externalDepartmentCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  cloneTemplatesFromDepartmentId?: string;

  /** When set, creates this as a sub-section under the given top-level department. */
  @IsOptional()
  @IsUUID()
  parentDepartmentId?: string;

  /** Optional manager to assign on creation (typically used for sections). */
  @IsOptional()
  @IsUUID()
  managerUserId?: string;
}
