import { Router } from 'express';
import { numbersController } from '../controllers/numbersController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/numbers/available
 * @desc    Search available phone numbers
 * @access  Private (requires authentication)
 * @query   country (required), areaCode (optional), contains (optional), limit (optional)
 */
router.get('/available', authMiddleware, numbersController.searchAvailable);

// ============================================
// PROTECTED ROUTES
// ============================================

/**
 * @route   GET /api/numbers
 * @desc    Get user's phone numbers
 * @access  Private
 */
router.get('/', authMiddleware, numbersController.getUserNumbers);

/**
 * @route   GET /api/numbers/:id
 * @desc    Get a single phone number
 * @access  Private
 */
router.get('/:id', authMiddleware, numbersController.getNumber);

/**
 * @route   POST /api/numbers/purchase
 * @desc    Purchase a phone number
 * @access  Private
 */
router.post('/purchase', authMiddleware, numbersController.purchaseNumber);

/**
 * @route   PUT /api/numbers/:id
 * @desc    Update phone number
 * @access  Private
 */
router.put('/:id', authMiddleware, numbersController.updateNumber);

/**
 * @route   DELETE /api/numbers/:id
 * @desc    Release a phone number
 * @access  Private
 */
router.delete('/:id', authMiddleware, numbersController.releaseNumber);

export default router;
