import { Request, Response } from 'express';
import axios from 'axios';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { UserModel, ClientModel, ProviderModel } from '../models/user';
import { LocationDetails } from '../interfaces/user';
import { findUserByEmail } from '../utils/userUtils';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

/**
 * ===============================
 *   GOOGLE SIGNUP CONTROLLER
 * ===============================
 * Allows both clients and providers to sign up via Google.
 * Requires `userType` in body.
 */
export const googleSignup = async (req: Request, res: Response) => {
  try {
    const { token, userType } = req.body;

    if (!token || !userType) {
      return res.status(400).json({
        success: false,
        message: 'TaskShifts: Missing Google token or user type.',
      });
    }

    // Verify Google token
    const googleRes = await axios.get(`${GOOGLE_TOKEN_INFO_URL}?id_token=${token}`);
    const { email, sub: googleId, given_name: firstName, family_name: lastName, email_verified } = googleRes.data;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'TaskShifts: Google account not verified.',
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'TaskShifts: Account with this Google email already exists. Please login instead.',
      });
    }

    // Create new user (isProfileComplete = false)
    const baseData = {
      email,
      googleId,
      firstName,
      lastName,
      userType,
      isVerified: true, // Google verified
      isProfileComplete: false,
      termsAccepted: true,
    };

    if (userType === 'client') {
      const newUser = await (ClientModel as typeof ClientModel).create(baseData);
      // Generate access token
      const jwtToken = generateAccessToken(newUser);
      return res.status(201).json({
        success: true,
        message: 'TaskShifts: Google signup successful. Complete your profile to continue.',
        token: jwtToken,
        data: {
          email: newUser.email,
          userType: newUser.userType,
          isProfileComplete: newUser.isProfileComplete,
        },
      });
    } else {
      const newUser = await (ProviderModel as typeof ProviderModel).create(baseData);
      // Generate access token
      const jwtToken = generateAccessToken(newUser);
      return res.status(201).json({
        success: true,
        message: 'TaskShifts: Google signup successful. Complete your profile to continue.',
        token: jwtToken,
        data: {
          email: newUser.email,
          userType: newUser.userType,
          isProfileComplete: newUser.isProfileComplete,
        },
      });
    }
  } catch (error: any) {
    console.error('Google Signup Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'TaskShifts: Google signup failed.',
      error: error.response?.data || error.message,
    });
  }
};

/**
 * ===============================
 *   GOOGLE LOGIN CONTROLLER
 * ===============================
 * Only logs in existing users.
 * Does NOT auto-create users if email not found.
 */
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'TaskShifts: Missing Google token.',
      });
    }

    // Verify token with Google
    const googleRes = await axios.get(`${GOOGLE_TOKEN_INFO_URL}?id_token=${token}`);
    const { email, email_verified } = googleRes.data;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'TaskShifts: Google account not verified.',
      });
    }

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'TaskShifts: No account found with this Google email. Please sign up first.',
        signupRequired: true,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send refresh token to HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Handle profile completion
    if (!user.isProfileComplete) {
      return res.status(200).json({
        success: true,
        message: 'TaskShifts: Profile incomplete. Redirect to profile form.',
        accessToken,
        data: {
          email: user.email,
          userType: user.userType,
          isProfileComplete: false,
        },
      });
    }
    return res.status(200).json({
      success: true,
      message: 'TaskShifts: Login successful.',
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,        // 'client' | 'provider'
        userRole: user.userRole || 'user',  // 'user' | 'admin'                                                                                                 
        // Personal info
        gender: user.gender || null,
        phone: user.phone || null,
        alternatePhone: user.alternatePhone || null,
        dateOfBirth: user.dateOfBirth || null,
        bio: user.bio || '',
        profilePicture: user.profilePicture || null,

        // Status flags
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        isPremium: user.isPremium,
        termsAccepted: user.termsAccepted,

        // Location
        location: user.location || null,

        // Provider-only fields
        ...(user.userType === 'provider' && {
          service: user.service || null,
          availability: user.availability ?? true,
          kycStatus: user.kycStatus || 'incomplete',
          kycProgress: user.kycProgress || {
            currentStep: 1,
            step1Completed: false,
            step2Completed: false,
            step3Completed: false,
          },
          servicesRender: user.servicesRender || [],
        }),
      },
    });
  } catch (error: any) {
    console.error('Google Login Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'TaskShifts: Google login failed.',
      error: error.response?.data || error.message,
    });
  }
};
