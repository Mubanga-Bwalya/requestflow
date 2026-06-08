import { RequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ProvideMissingInformationFieldDto {
  @IsString()
  fieldKey!: string;

  @IsOptional()
  @IsString()
  answerText?: string;

  @IsOptional()
  answerJson?: unknown;
}

export class ProvideMissingInformationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvideMissingInformationFieldDto)
  fieldAnswers!: ProvideMissingInformationFieldDto[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class MissingInformationItemDto {
  @IsOptional()
  @IsString()
  fieldKey?: string;

  @IsString()
  @MinLength(1)
  reasonLabel!: string;
}

export class RequestMissingInformationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissingInformationItemDto)
  items!: MissingInformationItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
