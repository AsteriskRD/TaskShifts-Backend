import { Request, Response } from 'express';
import { ProviderModel } from '../models/user';
import { uploadToCloudinary } from '../utils/cloudinary';
import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';
import { KycStep1Dto } from '../dto/kyc-step1.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { findProviderById } from '../utils/userUtils';


// POST - Create kyc step 1 datas
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


// GET — Return Step 1 data (for editing)
export const getKycStep1Data = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const provider = await findProviderById(userId);

  if (!provider) return res.status(404).json({ message: 'Provider not found' });

  // Can only edit if not yet verified
  if (provider.kycStatus === 'verified') {
    return res.status(403).json({ message: 'Cannot edit after verification' });
  }

  return res.json({
    success: true,
    data: {
      firstName: provider.firstName,
      lastName: provider.lastName,
      phone: provider.phone,
      gender: provider.gender,
      dateOfBirth: provider.dateOfBirth,
      bio: provider.bio,
      profilePicture: provider.profilePicture,
    },
  });
};


// PATCH — Update Step 1 data from any step
export const updateKycStep1Data = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const provider = await findProviderById(userId);

  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  if (provider.kycStatus === 'verified') {
    return res.status(403).json({ message: 'Cannot edit after verification' });
  }

  const { firstName, lastName, phone, gender, dateOfBirth, bio } = req.body;

  // Handle text fields
  if (firstName) provider.firstName = firstName;
  if (lastName) provider.lastName = lastName;
  if (phone) provider.phone = phone;
  if (gender) provider.gender = gender;
  if (dateOfBirth) provider.dateOfBirth = new Date(dateOfBirth);
  if (bio !== undefined) provider.bio = bio || '';

  // Handle profile picture upload (optional)
  if (req.file) {
    try {
      // Delete old picture from Cloudinary if exists
      if (provider.profilePicture) {
        const publicId = provider.profilePicture.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`kyc/profiles/${publicId}`);
        }
      }

      // Upload new one
      const result = await uploadToCloudinary(req.file.path, 'kyc/profiles');
      provider.profilePicture = result.secure_url;

      // Clean up temp file
      await fs.unlink(req.file.path).catch(() => {});
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      return res.status(500).json({ message: 'Failed to update profile picture' });
    }
  }

  await provider.save();

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      profilePicture: provider.profilePicture,
      firstName: provider.firstName,
      // ... other fields
    },
  });
};
