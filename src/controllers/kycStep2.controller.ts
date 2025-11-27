import { Request, Response } from 'express';
import { ProviderModel } from '../models/user';
import { KycDocumentModel } from '../models/kycDocument';
import { uploadToCloudinary } from '../utils/cloudinary';
import { KycDocumentUploadDto } from '../dto/kyc-step2.dto';
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
      return res.status(400).json({ message: 'Complete Step 1 first' });
    }

    // Accept multiple files: businessDoc, addressDoc, identityFront, identityBack
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: 'At least one document is required' });
    }

    const uploaded: any[] = [];

    // Helper to upload one file
    const processFile = async (file: Express.Multer.File, dto: KycDocumentUploadDto) => {
      const result = await uploadToCloudinary(file.path, `kyc/documents/${provider._id}`);
      
      const doc = new KycDocumentModel({
        providerId: provider._id,
        documentType: dto.documentType,
        businessRegistrationType: dto.businessRegistrationType,
        registrationNumber: dto.registrationNumber,
        proofOfAddressType: dto.proofOfAddressType,
        proofOfIdentityType: dto.proofOfIdentityType,
        idNumber: dto.idNumber,
        side: dto.side,
        fileUrl: result.secure_url,
        filePublicId: result.public_id,
      });

      await doc.save();
      uploaded.push({ type: dto.documentType, side: dto.side, url: result.secure_url });

      // Cleanup
      await fs.unlink(file.path).catch(() => {});
    };

    // Parse metadata (sent as JSON array in "documents" field)
    const documents: KycDocumentUploadDto[];
    try {
      documents = JSON.parse(req.body.documents);
    } catch {
      return res.status(400).json({ message: 'Invalid documents metadata' });
    }

    if (documents.length !== Object.keys(files).length) {
      return res.status(400).json({ message: 'File count mismatch' });
    }

    // Match files to metadata and upload
    for (const dto of documents) {
      let fileArray;
      if (dto.documentType === 'businessRegistration') fileArray = files.businessDoc;
      else if (dto.documentType === 'proofOfAddress') fileArray = files.addressDoc;
      else if (dto.documentType === 'proofOfIdentity' && dto.side === 'front') fileArray = files.identityFront;
      else if (dto.documentType === 'proofOfIdentity' && dto.side === 'back') fileArray = files.identityBack;

      const file = fileArray?.[0];
      if (!file) {
        return res.status(400).json({ message: `Missing file for ${dto.documentType} ${dto.side || ''}` });
      }

      // Validate each DTO
      const instance = plainToInstance(KycDocumentUploadDto, dto);
      const errors = await validate(instance);
      if (errors.length > 0) return res.status(400).json({ message: 'Validation error', errors });

      await processFile(file, dto);
    }

    // Optional: auto-advance status when all 3 types are present
    const types = await KycDocumentModel.distinct('documentType', { providerId: provider._id });
    if (types.length >= 3) {
      provider.kycStatus = 'pending';
      await provider.save();
    }

    return res.status(200).json({
      message: 'All documents uploaded successfully',
      uploaded,
      kycStatus: provider.kycStatus,
    });

  } catch (error) {
    console.error('KYC Step 2 error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
