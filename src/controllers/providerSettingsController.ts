import { Request, Response } from 'express';
import { findProviderById } from '../utils/userUtils';
import { ProviderModel } from '../models/user';

// PATCH /api/provider/settings/visibility
export const updateAccountVisibility = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;
    const { visibility } = req.body;

    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility value. Must be "public" or "private"' });
    }

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    provider.accountVisibility = visibility;
    await provider.save();

    return res.json({
      success: true,
      message: `Account visibility updated to ${visibility}`,
      visibility,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/provider/settings/notifications
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;
    const updates = req.body; // { app: true, email: false, sound: true, ... }

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    // Validate allowed keys
    const allowedKeys = ['app', 'email', 'sound', 'vibration', 'autoReplyEnabled'];
    for (const key in updates) {
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({ message: `Invalid notification key: ${key}` });
      }
      if (typeof updates[key] !== 'boolean') {
        return res.status(400).json({ message: `${key} must be boolean` });
      }
    }

    provider.notificationPreferences = {
      ...provider.notificationPreferences,
      ...updates,
    };

    await provider.save();

    return res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: provider.notificationPreferences,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/provider/settings/localization
export const updateLocalizationPreferences = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;
    const { language, country, currency, theme } = req.body;

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    const updates: any = {};

    if (language) updates['preferences.language'] = language;
    if (country) updates['preferences.country'] = country;
    if (currency) updates['preferences.currency'] = currency;
    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      updates['preferences.theme'] = theme;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    await ProviderModel.updateOne({ _id: providerId }, { $set: updates });

    const updatedProvider = await findProviderById(providerId);

    return res.json({
      success: true,
      message: 'Localization & preferences updated',
      preferences: updatedProvider?.preferences,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// GET /api/provider/settings
export const getProviderSettings = async (req: Request, res: Response) => {
  const provider = await findProviderById((req as any).user.id);
  if (!provider || provider.userType !== 'provider') {
    return res.status(403).json({ message: 'Provider access only' });
  }

  return res.json({
    success: true,
    data: {
      visibility: provider.accountVisibility,
      notifications: provider.notificationPreferences,
      preferences: provider.preferences,
    },
  });
};
