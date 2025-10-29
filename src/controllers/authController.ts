import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { LocationDetails } from '../interfaces/user';
import { UserModel, ClientModel, ProviderModel } from '../models/user';
import sendVerificationEmail from '../services/verifyEmailService';
import axios from 'axios';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, userType, firstName, lastName, phone, location, service, termsAccepted, availability } = req.body;

    // Validation: Password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Validation: Basic email and password checks
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12); // 12 salt rounds
    const verificationCode = crypto.randomBytes(3).toString('hex');
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { address, city, country, state, postalCode } = location || {};

    let coordinates: [number, number] = [0, 0]; // Default
    if (postalCode) {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: { address: postalCode, key: process.env.GOOGLE_MAPS_API_KEY },
        });
        if (response.data.results && response.data.results[0]) {
          const { lat, lng } = response.data.results[0].geometry.location;
          coordinates = [lng, lat];
          // Extract address details from response for completeness (fallback to user input)
          const components = response.data.results[0].address_components;
          location.city = location.city || components.find((comp: any) => comp.types.includes('locality'))?.long_name || city;
          location.country = location.country || components.find((comp: any) => comp.types.includes('country'))?.long_name || country;
          location.state = location.state || components.find((comp: any) => comp.types.includes('administrative_area_level_1'))?.long_name || state;
          location.address = location.address || response.data.results[0].formatted_address;
        } else {
          console.warn('TaskShifts: No geocoding results for postal code', postalCode);
        }
      } catch (geocodeError) {
        console.error('TaskShifts: Geocoding failed for postal code', postalCode, geocodeError);
        // Fallback to user-provided location details (no coordinates)
      }
    }

    const userLocation: LocationDetails = {
      address: address || '',
      city: city || '',
      country: country || '',
      state: state || '',
      postalCode: postalCode || undefined,
      coordinates,
    };

    const userData = {
      email,
      passwordHash,
      userType,
      firstName,
      lastName,
      phone,
      location: userLocation,
      ...(userType === 'provider' && { service, availability }),
      termsAccepted,
      verificationCode,
      verificationCodeExpires,
    };

    const Model = userType === 'client' ? ClientModel : ProviderModel;
    const user = await Model.create(userData);

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      success: true,
      message: 'TaskShifts: Registration successful. Check your email for verification link.',
      data: { userId: user.userId, email: user.email },
    });
  } catch (error) {
    console.error('TaskShifts: Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'TaskShifts: Registration failed',
      error: 'Server error',
    });
  }
};


export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, verificationCode } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user || user.verificationCode !== verificationCode || user.verificationCodeExpires! < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'TaskShifts: Invalid or expired verification code',
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'TaskShifts: Email verified successfully. You can now login.',
    });
  } catch (error) {
    console.error('TaskShifts: Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'TaskShifts: Verification failed',
      error: 'Server error',
    });
  }
};
