import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_me_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret_change_me_in_production';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface RefreshTokenPayload {
  userId: string;
}

/**
 * Generate access token (short-lived, 15 minutes)
 */
export const generateAccessToken = (userId: string, email: string, role: string): string => {
  const payload: TokenPayload = { userId, email, role };
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Generate refresh token (long-lived, 7 days)
 */
export const generateRefreshToken = (userId: string): string => {
  const payload: RefreshTokenPayload = { userId };
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES_IN };
  return jwt.sign(payload, REFRESH_SECRET, options);
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify and decode refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Calculate token expiration date
 */
export const getTokenExpiryDate = (expiresIn: string = REFRESH_EXPIRES_IN): Date => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiration format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const now = new Date();

  switch (unit) {
    case 's': // seconds
      return new Date(now.getTime() + value * 1000);
    case 'm': // minutes
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h': // hours
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd': // days
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error('Invalid time unit');
  }
};
