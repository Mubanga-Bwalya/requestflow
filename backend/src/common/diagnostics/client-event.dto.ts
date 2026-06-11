import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ClientEventDto {
  @IsIn(['admin', 'user'])
  portal!: 'admin' | 'user';

  @IsString()
  @MaxLength(64)
  code!: string;

  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsString()
  @MaxLength(500)
  pagePath!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiPath?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  statusCode?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  stack?: string;

  @IsOptional()
  @IsIn(['WARN', 'ERROR'])
  level?: 'WARN' | 'ERROR';
}
