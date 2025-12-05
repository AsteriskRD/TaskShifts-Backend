import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getCoordinates } from '../utils/geocode';
import { generateAccessToken, generateRefreshToken }  from '../middleware/auth';
import { LocationDetails } from '../interfaces/user';
import { UserModel, ClientModel, ProviderModel } from '../models/user';
import { verifyEmailTemplate } from "../emailTemplates/emailTemplate";
import { resetEmailTemplate } from "../emailTemplates/resetTemplates";
import { sendEmail } from "../utils/sendEmail";
import {
  findUserByEmail,
  findUserById,
  findProviderById,
  findUserByResetToken,
} from '../utils/userUtils';

/**
 * ======================================
 *     REGISTER WITH EMAIL + PASSWORD
 * ======================================
 */
export const register = async (req: Request, res: Response) => {
  try {
    const {
      email, 
      password, 
      confirmPassword, 
      userType, 
      firstName, 
      lastName, 
      phone, 
      location, 
      service, 
      termsAccepted, 
      availability 
    } = req.body;

    // Validation: Password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "TaskShifts: Passwords do not match",
      });
    }

    // Validation: Basic email and password checks
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "TaskShifts: Invalid email format",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "TaskShifts: Password must be at least 8 characters",
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "TaskShifts: Email already registered",
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

    // Construct verification link
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    if (userType === 'client') {
      const user = await (ClientModel as typeof ClientModel).create(userData);

      // Send verification email
      await sendEmail({
        email,
        subject: "TaskShifts - Verify Your Email",
        html: verifyEmailTemplate(verificationLink),
      });

      res.status(201).json({
        success: true,
        message: 'TaskShifts: Registration successful. Check your email for verification link.',
        data: { userId: user.userId, email: user.email },
      });
    } else {
      const user = await (ProviderModel as typeof ProviderModel).create(userData);

      // Send verification email
      await sendEmail({
        email,
        subject: "TaskShifts - Verify Your Email",
        html: verifyEmailTemplate(verificationLink),
      });

      res.status(201).json({
        success: true,
        message: 'TaskShifts: Registration successful. Check your email for verification link.',
        data: { userId: user.userId, email: user.email },
      })
    }        
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
        message: 'TaskShifts: Email and password are required.',
      });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'TaskShifts: No account found with this email. Please sign up first.',
      });
    }

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash!);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'TaskShifts: Invalid credentials. Please try again.',
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

    // Handle incomplete profile
    if (!user.isProfileComplete) {
      return res.status(200).json({
        success: true,
        message: 'TaskShifts: Profile incomplete. Redirect to profile completion form.',
        accessToken,
        data: {
          email: user.email,
          userType: user.userType,
          isProfileComplete: user.isProfileComplete,
        },
      });
    }

    if (!user.isVerified) {
      // Generate verification code
      const verificationCode = crypto.randomBytes(3).toString('hex');
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
     
      // Construct verification link
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

      // Send verification email
      await sendEmail({
        email,
        subject: "TaskShifts - Verify Your Email",
        html: verifyEmailTemplate(verificationLink),
      });

      return res.status(403).json({
        success: true,
        message: 'TaskShifts: Email address not verified. verification link sent to your email.',
        data: {
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
        },
      });
    }

    // Successful login
    return res.status(200).json({
      success: true,
      message: 'TaskShifts: Login successful.',
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        gender: user.gender,
        phone: user.phone,
        alternatePhone: user.alternatePhone,
        dateOfBirth: user.dateOfBirth,
        isProfileComplete: user.isProfileComplete,
        location: user.location,
        ...(user.userType === 'provider' && { 
          service: user.service,
          availability: user.availability,
          kycStatus: user.kycStatus,
        }), 
        isVerified: user.isVerified,
        termsAccepted: user.termsAccepted,
        isPremium: user.isPremium,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'TaskShifts: Login failed due to a server error.',
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

    const user = await findUserByEmail(email);
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


/**
 * ======================================
 *     FORGOT PASSWORD
 * ======================================
 */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "TaskShifts: User not found"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save hashed token and expiry
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    // Construct reset link (frontend URL)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await sendEmail({
      email,
      subject: "TaskShifts - Verify Your Email",
      html: resetEmailTemplate(resetLink),
    });

    res.status(200).json({
      success: true,
      message: 'TaskShifts: Password reset link sent to your email'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'TaskShifts: Forgot Password failed',
      error: "Server error"
    });
  }
};


/**
 * ======================================
 *     RESET PASSWORD
 * ======================================
 */
export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await findUserByResetToken(hashedToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "TaskShifts: Invalid or expired token"
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "TaskShifts: Password required"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12); // 12 salt rounds

    // Update password and clear reset fields
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "TaskShifts: Password reset successful"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "TaskShifts: Reset password failed",
      error: "Server error"
    });
  }
};


/**
 * ======================================
 *     CHANGE PASSWORD
 * ======================================
 */
export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const id = (req as any).user.id;

  try {

    // Validation: Password match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "TaskShifts: Passwords do not match",
      });
    } 
    // Verify user
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "TaskShifts: User not found"
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash!);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "TaskShifts: Old password incorrect"
      });
    }
    // Hash new password
    const hashPassword = await bcrypt.hash(newPassword, 12); // 12 salt rounds
    user.passwordHash = hashPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "TaskShifts: Password changed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "TaskShifts: Change password failed",
      error: "Server error"
    });
  }
};


/**
 * ===================================== 
 * LOGOUT
 * Securely logs out user by invalidating refresh tokens.
 * ====================================
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const id = (req.user as any)?.id;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: 'TaskShifts: Unauthorized. Missing user ID.',
      });
    }

    // Increment tokenVersion to invalidate existing refresh tokens
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'TaskShifts: User not found',
      });
    }

    user.tokenVersion += 1;
    await user.save();

    // Clear any HTTP-only refresh cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({
      success: true,
      message: 'TaskShifts: Logged out successfully.',
    });
  } catch (error: any) {
    console.error('TaskShifts Logout Error:', error);
    return res.status(500).json({
      success: false,
      message: 'TaskShifts: Logout failed',
      error: error.message,
    });
  }
};
