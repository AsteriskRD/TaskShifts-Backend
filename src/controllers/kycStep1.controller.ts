import { Request, Response } from 'express';
import { ProviderModel } from '../models/user';
import { uploadToCloudinary } from '../utils/cloudinary';
import { KycStep1Dto } from '../dto/kyc-step1.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { findProviderById } from '../utils/userUtils';

export const kycStep1 = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const provider = await findProviderById(userId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Only providers can complete KYC' });
    }

    // Validate text fields
    const dto = plainToInstance(KycStep1Dto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Handle profile picture upload (single file)
    let profilePictureUrl: string | undefined;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, 'kyc/profiles');
        profilePictureUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({ message: 'Failed to upload profile picture' });
      }
    }

    // Update provider with Step 1 data
    provider.firstName = dto.firstName.trim();
    provider.lastName = dto.lastName.trim();
    provider.phone = dto.phone?.trim();
    provider.gender = dto.gender;
    provider.dateOfBirth = new Date(dto.dateOfBirth);
    provider.bio = dto.bio?.trim();
    if (profilePictureUrl) {
      provider.profilePicture = profilePictureUrl;
    }

    // Move KYC forward
    provider.kycStatus = 'pending';
    provider.kycProgress = {
      currentStep: 2,
      step1Completed: true,
      step2Completed: false,
      step3Completed: false,
    };

    await provider.save();

    return res.status(200).json({
      message: 'KYC Step 1 completed successfully',
      data: {
        firstName: provider.firstName,
        lastName: provider.lastName,
        profilePicture: provider.profilePicture,
        kycStatus: provider.kycStatus,
      },
    });
  } catch (error) {
    console.error('KYC Step 1 error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
