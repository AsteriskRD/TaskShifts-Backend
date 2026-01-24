// PATCH /api/provider/availability
import { findProviderById } from '../utils/userUtils';

export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id; // from verifyToken middleware

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    let newAvailability: boolean;

    // If explicit value in body, use it
    if (req.body && req.body.available !== undefined) {
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

// POST /api/provider/services
export const addServices = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;
    const newServices = req.body.services; // array of new service objects

    if (!Array.isArray(newServices) || newServices.length === 0) {
      return res.status(400).json({ message: 'Services array is required and cannot be empty' });
    }

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    // Optional: Validate each new service structure
    for (const svc of newServices) {
      if (!svc.serviceType || !svc.category || !svc.description) {
        return res.status(400).json({ message: 'Each service must have serviceType, category, and description' });
      }
      // Add defaults or clean data
      svc.createdAt = new Date();
      svc.updatedAt = new Date();
      svc.agreeToTerms = svc.agreeToTerms ?? true;
    }

    // Append to existing array
    provider.servicesRender = [...(provider.servicesRender || []), ...newServices];

    await provider.save();

    return res.status(201).json({
      success: true,
      message: `${newServices.length} service(s) added successfully`,
      totalServices: provider.servicesRender.length,
      addedServices: newServices,
    });
  } catch (error: any) {
    console.error('Add services error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/provider/services
export const getMyServices = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    return res.json({
      success: true,
      services: provider.servicesRender || [],
      total: (provider.servicesRender || []).length,
    });
  } catch (error: any) {
    console.error('Get services error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/providers/:providerId/services (public)
export const getProviderServices = async (req: Request, res: Response) => {
  const { providerId } = req.params;

  const provider = await findProviderById(providerId);
  if (!provider || provider.userType !== 'provider') {
    return res.status(404).json({ message: 'Provider not found' });
  }

  // Only show if visibility is public
  if (provider.accountVisibility === 'private') {
    return res.status(403).json({ message: 'Provider profile is private' });
  }

  return res.json({
    success: true,
    services: provider.servicesRender || [],
    total: (provider.servicesRender || []).length,
  });
};

// PATCH /api/provider/services/:serviceId
export const updateService = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;
    const { serviceId } = req.params;
    const updates = req.body;

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    const serviceIndex = provider.servicesRender.findIndex(
      svc => svc._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Only allow certain fields to be updated (prevent overwriting critical data)
    const allowedUpdates = [
      'serviceType', 'category', 'subcategory', 'description',
      'skills', 'packages', 'portfolio', 'additionalSettings'
    ];

    const sanitizedUpdates: any = {};
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Update the service object
    provider.servicesRender[serviceIndex] = {
      ...provider.servicesRender[serviceIndex],
      ...sanitizedUpdates,
      updatedAt: new Date(),
    };

    await provider.save();

    return res.json({
      success: true,
      message: 'Service updated successfully',
      updatedService: provider.servicesRender[serviceIndex],
    });
  } catch (error: any) {
    console.error('Update service error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/provider/services/:serviceId
export const deleteService = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;
    const { serviceId } = req.params;

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    const initialLength = provider.servicesRender.length;

    provider.servicesRender = provider.servicesRender.filter(
      svc => svc._id.toString() !== serviceId
    );

    if (provider.servicesRender.length === initialLength) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await provider.save();

    return res.json({
      success: true,
      message: 'Service deleted successfully',
      remainingServices: provider.servicesRender.length,
    });
  } catch (error: any) {
    console.error('Delete service error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
