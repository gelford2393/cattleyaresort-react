import { z } from 'zod';

export const CHARGE_OPTIONS = [
  'Extra Head', 'Catering', 'Ice', 'Mattress', 'Sound System', 'Water', 'Others',
] as const;
export const CARE_OF_OPTIONS = ['Mr. Benito', 'Mrs. Benito', 'Others'] as const;
export const PAYMENT_TYPES = ['Cash', 'Bank Deposit', 'Bank Transfer', 'WTax', 'Refund'] as const;

/* ---------- Login ---------- */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ---------- Reserve ---------- */
export const slotSchema = z.object({
  pool: z.string(),
  type: z.enum(['DAY', 'NIGHT']),
  rate: z.number(),
  depositRate: z.number(),
});
export type SlotInput = z.infer<typeof slotSchema>;

export const reserveSchema = z.object({
  customer: z.string().min(1, 'Customer name is required'),
  email: z.literal('').or(z.string().email('Enter a valid email')),
  phone: z.string(),
  bookingDate: z.string().min(1, 'Booking date is required'),
  slots: z.array(slotSchema).min(1, 'Select at least one slot'),
});
export type ReserveInput = z.infer<typeof reserveSchema>;

/* ---------- Additional charge ---------- */
export const additionalSchema = z
  .object({
    description: z.enum(CHARGE_OPTIONS, { message: 'Select a charge type' }),
    customDesc: z.string().optional(),
    amount: z.coerce.number({ message: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  })
  .superRefine((val, ctx) => {
    if (val.description === 'Others' && (!val.customDesc || val.customDesc.trim() === '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customDesc'], message: 'Description is required' });
    }
  });
export type AdditionalInput = z.infer<typeof additionalSchema>;

/* ---------- Discount ---------- */
export const discountSchema = z
  .object({
    careOfBy: z.enum(CARE_OF_OPTIONS, { message: 'Select who it is care of' }),
    others: z.string().optional(),
    amount: z.coerce.number({ message: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  })
  .superRefine((val, ctx) => {
    if (val.careOfBy === 'Others' && (!val.others || val.others.trim() === '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['others'], message: 'Reason is required' });
    }
  });
export type DiscountInput = z.infer<typeof discountSchema>;

/* ---------- Payment ---------- */
export const paymentSchema = z.object({
  type: z.enum(PAYMENT_TYPES, { message: 'Select a payment type' }),
  date: z.string().optional(),
  referenceNo: z.string().optional(),
  amount: z.coerce.number({ message: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

/* ---------- Filters ---------- */
export const dateFilterSchema = z.object({
  date: z.string().min(1, 'Select a date'),
});
export type DateFilterInput = z.infer<typeof dateFilterSchema>;

export const searchSchema = z.object({
  query: z.string().min(1, 'Enter a search term'),
});
export type SearchInput = z.infer<typeof searchSchema>;
