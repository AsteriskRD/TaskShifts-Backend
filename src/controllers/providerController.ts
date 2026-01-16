// PATCH /api/provider/availability
export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id; // from verifyToken middleware

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    let newAvailability: boolean;

    // If explicit value in body, use it
    if (req.body.available !== undefined) {
      newAvailability = !!req.body.available; // coerce to boolean
    } 
    // Otherwise, toggle current value
    else {
      newAvailability = !provider.availability;
    }

    provider.availability = newAvailability;
    await provider.save();

    return res.json({
      success: true,
      message: `Availability updated to ${newAvailability ? 'Available' : 'Unavailable'}`,
      availability: newAvailability,
    });
  } catch (error: any) {
    console.error('Update availability error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
