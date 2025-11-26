import { IsString, IsOptional, IsIn } from 'class-validator';

export class KycStep2Dto {
  @IsIn(['businessRegistration', 'proofOfAddress'])
  documentType: 'businessRegistration' | 'proofOfAddress';

  @IsString()
  @IsOptional()
  registrationNumber?: string; // only required for business registration in frontend if you want
}
