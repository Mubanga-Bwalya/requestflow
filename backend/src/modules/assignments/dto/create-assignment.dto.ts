import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  requestId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  memberUserIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
