import { AssignmentStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAssignmentStatusDto {
  @IsEnum(AssignmentStatus)
  status!: AssignmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class CreateMilestoneDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsUUID()
  ownerUserId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;
}
