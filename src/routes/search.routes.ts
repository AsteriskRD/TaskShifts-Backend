import { Router } from 'express';
import { searchProviders } from '../controllers/search.controller';

const router = Router();

// GET /api/search/providers
router.get('/providers', searchProviders);

export default router;
