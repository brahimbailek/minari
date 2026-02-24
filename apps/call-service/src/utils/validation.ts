import { z } from 'zod';

/**
 * Phone number validation (E.164 format)
 */
const phoneRegex = /^\+[1-9]\d{1,14}$/;

/**
 * Initiate call schema
 */
export const initiateCallSchema = z.object({
  from: z.string().regex(phoneRegex, 'Invalid from number (must be E.164 format)'),
  to: z.string().regex(phoneRegex, 'Invalid to number (must be E.164 format)'),
});

/**
 * Get calls schema (query params)
 */
export const getCallsSchema = z.object({
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  status: z.enum(['INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
export type GetCallsInput = z.infer<typeof getCallsSchema>;
