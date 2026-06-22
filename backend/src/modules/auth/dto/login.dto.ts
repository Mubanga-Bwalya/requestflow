import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** Zamtel staff login: GN (staff number) + AD password forwarded to the staff service. */
export class StaffLoginDto {
  @IsString()
  @MinLength(1)
  gn!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

/** Dev-only login by email (no password). Disabled in production. */
export class DevLoginDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;
}
