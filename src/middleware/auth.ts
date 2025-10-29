import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const generateToken = (user: any) => {

  const JWT_SECRET = process.env.JWT_SECRET as string;

  return jwt.sign(
    { 
      userId: user.userId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'TaskShifts: No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'TaskShifts: Invalid token' });
  }
};
