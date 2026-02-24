import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@commpro/database';
import { AppError } from '../middleware/errorHandler';
import { twilioMessagingService } from '../services/twilioMessagingService';
import { encryptionService } from '../services/encryptionService';
import {
  sendSMSSchema,
  sendMMSSchema,
  markAsReadSchema,
  getConversationSchema,
} from '../utils/validation';

/**
 * Helper: Get or create encryption key for user
 */
const getUserEncryptionKey = async (userId: string): Promise<string> => {
  // For now, generate a simple key per user
  // In production, use a proper key management system
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  return hash; // 64 hex chars = 32 bytes
};

export const messagesController = {
  /**
   * Send SMS
   * POST /api/messages/send
   */
  sendSMS: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = sendSMSSchema.parse(req.body);

      // Verify that 'from' number belongs to user
      const phoneNumber = await prisma.phoneNumber.findFirst({
        where: {
          phoneNumber: data.from,
          userId: req.user.userId,
        },
      });

      if (!phoneNumber) {
        throw new AppError('From number does not belong to you', 403);
      }

      // Get or create contact
      let contact = await prisma.contact.findFirst({
        where: {
          userId: req.user.userId,
          phoneNumber: data.to,
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            userId: req.user.userId,
            phoneNumber: data.to,
          },
        });
      }

      // Encrypt message
      const encryptionKey = await getUserEncryptionKey(req.user.userId);
      const encryptedBody = encryptionService.encryptCombined(data.body, encryptionKey);

      // Send via Twilio
      const twilioResult = await twilioMessagingService.sendSMS(
        data.from,
        data.to,
        data.body
      );

      // Save to database
      const message = await prisma.message.create({
        data: {
          userId: req.user.userId,
          contactId: contact.id,
          fromNumber: data.from,
          toNumber: data.to,
          direction: 'OUTBOUND',
          type: 'SMS',
          body: encryptedBody, // Store encrypted
          twilioMessageSid: twilioResult.sid,
          status: 'SENT',
          sentAt: twilioResult.dateCreated,
          isEncrypted: true,
        },
      });

      res.status(201).json({
        message: 'SMS sent successfully',
        messageId: message.id,
        status: twilioResult.status,
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
   * Send MMS
   * POST /api/messages/send-mms
   */
  sendMMS: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = sendMMSSchema.parse(req.body);

      // Verify that 'from' number belongs to user
      const phoneNumber = await prisma.phoneNumber.findFirst({
        where: {
          phoneNumber: data.from,
          userId: req.user.userId,
        },
      });

      if (!phoneNumber) {
        throw new AppError('From number does not belong to you', 403);
      }

      // Get or create contact
      let contact = await prisma.contact.findFirst({
        where: {
          userId: req.user.userId,
          phoneNumber: data.to,
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            userId: req.user.userId,
            phoneNumber: data.to,
          },
        });
      }

      // Encrypt message body (if provided)
      let encryptedBody: string | null = null;
      if (data.body) {
        const encryptionKey = await getUserEncryptionKey(req.user.userId);
        encryptedBody = encryptionService.encryptCombined(data.body, encryptionKey);
      }

      // Send via Twilio
      const twilioResult = await twilioMessagingService.sendMMS(
        data.from,
        data.to,
        data.body || '',
        data.mediaUrls
      );

      // Save to database
      const message = await prisma.message.create({
        data: {
          userId: req.user.userId,
          contactId: contact.id,
          fromNumber: data.from,
          toNumber: data.to,
          direction: 'OUTBOUND',
          type: 'MMS',
          body: encryptedBody,
          mediaUrls: data.mediaUrls,
          twilioMessageSid: twilioResult.sid,
          status: 'SENT',
          sentAt: twilioResult.dateCreated,
          isEncrypted: !!encryptedBody,
        },
      });

      res.status(201).json({
        message: 'MMS sent successfully',
        messageId: message.id,
        status: twilioResult.status,
        mediaCount: twilioResult.numMedia,
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
   * Get conversations list
   * GET /api/messages/conversations
   */
  getConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // Get all contacts with last message
      const contacts = await prisma.contact.findMany({
        where: { userId: req.user.userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  direction: 'INBOUND',
                  readAt: null,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Get encryption key for decryption
      const encryptionKey = await getUserEncryptionKey(req.user.userId);

      // Format response
      const conversations = contacts
        .filter((c) => c.messages.length > 0)
        .map((contact) => {
          const lastMessage = contact.messages[0];
          let lastMessageBody = lastMessage.body;

          // Decrypt if encrypted
          if (lastMessage.isEncrypted && lastMessageBody) {
            try {
              lastMessageBody = encryptionService.decryptCombined(
                lastMessageBody,
                encryptionKey
              );
            } catch (error) {
              lastMessageBody = '[Encrypted message]';
            }
          }

          return {
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            firstName: contact.firstName,
            lastName: contact.lastName,
            avatarUrl: contact.avatarUrl,
            lastMessage: {
              id: lastMessage.id,
              body: lastMessageBody,
              type: lastMessage.type,
              direction: lastMessage.direction,
              createdAt: lastMessage.createdAt,
              mediaUrls: lastMessage.mediaUrls,
            },
            unreadCount: contact._count.messages,
          };
        });

      res.status(200).json({
        count: conversations.length,
        conversations,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get messages for a conversation
   * GET /api/messages/conversations/:contactId
   */
  getConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const contactId = req.params.contactId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Verify contact belongs to user
      const contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          userId: req.user.userId,
        },
      });

      if (!contact) {
        throw new AppError('Contact not found', 404);
      }

      // Get messages
      const messages = await prisma.message.findMany({
        where: {
          contactId,
          userId: req.user.userId,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // Get encryption key for decryption
      const encryptionKey = await getUserEncryptionKey(req.user.userId);

      // Decrypt messages
      const decryptedMessages = messages.map((msg) => {
        let body = msg.body;

        if (msg.isEncrypted && body) {
          try {
            body = encryptionService.decryptCombined(body, encryptionKey);
          } catch (error) {
            body = '[Decryption failed]';
          }
        }

        return {
          id: msg.id,
          fromNumber: msg.fromNumber,
          toNumber: msg.toNumber,
          direction: msg.direction,
          type: msg.type,
          body,
          mediaUrls: msg.mediaUrls,
          status: msg.status,
          sentAt: msg.sentAt,
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
        };
      });

      res.status(200).json({
        contact: {
          id: contact.id,
          phoneNumber: contact.phoneNumber,
          firstName: contact.firstName,
          lastName: contact.lastName,
        },
        messages: decryptedMessages,
        count: decryptedMessages.length,
        limit,
        offset,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark messages as read
   * PUT /api/messages/read
   */
  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = markAsReadSchema.parse(req.body);

      // Update messages
      await prisma.message.updateMany({
        where: {
          id: { in: data.messageIds },
          userId: req.user.userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      res.status(200).json({
        message: 'Messages marked as read',
        count: data.messageIds.length,
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
   * Webhook: Receive incoming SMS/MMS from Twilio
   * POST /webhook/sms
   */
  receiveMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate Twilio webhook signature (optional but recommended)
      // const signature = req.headers['x-twilio-signature'] as string;
      // const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      // if (!twilioMessagingService.validateWebhook(signature, url, req.body)) {
      //   throw new AppError('Invalid webhook signature', 403);
      // }

      const {
        From,
        To,
        Body,
        MediaUrl0,
        MediaUrl1,
        MediaUrl2,
        MediaUrl3,
        MediaUrl4,
        NumMedia,
        MessageSid,
      } = req.body;

      // Find which user owns the 'To' number
      const phoneNumber = await prisma.phoneNumber.findUnique({
        where: { phoneNumber: To },
      });

      if (!phoneNumber) {
        console.warn(`Received message for unknown number: ${To}`);
        return res.status(200).send(''); // Return 200 to acknowledge
      }

      // Get or create contact
      let contact = await prisma.contact.findFirst({
        where: {
          userId: phoneNumber.userId,
          phoneNumber: From,
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            userId: phoneNumber.userId,
            phoneNumber: From,
          },
        });
      }

      // Collect media URLs
      const mediaUrls: string[] = [];
      if (NumMedia && parseInt(NumMedia) > 0) {
        [MediaUrl0, MediaUrl1, MediaUrl2, MediaUrl3, MediaUrl4].forEach((url) => {
          if (url) mediaUrls.push(url);
        });
      }

      // Encrypt message body
      let encryptedBody: string | null = null;
      if (Body) {
        const encryptionKey = await getUserEncryptionKey(phoneNumber.userId);
        encryptedBody = encryptionService.encryptCombined(Body, encryptionKey);
      }

      // Save message
      await prisma.message.create({
        data: {
          userId: phoneNumber.userId,
          contactId: contact.id,
          fromNumber: From,
          toNumber: To,
          direction: 'INBOUND',
          type: mediaUrls.length > 0 ? 'MMS' : 'SMS',
          body: encryptedBody,
          mediaUrls,
          twilioMessageSid: MessageSid,
          status: 'RECEIVED',
          sentAt: new Date(),
          isEncrypted: !!encryptedBody,
        },
      });

      // Return empty TwiML response
      res.status(200).type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (error) {
      console.error('Webhook error:', error);
      // Always return 200 to Twilio to prevent retries
      res.status(200).send('');
    }
  },
};
