import { z } from 'zod';

/**
 * Phone number validation (E.164 format)
 */
const phoneRegex = /^\+[1-9]\d{1,14}$/;

/**
 * Send SMS schema
 */
export const sendSMSSchema = z.object({
  from: z.string().regex(phoneRegex, 'Invalid from number (must be E.164 format)'),
  to: z.string().regex(phoneRegex, 'Invalid to number (must be E.164 format)'),
  body: z.string().min(1, 'Message body is required').max(1600, 'Message too long'),
});

/**
 * Send MMS schema
 */
export const sendMMSSchema = z.object({
  from: z.string().regex(phoneRegex, 'Invalid from number (must be E.164 format)'),
  to: z.string().regex(phoneRegex, 'Invalid to number (must be E.164 format)'),
  body: z.string().optional(),
  mediaUrls: z.array(z.string().url()).min(1, 'At least one media URL required').max(10),
});

/**
 * Mark as read schema
 */
export const markAsReadSchema = z.object({
  messageIds: z.array(z.string().uuid()).min(1, 'At least one message ID required'),
});

/**
 * Get conversation schema
 */
export const getConversationSchema = z.object({
  contactId: z.string().uuid().optional(),
  phoneNumber: z.string().regex(phoneRegex).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export type SendSMSInput = z.infer<typeof sendSMSSchema>;
export type SendMMSInput = z.infer<typeof sendMMSSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type GetConversationInput = z.infer<typeof getConversationSchema>;
