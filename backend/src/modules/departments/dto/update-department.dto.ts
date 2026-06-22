import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(64)
  externalDepartmentCode?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  managerUserId?: string | null;

  /** Re-parent this department under a top-level department, or null to make it top-level. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  parentDepartmentId?: string | null;
}
