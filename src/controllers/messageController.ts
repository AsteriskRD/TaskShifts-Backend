//src/controllers/messageController.ts
import { Request, Response } from 'express';
import { MessageModel } from '../models/message';
import mongoose from 'mongoose';

// GET /api/messages/:otherUserId - Get chat history with another user
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const { otherUserId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const messages = await MessageModel.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'firstName lastName profilePicture')
      .lean();

    // Mark as read
    await MessageModel.updateMany(
      { senderId: otherUserId, receiverId: myId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.json({
      success: true,
      messages: messages.reverse(), // oldest first
      hasMore: messages.length === limit,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/unread-count/messages - Get total unread messages
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    if (!mongoose.isValidObjectId(myId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const count = await MessageModel.countDocuments({
      receiverId: new mongoose.Types.ObjectId(myId),
      isRead: false,
    });

    return res.json({ success: true, unreadCount: count });
  } catch (err: any) {
    console.error('Unread count error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
