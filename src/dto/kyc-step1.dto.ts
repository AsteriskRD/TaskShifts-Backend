import { IsString, IsDateString, IsEnum, IsOptional, IsUrl } from 'class-validator';

export class KycStep1Dto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other', 'Prefer not to say'])
  gender?: string;

  @IsDateString()
  dateOfBirth: string; // ISO string

  @IsString()
  @IsOptional()
  bio?: string;
}
