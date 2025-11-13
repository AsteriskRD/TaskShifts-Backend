import express from 'express';
import { submitKyc } from '../controllers/kycController';

const router = express.Router();

router.post('/submit', submitKyc);

export default router;
