import { z } from 'zod';

/**
 * Country codes supported
 */
export const SUPPORTED_COUNTRIES = ['FR', 'US', 'UK', 'DE', 'ES', 'IT'] as const;

/**
 * Search available numbers schema
 */
export const searchNumbersSchema = z.object({
  country: z.enum(SUPPORTED_COUNTRIES, {
    errorMap: () => ({ message: `Country must be one of: ${SUPPORTED_COUNTRIES.join(', ')}` }),
  }),
  areaCode: z.string().optional(),
  contains: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(10),
});

/**
 * Purchase number schema
 */
export const purchaseNumberSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  friendlyName: z.string().optional(),
});

/**
 * Update number schema
 */
export const updateNumberSchema = z.object({
  friendlyName: z.string().min(1).optional(),
});

export type SearchNumbersInput = z.infer<typeof searchNumbersSchema>;
export type PurchaseNumberInput = z.infer<typeof purchaseNumberSchema>;
export type UpdateNumberInput = z.infer<typeof updateNumberSchema>;
