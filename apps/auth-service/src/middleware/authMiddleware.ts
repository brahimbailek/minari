import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Auth Middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    // TODO: Verify JWT token
    // 1. Verify token with jsonwebtoken
    // 2. Check if token is expired
    // 3. Get user from database
    // 4. Attach user to request

    // Temporary mock user (remove when implementing JWT verification)
    req.user = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      role: 'USER',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

/**
 * Role-based authorization middleware
 * Usage: authorize('ADMIN', 'INSTRUCTOR')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
