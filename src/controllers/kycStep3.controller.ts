import { Request, Response } from 'express';
import { IServiceInput } from "../interfaces/serviceInput";
import { ProviderModel } from '../models/user';
import { uploadToCloudinary } from '../utils/cloudinary';
import fs from 'fs/promises';
import { findProviderById } from '../utils/userUtils';
/*
interface IServiceInput {
  serviceType: string;
  category: string;
  subcategory: string;
  description: string;
  skills: { area: string; level: string; experience: string }[];
  packages: {
    name: string;
    price: number;
    currency: string;
    deliveryTime: string;
    description: string;
  }[];
  portfolio: {
    file: Express.Multer.File;
    skillLevel: string;
    experience: string;
    description: string;
  }[];
  additionalSettings: {
    serviceDescription: string;
    cancellationPolicy: string;
  };
  agreeToTerms: boolean;
}
*/
export const kycStep3 = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const provider = await findProviderById(userId);
    if (!provider || provider.userType !== 'provider')
      return res.status(404).json({ message: 'Provider not found' });

    if (provider.kycStatus === 'verified')
      return res.status(400).json({ message: 'kyc already completed' });

    if (provider.kycStatus !== 'pending')
      return res.status(400).json({ message: 'Complete previous steps first' });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files) console.log("files :", files);
    const services: IServiceInput[] = JSON.parse(req.body.services);

    if (!services || services.length === 0)
      return res.status(400).json({ message: 'At least one service is required' });

    for (const service of services) {
      if (!service.agreeToTerms)
        return res.status(400).json({ message: 'You must agree to terms for each service' });

      const portfolioUrls = await Promise.all(
        service.portfolio.map(async (item: any) => {
          const file = (files as Express.Multer.File[]).find(f => f.fieldname === item.fileField);
          
	  if (!file) {
     	    console.warn(`Missing file for ${item.fileField} — skipping`);
      	    return {
              filePath: "",
              skillLevel: item.skillLevel,
              experience: item.experience,
              description: item.description,
            };
          }

	  const result = await uploadToCloudinary(file.path, `portfolio/${provider._id}`);
    	  await fs.unlink(file.path).catch(() => {});

	  return {
            filePath: result.secure_url,
            skillLevel: item.skillLevel,
            experience: item.experience,
      	    description: item.description,
    	  };
        })
      );

      provider.servicesRender.push({
        serviceType: service.serviceType,
        category: service.category,
        subcategory: service.subcategory,
        description: service.description,
        skills: service.skills,
        packages: service.packages.map(p => ({
          ...p,
          price: Number(p.price),
          currency: p.currency || 'NGN',
        })),
        portfolio: portfolioUrls,
        additionalSettings: service.additionalSettings,
        agreeToTerms: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Finalize KYC
    provider.kycStatus = 'verified';

    provider.kycProgress = {
      ...provider.kycProgress,
      currentStep: 3,
      step3Completed: true,
    };

    await provider.save();

    return res.status(200).json({
      message: 'Services added successfully! Your account is verified.',
      kycStatus: provider.kycStatus,
      servicesCount: provider.servicesRender.length,
    });
  } catch (error: any) {
    console.error('KYC Step 3 error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};
