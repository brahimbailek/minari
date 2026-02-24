import { z } from 'zod';

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  companyName: z.string().optional(),
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * 2FA enable schema
 */
export const enable2FASchema = z.object({
  // No body required
});

/**
 * 2FA confirm schema
 */
export const confirm2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
});

/**
 * 2FA disable schema
 */
export const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, '2FA code must be 6 digits'),
});

/**
 * 2FA verify schema (during login)
 */
export const verify2FASchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, '2FA code must be 6 digits'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  companyName: z.string().optional(),
  timezone: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type Enable2FAInput = z.infer<typeof enable2FASchema>;
export type Confirm2FAInput = z.infer<typeof confirm2FASchema>;
export type Disable2FAInput = z.infer<typeof disable2FASchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
