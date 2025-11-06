import { Request, Response } from 'express';
import { ClientModel, ProviderModel, UserModel } from '../models/user';
import { getCoordinates } from '../utils/geocode';
import { LocationDetails } from '../interfaces/user';

/**
 * POST /api/profile/complete
 * Completes a Google user's profile (client or provider) by collecting their contact and location info.
 * - Works for both clients and providers.
 * - Requires userType in body or fetched from DB.
 */
export const completeProfile = async (req: Request, res: Response) => {
  try {
    const {
      email,
      phone,
      alternatePhone,
      gender,
      dateOfBirth,
      address,
      city,
      country,
      state,
      postalCode,
      service,
      availability,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'TaskShift: Email is required to complete profile.',
      });
    }

    // Find user across all user types
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'TaskShift: User not found.',
      });
    }

    // Skip if already complete
    if (user.isProfileComplete) {
      return res.status(200).json({
        success: true,
        message: 'TaskShift: Profile already completed.',
      });
    }

    // Determine model (Client or Provider)
    let fullUser;

    if (user.userType === 'provider') {
      fullUser = await (ProviderModel as typeof ProviderModel).findOne({ email });
    } else {
      fullUser = await (ClientModel as typeof ClientModel).findOne({ email });
    }

    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: `${user.userType} record not found.`,
      });
    }

    // Get coordinates using OpenCage → Google fallback
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
      coordinates: coords ? [coords.longitude, coords.latitude] : [0, 0],
    };

    // Assign updated data
    fullUser.phone = phone;
    fullUser.alternatePhone = alternatePhone || "";
    fullUser.gender = gender;
    fullUser.dateOfBirth = dateOfBirth;
    fullUser.location = location;
    fullUser.isProfileComplete = true;

    // Provider-specific fields
    if (fullUser.userType === 'provider') {
      if (service) fullUser.service = service;
      if (availability) fullUser.availability = availability;
    }

    await fullUser.save();

    return res.status(200).json({
      success: true,
      message: `TaskShift: ${fullUser.userType} profile completed successfully.`,
      data: {
        email: fullUser.email,
        userType: fullUser.userType,
        location: fullUser.location,
        phone: fullUser.phone,
        ...(fullUser.userType === 'provider' && {
          service: fullUser.service,
          availability: fullUser.availability,
        }),
      },
    });
  } catch (error: any) {
    console.error('TaskShifts: Complete profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'TaskShifts: Failed to complete profile.',
      error: error.message,
    });
  }
};
