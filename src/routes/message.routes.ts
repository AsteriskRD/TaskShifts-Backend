import { Router } from 'express';
import { getChatHistory, getUnreadCount } from '../controllers/messageController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/messages/:otherUserId', verifyToken, getChatHistory);
router.get('/unread-count/messages', verifyToken, getUnreadCount);

export default router;
