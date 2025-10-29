import { Request, Response } from 'express';
import { ClientModel } from '../models/user';
import { getCoordinates } from '../utils/geocode';
import { LocationDetails } from '../interfaces/user';

/**
 * POST /auth/complete-profile
 * Completes a Google user's profile by collecting their location and contact info.
 */
export const completeClientProfile = async (req: Request, res: Response) => {
  try {
    const { email, phone, address, city, country, state, postalCode } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const client = await ClientModel.findOne({ email });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Skip if already complete
    if (client.isProfileComplete) {
      return res.status(200).json({ success: true, message: 'Profile already completed' });
    }

    // Use OpenCage/Google fallback for coordinates
    let coords = null;
    if (postalCode && country) {
      coords = await getCoordinates(postalCode, country);
    }

    const location: LocationDetails = {
      address,
      city,
      country,
      state,
      postalCode,
      coordinates: coords
        ? [coords.longitude, coords.latitude]
        : [0, 0],
    };

    client.phone = phone;
    client.location = location;
    client.isProfileComplete = true;
    await client.save();

    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        email: client.email,
        location: client.location,
        phone: client.phone,
      },
    });
  } catch (error: any) {
    console.error('TaskShifts: Complete profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'TaskShifts: Failed to complete profile',
      error: error.message,
    });
  }
};
