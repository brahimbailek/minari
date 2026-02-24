import { Router } from 'express';
import { callsController } from '../controllers/callsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

/**
 * @route   POST /api/calls/initiate
 * @desc    Initiate an outbound call
 * @access  Private
 */
router.post('/initiate', authMiddleware, callsController.initiateCall);

/**
 * @route   GET /api/calls
 * @desc    Get call history
 * @access  Private
 */
router.get('/', authMiddleware, callsController.getCalls);

/**
 * @route   GET /api/calls/:id
 * @desc    Get call details
 * @access  Private
 */
router.get('/:id', authMiddleware, callsController.getCall);

/**
 * @route   GET /api/calls/:id/quality
 * @desc    Get call quality metrics
 * @access  Private
 */
router.get('/:id/quality', authMiddleware, callsController.getCallQuality);

// ============================================
// WEBHOOK ROUTES (public, from Twilio)
// ============================================

/**
 * @route   POST /webhook/voice
 * @desc    Webhook to handle incoming calls from Twilio
 * @access  Public (validated by Twilio signature)
 */
router.post('/webhook/voice', callsController.handleIncomingCall);

/**
 * @route   POST /webhook/voice/outbound
 * @desc    Webhook to generate TwiML for outbound calls
 * @access  Public
 */
router.post('/webhook/voice/outbound', callsController.handleOutboundCall);

/**
 * @route   POST /webhook/voice/status
 * @desc    Webhook to receive call status updates
 * @access  Public
 */
router.post('/webhook/voice/status', callsController.handleCallStatus);

export default router;
