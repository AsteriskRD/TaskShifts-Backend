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


/**
 * GET /api/profile/:email
 * Fetches a user's profile details by email.
 * Works for both clients and providers.
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const id = (req.user as any)?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'TaskShifts: Unauthorized. Missing user ID.',
      });
    }

    // Find user across all user types
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'TaskShifts: User not found.',
      });
    }

    // Load full user record based on userType
    let fullUser;
    if (user.userType === 'provider') {
      fullUser = await ProviderModel.findOne({ email: user.email });
    } else {
      fullUser = await ClientModel.findOne({ email: user.email });
    }

    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: `TaskShifts: ${user.userType} record not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'TaskShifts: Profile retrieved successfully.',
      user: {
        userId: fullUser.userId,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        userType: fullUser.userType,
        gender: fullUser.gender,
        phone: fullUser.phone,
        alternatePhone: fullUser.alternatePhone,
        dateOfBirth: fullUser.dateOfBirth,
        location: fullUser.location,
        isProfileComplete: fullUser.isProfileComplete,
        isVerified: fullUser.isVerified,
        termsAccepted: fullUser.termsAccepted,
        isPremium: fullUser.isPremium,
        isKyc: fullUser.isKyc,
        ...(fullUser.userType === 'provider' && {
          service: fullUser.service,
          availability: fullUser.availability,
        }),
      },
    });
  } catch (error: any) {
    console.error('TaskShifts: Get profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'TaskShifts: Failed to fetch profile.',
      error: error.message,
    });
  }
};


/**
 * POST /api/profile/update-profile
 * Update user's profile (client or provider)
 * - Works for both clients and providers.
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
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
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'TaskShift: Email is required to update profile.',
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

    // Determine model (Client or Provider)
    const fullUser =
      user.userType === 'provider'
        ? await ProviderModel.findOne({ email })
        : await ClientModel.findOne({ email });

    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: `TaskShift: ${user.userType} record not found.`,
      });
    }

    // Handle coordinates update if postal code changed
    let coords = fullUser.location?.coordinates || [0, 0];
    if (postalCode && country && postalCode !== fullUser.location?.postalCode) {
      const geo = await getCoordinates(postalCode, country);
      if (geo) coords = [geo.longitude, geo.latitude];
    }

    // Safely update location fields without overwriting missing ones
    const location: LocationDetails = {
      address: address ?? fullUser.location?.address,
      city: city ?? fullUser.location?.city,
      country: country ?? fullUser.location?.country,
      state: state ?? fullUser.location?.state,
      postalCode: postalCode ?? fullUser.location?.postalCode,
      coordinates: coords,
    };

    // Assign updated data
    if (firstName) fullUser.firstName = firstName;
    if (lastName) fullUser.lastName = lastName;
    if (phone) fullUser.phone = phone;
    if (alternatePhone !== undefined) fullUser.alternatePhone = alternatePhone;
    if (gender) fullUser.gender = gender;
    if (dateOfBirth) fullUser.dateOfBirth = dateOfBirth;
    fullUser.location = location;

    // Provider-specific fields
    if (fullUser.userType === 'provider' && service) {
      fullUser.service = service;
    }

    await fullUser.save();

    return res.status(200).json({
      success: true,
      message: `TaskShift: ${fullUser.userType} profile updated successfully.`,
      data: {
        email: fullUser.email,
        userType: fullUser.userType,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        gender: fullUser.gender,
        phone: fullUser.phone,
        alternatePhone: fullUser.alternatePhone,
        dateOfBirth: fullUser.dateOfBirth,
        location: fullUser.location,
        ...(fullUser.userType === 'provider' && {
          service: fullUser.service,
          availability: fullUser.availability,
        }),
      },
    });
  } catch (error: any) {
    console.error('TaskShifts: Update profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'TaskShifts: Failed to update profile.',
      error: error.message,
    });
  }
};
