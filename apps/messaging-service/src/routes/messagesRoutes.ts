import { Router } from 'express';
import { messagesController } from '../controllers/messagesController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

/**
 * @route   POST /api/messages/send
 * @desc    Send SMS message
 * @access  Private
 */
router.post('/send', authMiddleware, messagesController.sendSMS);

/**
 * @route   POST /api/messages/send-mms
 * @desc    Send MMS message with media
 * @access  Private
 */
router.post('/send-mms', authMiddleware, messagesController.sendMMS);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations (contacts with last message)
 * @access  Private
 */
router.get('/conversations', authMiddleware, messagesController.getConversations);

/**
 * @route   GET /api/messages/conversations/:contactId
 * @desc    Get messages for a specific conversation
 * @access  Private
 */
router.get('/conversations/:contactId', authMiddleware, messagesController.getConversation);

/**
 * @route   PUT /api/messages/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/read', authMiddleware, messagesController.markAsRead);

// ============================================
// WEBHOOK ROUTES (public, from Twilio)
// ============================================

/**
 * @route   POST /webhook/sms
 * @desc    Webhook to receive incoming SMS/MMS from Twilio
 * @access  Public (validated by Twilio signature)
 */
router.post('/webhook/sms', messagesController.receiveMessage);

export default router;
