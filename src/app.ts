import 'reflect-metadata';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import cors from 'cors';
import { expressjwt } from 'express-jwt';
import { v2 as cloudinary } from 'cloudinary';
// Routes imports here
import authRoutes from './routes/authRoutes';
import googleAuthRoutes from './routes/googleAuthRoutes';
import profileRoutes from './routes/profileRoutes';
import kycStep1Routes from './routes/kycStep1.routes';
import kycStep2Routes from './routes/kycStep2.routes';
import kycStep3Routes from './routes/kycStep3.routes';
import searchRoutes from './routes/search.routes';
import tokenRoutes from './routes/tokenRoutes';


// Load environment variables from .env
require('dotenv').config();

const app = express();
const httpServer = require('http').createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// Middleware
// app.use(cors());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, mobile apps)
      if (!origin) return callback(null, true);

      const allowedOrigins =
        process.env.NODE_ENV === "production"
          ? ["https://taskshifts.com"]
          : ["http://localhost:3000"];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' })); // important for file uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure once at app startup (e.g., in app.ts)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // recommended
});

// JWT Middleware (exclude public routes)
app.use(expressjwt({
    secret: process.env.JWT_SECRET || 'secret',
    algorithms: ['HS256'] 
  }).unless(
    {
      path: [
              '/api/users/register',
              '/api/users/login',
              '/api/google/signup',
              '/api/google/login',
              '/health',
              '/api/users/verify-email',
              '/api/token/refresh-token',
              '/api/users/forgot-password',
              /^\/api\/users\/reset-password\/.*/
      ]
    }
  )
);

// Mount Routes
app.use('/api/users', authRoutes);        // Mount the authRoutes
app.use('/api/google', googleAuthRoutes); // Mount the googleAuthRoutes
app.use('/api/profile', profileRoutes);   // Mount the profileRoutes
app.use('/api/kyc', kycStep1Routes);      // Mount the kyc step 1
app.use('/api/kyc', kycStep2Routes);      // Mount the kyc step 2
app.use('/api/kyc', kycStep3Routes);      // Mount the kyc step 3
app.use('/api/search', searchRoutes);     // Mount the search routes
app.use('/api/profile', profileRoutes); // Mount the profileRoutes
app.use('/api/token', tokenRoutes); // Mount the refresh token route


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

// Start server after DB connect
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`TaskShifts server running on port ${PORT}`);
  });
});
