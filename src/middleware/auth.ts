import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserModel } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;
if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets are not properly set');
}

// TOKEN GENERATORS

export const generateAccessToken = (user: { _id: Types.ObjectId; userType?: string }) => {
  const payload = { id: user._id.toString(), userType: user.userType };
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (user: { _id: Types.ObjectId; tokenVersion: number }) => {
  const payload = { id: user._id.toString(), tokenVersion: user.tokenVersion };
  return jwt.sign(payload, REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
};

// ACCESS TOKEN VERIFICATION MIDDLEWARE

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No Authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ message: 'Malformed Authorization header' });

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Access token expired' });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// REFRESH TOKEN ENDPOINT HANDLER

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;
    const user = await UserModel.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // tokenVersion check → reject if revoked
    if (user.tokenVersion !== decoded.tokenVersion)
      return res.status(403).json({ message: 'Token revoked. Please log in again.' });

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      userType: user.userType,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion,
    });

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};
