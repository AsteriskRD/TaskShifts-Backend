// src/seeders/createAdmin.ts
import bcrypt from 'bcrypt';
import { ProviderModel } from '../models/user';
import mongoose from 'mongoose';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@taskshifts.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TaskShifts2025!';

export const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await ProviderModel.findOne({ 
      email: ADMIN_EMAIL 
    });

    if (existingAdmin) {
      console.log('Default admin already exists:', ADMIN_EMAIL);
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await ProviderModel.create({
      email: ADMIN_EMAIL,
      passwordHash,
      userType: 'provider',
      userRole: 'admin',
      firstName: 'TaskShifts',
      lastName: 'Admin',
      phone: '+2348000000000',
      gender: 'Prefer not to say',
      isVerified: true,
      isProfileComplete: true,
      termsAccepted: true,
      kycStatus: 'verified',
      kycProgress: {
        currentStep: 3,
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
      },
      profilePicture: 'https://res.cloudinary.com/your-cloud/image/upload/v1/taskshifts/admin-avatar.png',
      servicesRender: [
        {
          serviceType: 'Platform Management',
          category: 'Administration',
          description: 'TaskShifts Platform Administrator',
          skills: [],
          packages: [],
          portfolio: [],
          additionalSettings: { serviceDescription: '', cancellationPolicy: '' },
          agreeToTerms: true,
        }
      ]
    });

    console.log('DEFAULT ADMIN CREATED');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Login at: http://localhost:3000/admin');
  } catch (error: any) {
    console.error('Failed to create default admin:', error.message);
  }
};
