import { z } from 'zod';

export const deliveryFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(8, 'Telephone must be at least 8 digits')
    .regex(/^[+\d\s()-]+$/, 'Invalid telephone format'),
  address: z.string().trim().min(5, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  country: z.string().trim().min(2, 'Country is required'),
  postalCode: z.string().trim().min(3, 'Postal code is required'),
  companyName: z.string().trim().optional(),
});

export type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

export const paymentFormSchema = z
  .object({
    method: z.enum(['card', 'apple-pay', 'b2b-invoice']),
    cardNumber: z.string().optional(),
    cardHolder: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
    b2bVatId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'card') {
      const digits = (data.cardNumber ?? '').replace(/\s+/g, '');
      if (!/^\d{16}$/.test(digits)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cardNumber'],
          message: 'Enter a 16-digit card number',
        });
      }
      if (!data.cardHolder || data.cardHolder.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cardHolder'],
          message: 'Cardholder name is required',
        });
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test((data.cardExpiry ?? '').trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cardExpiry'],
          message: 'Use MM/YY format',
        });
      }
      if (!/^\d{3,4}$/.test((data.cardCvc ?? '').trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cardCvc'],
          message: '3 or 4 digits required',
        });
      }
    }

    if (data.method === 'b2b-invoice') {
      if (!data.b2bVatId || data.b2bVatId.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['b2bVatId'],
          message: 'Enter corporate VAT / Tax ID (min 5 chars)',
        });
      }
    }
  });

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Deterministic FNV-1a Order Reference Generator -> MV-2026-XXXX
 */
export function generateDeterministicOrderId(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unsigned = hash >>> 0;
  let suffix = '';
  let value = unsigned;
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[value % ALPHABET.length];
    value = Math.floor(value / ALPHABET.length) + (i + 7) * 13;
  }
  return `MV-2026-${suffix}`;
}
