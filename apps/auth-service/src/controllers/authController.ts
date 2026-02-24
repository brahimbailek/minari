import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@commpro/database';
import { AppError } from '../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpiryDate } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  confirm2FASchema,
  disable2FASchema,
  verify2FASchema,
  updateProfileSchema,
} from '../utils/validation';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

/**
 * Auth Controller
 * Handles all authentication-related operations
 */
export const authController = {
  /**
   * Register a new user
   */
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const data = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName,
        },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: getTokenExpiryDate(),
          deviceId: req.headers['x-device-id'] as string,
          deviceName: req.headers['x-device-name'] as string,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      // Return user without password hash
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Login user
   */
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const data = loginSchema.parse(req.body);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account is disabled', 403);
      }

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if 2FA is enabled
      if (user.twoFaEnabled) {
        // For 2FA users, return a temporary token and require 2FA verification
        return res.status(200).json({
          requires2FA: true,
          message: 'Please provide your 2FA code',
          email: user.email,
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: getTokenExpiryDate(),
          deviceId: data.deviceId,
          deviceName: data.deviceName,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFaEnabled: user.twoFaEnabled,
        },
        accessToken,
        refreshToken,
        requires2FA: false,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Refresh access token
   */
  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const data = refreshTokenSchema.parse(req.body);

      // Verify refresh token
      let decoded;
      try {
        decoded = verifyRefreshToken(data.refreshToken);
      } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Check if refresh token exists in database
      const refreshTokenRecord = await prisma.refreshToken.findUnique({
        where: { token: data.refreshToken },
        include: { user: true },
      });

      if (!refreshTokenRecord) {
        throw new AppError('Refresh token not found', 401);
      }

      // Check if token is expired
      if (refreshTokenRecord.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { id: refreshTokenRecord.id },
        });
        throw new AppError('Refresh token expired', 401);
      }

      const user = refreshTokenRecord.user;

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account is disabled', 403);
      }

      // Generate new access token
      const accessToken = generateAccessToken(user.id, user.email, user.role);

      // Optionally: Rotate refresh token (more secure)
      const newRefreshToken = generateRefreshToken(user.id);

      // Delete old refresh token and create new one
      await prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id },
      });

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          expiresAt: getTokenExpiryDate(),
          deviceId: refreshTokenRecord.deviceId,
          deviceName: refreshTokenRecord.deviceName,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Get current user
   */
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          role: true,
          avatarUrl: true,
          timezone: true,
          emailVerified: true,
          twoFaEnabled: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout user
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = refreshTokenSchema.parse(req.body);

      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: data.refreshToken },
      });

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Change password
   */
  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = changePasswordSchema.parse(req.body);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await comparePassword(data.currentPassword, user.passwordHash);

      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const newPasswordHash = await hashPassword(data.newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      // Invalidate all refresh tokens for security
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      res.status(200).json({
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      // Always return success even if user doesn't exist (security)
      if (!user) {
        return res.status(200).json({
          message: 'If an account exists with that email, a reset link has been sent.',
        });
      }

      // Generate secure random token (32 bytes = 64 hex chars)
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Token expires in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Delete any existing unused reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      });

      // Save reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      // TODO: Send email with reset link
      // In production: Send email via SendGrid/AWS SES/Mailgun
      // Reset link format: https://app.commpro.com/reset-password?token={resetToken}

      // For development: Log the token (NEVER do this in production!)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔑 Password reset token for ${user.email}: ${resetToken}`);
        console.log(`🔗 Reset link: ${process.env.WEB_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
      }

      res.status(200).json({
        message: 'If an account exists with that email, a reset link has been sent.',
        // In dev mode, include token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = resetPasswordSchema.parse(req.body);

      // Find reset token
      const resetTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: data.token },
        include: { user: true },
      });

      if (!resetTokenRecord) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Check if token has been used
      if (resetTokenRecord.used) {
        throw new AppError('Reset token has already been used', 400);
      }

      // Check if token is expired
      if (resetTokenRecord.expiresAt < new Date()) {
        throw new AppError('Reset token has expired', 400);
      }

      const user = resetTokenRecord.user;

      // Hash new password
      const newPasswordHash = await hashPassword(data.newPassword);

      // Update password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetTokenRecord.id },
          data: {
            used: true,
            usedAt: new Date(),
          },
        }),
        // Invalidate all refresh tokens for security
        prisma.refreshToken.deleteMany({
          where: { userId: user.id },
        }),
      ]);

      res.status(200).json({
        message: 'Password reset successfully. Please login with your new password.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Enable 2FA
   */
  enable2FA: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if 2FA is already enabled
      if (user.twoFaEnabled) {
        throw new AppError('2FA is already enabled for this account', 400);
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `CommPro (${user.email})`,
        issuer: 'CommPro',
        length: 32,
      });

      // Save secret temporarily (will be confirmed later)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFaSecret: secret.base32,
          // Don't enable 2FA yet - wait for confirmation
        },
      });

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);

      res.status(200).json({
        message: 'Scan this QR code with your authenticator app, then confirm with a code',
        qrCode: qrCodeDataURL,
        secret: secret.base32, // For manual entry
        manualEntryKey: secret.base32,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Confirm 2FA setup
   */
  confirm2FA: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = confirm2FASchema.parse(req.body);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user has a secret (from enable2FA)
      if (!user.twoFaSecret) {
        throw new AppError('Please enable 2FA first', 400);
      }

      // Check if 2FA is already enabled
      if (user.twoFaEnabled) {
        throw new AppError('2FA is already enabled', 400);
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFaSecret,
        encoding: 'base32',
        token: data.code,
        window: 2, // Allow 2 time steps before/after for clock skew
      });

      if (!verified) {
        throw new AppError('Invalid 2FA code', 400);
      }

      // Enable 2FA
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFaEnabled: true,
        },
      });

      res.status(200).json({
        message: '2FA has been successfully enabled for your account',
        twoFaEnabled: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Disable 2FA
   */
  disable2FA: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = disable2FASchema.parse(req.body);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if 2FA is enabled
      if (!user.twoFaEnabled) {
        throw new AppError('2FA is not enabled for this account', 400);
      }

      // Verify password (for security)
      const isPasswordValid = await comparePassword(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid password', 401);
      }

      // Verify TOTP code
      if (!user.twoFaSecret) {
        throw new AppError('2FA secret not found', 500);
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFaSecret,
        encoding: 'base32',
        token: data.code,
        window: 2,
      });

      if (!verified) {
        throw new AppError('Invalid 2FA code', 400);
      }

      // Disable 2FA and clear secret
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFaEnabled: false,
          twoFaSecret: null,
        },
      });

      res.status(200).json({
        message: '2FA has been successfully disabled',
        twoFaEnabled: false,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Verify 2FA during login
   */
  verify2FA: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = verify2FASchema.parse(req.body);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account is disabled', 403);
      }

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if 2FA is enabled
      if (!user.twoFaEnabled || !user.twoFaSecret) {
        throw new AppError('2FA is not enabled for this account', 400);
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFaSecret,
        encoding: 'base32',
        token: data.code,
        window: 2,
      });

      if (!verified) {
        throw new AppError('Invalid 2FA code', 400);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: getTokenExpiryDate(),
          deviceId: data.deviceId,
          deviceName: data.deviceName,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFaEnabled: user.twoFaEnabled,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = updateProfileSchema.parse(req.body);

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName,
          timezone: data.timezone,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          timezone: true,
          role: true,
        },
      });

      res.status(200).json({
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },
};
