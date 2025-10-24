import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import cors from 'cors';
import { expressjwt } from 'express-jwt';
// Routes imports here
import authRoutes from './routes/authRoutes';


// Load environment variables from .env
require('dotenv').config();

const app = express();
const httpServer = require('http').createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
//Globally applies JWT authentication to all routes except /register and /login
app.use(expressjwt({
    secret: process.env.JWT_SECRET || 'secret',
    algorithms: ['HS256'] 
  }).unless({ path: ['/api/users/register', '/api/users/login', '/health', '/api/users/verify-email'] })
);

// Routes
app.use('/api/auth', authRoutes);


// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'TaskShifts API is running' });
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/taskshifts', {
      serverSelectionTimeoutMS: 30000,
    });
    console.log('TaskShifts MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// WebSocket for messaging
io.on('connection', (socket) => {
  console.log('TaskShifts WebSocket client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`TaskShifts server running on port ${PORT}`);
  connectDB();
});
