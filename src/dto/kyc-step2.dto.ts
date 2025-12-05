import { IsString, IsIn, IsOptional, IsEnum } from 'class-validator';

export class KycDocumentUploadDto {
  @IsIn(['businessRegistration', 'proofOfAddress', 'proofOfIdentity'])
  documentType: 'businessRegistration' | 'proofOfAddress' | 'proofOfIdentity';

  @IsOptional()
  @IsString()
  businessRegistrationType?: string; 

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  proofOfAddressType?: string;

  @IsOptional()
  @IsString()
  proofOfIdentityType?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsEnum(['front', 'back'])
  side?: 'front' | 'back'; // only used for proofOfIdentity
}
