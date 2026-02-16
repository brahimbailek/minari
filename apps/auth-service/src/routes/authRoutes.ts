import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put('/change-password', authMiddleware, authController.changePassword);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware, authController.updateProfile);

// ============================================
// 2FA ROUTES
// ============================================

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Enable 2FA and get QR code
 * @access  Private
 */
router.post('/2fa/enable', authMiddleware, authController.enable2FA);

/**
 * @route   POST /api/auth/2fa/confirm
 * @desc    Confirm 2FA setup
 * @access  Private
 */
router.post('/2fa/confirm', authMiddleware, authController.confirm2FA);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', authMiddleware, authController.disable2FA);

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify 2FA code during login
 * @access  Public
 */
router.post('/2fa/verify', authController.verify2FA);

export default router;
