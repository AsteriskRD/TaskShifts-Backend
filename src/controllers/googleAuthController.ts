import { Request, Response } from 'express';
import axios from 'axios';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { UserModel, ClientModel, ProviderModel } from '../models/user';
import { LocationDetails } from '../interfaces/user';

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
        message: 'Missing Google token or user type.',
      });
    }

    // Verify Google token
    const googleRes = await axios.get(`${GOOGLE_TOKEN_INFO_URL}?id_token=${token}`);
    const { email, sub: googleId, given_name: firstName, family_name: lastName, email_verified } = googleRes.data;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google account not verified.',
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Account with this Google email already exists. Please login instead.',
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

    const Model = userType === 'client' ? ClientModel : ProviderModel;
    const newUser = await Model.create(baseData);

    const jwtToken = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Google signup successful. Complete your profile to continue.',
      token: jwtToken,
      data: {
        email: newUser.email,
        userType: newUser.userType,
        isProfileComplete: newUser.isProfileComplete,
      },
    });
  } catch (error: any) {
    console.error('Google Signup Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Google signup failed.',
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
        message: 'Missing Google token.',
      });
    }

    // Verify token with Google
    const googleRes = await axios.get(`${GOOGLE_TOKEN_INFO_URL}?id_token=${token}`);
    const { email, email_verified } = googleRes.data;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google account not verified.',
      });
    }

    // Check if user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this Google email. Please sign up first.',
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
        message: 'Profile incomplete. Redirect to profile form.',
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
      message: 'Login successful.',
      token: jwtToken,
      data: {
        email: user.email,
        userType: user.userType,
        isProfileComplete: true,
      },
    });
  } catch (error: any) {
    console.error('Google Login Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Google login failed.',
      error: error.response?.data || error.message,
    });
  }
};
