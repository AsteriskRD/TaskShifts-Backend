import { Server } from 'socket.io';
import http from 'http';
import { verifyTokenSocket } from './middleware/auth'; // we'll create this
import { MessageModel } from './models/message';
let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const user = await verifyTokenSocket(token); // verify JWT
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.id} (${user.userType})`);

    // Join personal room (for direct messages)
    socket.join(`user_${user.id}`);

    // Join conversation rooms (client-provider pairs)
    // This is handled when sending message or loading chat

    // Typing indicator
    socket.on('typing', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('typing', { senderId: user.id });
    });

    socket.on('stopTyping', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('stopTyping', { senderId: user.id });
    });

    // Send message
    socket.on('sendMessage', async ({ receiverId, content }) => {
      const message = new MessageModel({
        senderId: user.id,
        receiverId,
        content,
      });

      await message.save();

      // Emit to both sender and receiver
      io.to(`user_${user.id}`).to(`user_${receiverId}`).emit('newMessage', {
        _id: message._id,
        senderId: user.id,
        receiverId,
        content,
        sentAt: message.sentAt,
        isRead: false,
      });

      // Update unread count for receiver
      const unreadCount = await MessageModel.countDocuments({
        receiverId,
        isRead: false,
      });
      io.to(`user_${receiverId}`).emit('unreadCount', { count: unreadCount });
    });

    // Mark messages as read
    socket.on('markRead', async ({ senderId }) => {
      await MessageModel.updateMany(
        { senderId, receiverId: user.id, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );

      io.to(`user_${senderId}`).emit('messagesRead', { by: user.id });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`);
    });
  });

  return io;
};

export const getIo = () => io;
