import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  updateAvailability,
  addServices,
  getMyServices,
  getProviderServices,
  deleteService,
  updateService,
} from '../controllers/providerController';
import {
  updateAccountVisibility,
  updateNotificationPreferences,
  updateLocalizationPreferences,
  getProviderSettings,
} from '../controllers/providerSettingsController';

const router = Router();

// Toggle or set provider availability
router.patch('/availability', verifyToken, updateAvailability);
router.patch('/settings/visibility', verifyToken, updateAccountVisibility);
router.patch('/settings/notifications', verifyToken, updateNotificationPreferences);
router.patch('/settings/localization', verifyToken, updateLocalizationPreferences);
router.get('/settings', verifyToken, getProviderSettings);
router.post('/services', verifyToken, addServices);
router.get('/services', verifyToken, getMyServices);
router.get('/public/:providerId/services', getProviderServices);
router.delete('/services/:serviceId', verifyToken, deleteService);
router.patch('/services/:serviceId', verifyToken, updateService);

export default router;
