import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getCoordinates } from '../utils/geocode';
import { generateToken } from '../middleware/auth';
import { LocationDetails } from '../interfaces/user';
import { UserModel, ClientModel, ProviderModel } from '../models/user';
import { sendVerificationEmail } from '../services/verifyEmailService';

/**
 * ======================================
 *     REGISTER WITH EMAIL + PASSWORD
 * ======================================
 */
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

    // Use OpenCage/Google fallback for coordinates
    let coords = null;
    if (postalCode && country) {
      coords = await getCoordinates(postalCode, country);
    }
    const userLocation: LocationDetails = {
      address,
      city,
      country,
      state,
      postalCode,
      coordinates: coords
        ? [coords.longitude, coords.latitude]
        : [0, 0],
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
      isVerified: false,
      isProfileComplete: true,
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


/**
 * ======================================
 *       LOGIN WITH EMAIL + PASSWORD
 * ======================================
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please sign up first.',
      });
    }

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please try again.',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Handle incomplete profile
    if (!user.isProfileComplete) {
      return res.status(200).json({
        success: true,
        message: 'Profile incomplete. Redirect to profile completion form.',
        token,
        data: {
          email: user.email,
          userType: user.userType,
          isProfileComplete: false,
        },
      });
    }

    // Successful login
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        email: user.email,
        userType: user.userType,
        isProfileComplete: true,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed due to a server error.',
      error: error.message,
    });
  }
};


/**
 * ======================================
 *       VERIFY EMAIL
 * ======================================
 */
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
