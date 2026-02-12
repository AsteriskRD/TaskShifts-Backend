import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { findUserById } from '../utils/userUtils';

// Load secrets safely
const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;
if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets are not properly set');
}

// ---------------------
// TOKEN GENERATORS
// ---------------------

export const generateAccessToken = (user: { _id: mongoose.Types.ObjectId; userType?: string, userRole?: string }) => {
  const payload = { id: user._id.toString(), userType: user.userType, userRole: user.userRole };
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '60m',
  });
};

export const generateRefreshToken = (user: { _id: mongoose.Types.ObjectId; tokenVersion: number }) => {
  const payload = { id: user._id.toString(), tokenVersion: user.tokenVersion };
  return jwt.sign(payload, REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
};

// ---------------------
// VERIFY TOKEN MIDDLEWARE
// ---------------------

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id?: string; userType?: string };
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No Authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ message: 'Malformed Authorization header' });

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Access token expired' });
    return res.status(401).json({ message: 'Invalid token' });
  }
};


// ---------------------
// REFRESH TOKEN HANDLER
// ---------------------
export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;  // Read from cookie

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; tokenVersion: number };

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Revocation check
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(403).json({ message: 'Token revoked. Please log in again.' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      id: user._id.toString(),
      userType: user.userType,
    });

    const newRefreshToken = generateRefreshToken({
      id: user._id.toString(),
      tokenVersion: user.tokenVersion,
    });

    // Update the cookie with new refresh token (token rotation)
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      accessToken: newAccessToken,
      // Optional:
      // refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const verifyTokenSocket = async (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; userType: string; userRole?: string };
    const user = await findUserById(decoded.id);
    if (!user) throw new Error('User not found');
    return user;
  } catch (err) {
    throw new Error('Invalid token');
  }
};
