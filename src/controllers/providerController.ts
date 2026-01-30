// PATCH /api/provider/availability
import { findProviderById } from '../utils/userUtils';
import { IServiceInput } from "../interfaces/serviceInput";
import { uploadToCloudinary } from '../utils/cloudinary';
import fs from 'fs/promises';

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

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access only' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files) console.log("files :", files);
    const newServices: IServiceInput[] = JSON.parse(req.body.services); // array of new service objects

    if (!Array.isArray(newServices) || newServices.length === 0) {
      return res.status(400).json({ message: 'Services array is required and cannot be empty' });
    }

    for (const service of newServices) {
      if (!service.agreeToTerms)
        return res.status(400).json({ message: 'You must agree to terms for each service' });

      const portfolioUrls = await Promise.all(
        service.portfolio.map(async (item: any) => {
          const file = (files as Express.Multer.File[]).find(f => f.fieldname === item.fileField);

          if (!file) {
            console.warn(`Missing file for ${item.fileField} — skipping`);
            return {
              filePath: "",
              skillLevel: item.skillLevel,
              experience: item.experience,
              description: item.description,
            };
          }

          const result = await uploadToCloudinary(file.path, `portfolio/${provider._id}`);
          await fs.unlink(file.path).catch(() => {});

          return {
            filePath: result.secure_url,
            skillLevel: item.skillLevel,
            experience: item.experience,
            description: item.description,
          };
        })
      );

      // Add defaults or clean data
      service.createdAt = new Date();
      service.updatedAt = new Date();
      service.portfolio = portfolioUrls;
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

// GET /api/provider/public/:providerId/services (public)
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

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let updates: Partial<IServiceInput>;

    // Handle multipart/form-data (with files) or JSON body
    if (files && req.body.services) {
      // Multipart case: JSON in 'services' field + files
      const parsed = JSON.parse(req.body.services);
      if (!Array.isArray(parsed) || parsed.length !== 1) {
        return res.status(400).json({ message: 'services must be an array with exactly one object' });
      }
      updates = parsed[0];
    } else {
      // Plain JSON body
      updates = req.body;
    }

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'serviceType', 'category', 'subcategory', 'description',
      'skills', 'packages', 'portfolio', 'additionalSettings'
    ];

    const sanitizedUpdates: Partial<IServiceInput> = {};
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        sanitizedUpdates[key as keyof IServiceInput] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0 && !files) {
      return res.status(400).json({ message: 'No valid fields or files to update' });
    }

    // Handle portfolio updates (add new or keep existing URLs)
    if (sanitizedUpdates.portfolio || files) {
      const currentPortfolio = provider.servicesRender[serviceIndex].portfolio || [];

      // New portfolio items from request (with fileField or URL)
      const newPortfolioItems = sanitizedUpdates.portfolio || [];

      // Process uploads for items with fileField
      const portfolioUrls = await Promise.all(
        newPortfolioItems.map(async (item: any) => {
          // If it's an existing URL (string) — keep it
          if (typeof item === 'string' || (item.filePath && typeof item.filePath === 'string')) {
            return {
              filePath: item.filePath || item,
              skillLevel: item.skillLevel,
              experience: item.experience,
              description: item.description,
            };
          }

          // If it has fileField → upload new file
          const fileKey = item.fileField;
          const file = files ? (files as any)[fileKey]?.[0] : null;

          if (!file) {
            console.warn(`Missing file for ${fileKey} — skipping`);
            return {
              filePath: "",
              skillLevel: item.skillLevel,
              experience: item.experience,
              description: item.description,
            };
          }

          const result = await uploadToCloudinary(file.path, `portfolio/${provider._id}`);
          await fs.unlink(file.path).catch(() => {});

          return {
            filePath: result.secure_url,
            skillLevel: item.skillLevel,
            experience: item.experience,
            description: item.description,
          };
        })
      );

      // Merge: keep existing portfolio items not overwritten, add/update new ones
      sanitizedUpdates.portfolio = [
        ...currentPortfolio.filter(
          // Keep items that are not being replaced (optional logic — i can adjust as needed)
          (existing) => !newPortfolioItems.some((newItem: any) => newItem.description === existing.description)
        ),
        ...portfolioUrls,
      ];
    }

    // Apply sanitized updates to the service
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
    return res.status(500).json({ message: 'Server error', error: error.message });
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
