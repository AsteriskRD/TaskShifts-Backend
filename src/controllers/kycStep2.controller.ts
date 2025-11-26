// src/controllers/kycStep2.controller.ts
import { Request, Response } from 'express';
import { ProviderModel } from '../models/user';
import { KycDocumentModel } from '../models/kycDocument';
import { uploadToCloudinary } from '../utils/cloudinary';
import { KycStep2Dto } from '../dto/kyc-step2.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import fs from 'fs/promises';

export const kycStep2 = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const provider = await ProviderModel.findById(userId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.kycStatus !== 'pending') {
      return res.status(400).json({ message: 'Complete Step 1 first or KYC already submitted' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Document file is required' });
    }

    // Validate metadata
    const dto = plainToInstance(KycStep2Dto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.path,
      `kyc/documents/${provider._id}`
    );

    // Save document record
    const kycDoc = new KycDocumentModel({
      providerId: provider._id,
      documentType: dto.documentType,
      registrationNumber: dto.registrationNumber?.trim() || undefined,
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
    });

    await kycDoc.save();

    // Cleanup temp file
    await fs.unlink(req.file.path).catch(() => {});

    // Check if both documents are now uploaded → auto-advance status if you want
    const docsCount = await KycDocumentModel.countDocuments({ providerId: provider._id });
    if (docsCount >= 2) {
      provider.kycStatus = 'pending'; // stays pending until admin verifies, or change to 'verified' if auto-approve
    }

    await provider.save();

    return res.status(200).json({
      message: 'Document uploaded successfully',
      documentType: kycDoc.documentType,
      fileUrl: kycDoc.fileUrl,
      kycStatus: provider.kycStatus,
    });
  } catch (error) {
    console.error('KYC Step 2 error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
