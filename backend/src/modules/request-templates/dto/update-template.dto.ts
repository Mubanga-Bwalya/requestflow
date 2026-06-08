import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
