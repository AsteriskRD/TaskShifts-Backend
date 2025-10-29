import { Request, Response } from 'express';
import axios from 'axios';
import { ClientModel, UserModel } from '../models/user';
import { generateToken } from '../middleware/auth';
import { LocationDetails } from '../interfaces/user';

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { googleToken, userType } = req.body;

    if (!googleToken) {
      return res.status(400).json({ success: false, message: 'Missing Google token' });
    }

    // Verify token with Google
    const googleResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
    const googleData = googleResponse.data;

    const { email, sub: googleId, given_name: firstName, family_name: lastName } = googleData;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account does not have a verified email' });
    }

    // Check if user already exists
    let user = await UserModel.findOne({ $or: [{ email }, { googleId }] });

    if (user) {
      // Existing user
      if (user.userType !== 'client') {
        return res.status(403).json({ success: false, message: 'Only client accounts can login with Google' });
      }

      if (!user.isProfileComplete) {
        const token = generateJwtToken(user);
        return res.status(200).json({
          success: true,
          message: 'Profile incomplete. Redirect to profile form.',
          token,
          data: { email: user.email, isProfileComplete: false },
        });
      }

      const token = generateToken(user.userId);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { token, user },
      });
    }

    // Create new client user if not found
    const newClient = await ClientModel.create({
      email,
      googleId,
      userType: 'client',
      firstName: firstName || '',
      lastName: lastName || '',
      isProfileComplete: false,
      isVerified: true,
      location: {
        address: '',
        city: '',
        country: '',
        state: '',
        postalCode: '',
        coordinates: [0, 0] as [number, number],
      } as LocationDetails,
    });

    const token = generateToken(newClient.userId);

    return res.status(201).json({
      success: true,
      message: 'New Google client created. Redirect to profile form.',
      data: { token, email: newClient.email, isProfileComplete: false },
    });

  } catch (error: any) {
    console.error('TaskShifts: Google Auth error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'TaskShifts: Google authentication failed',
      error: error.message,
    });
  }
};
