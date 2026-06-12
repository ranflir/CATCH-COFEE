import { z } from 'zod';

export const PaymentTypeSchema = z.enum(['naverpay', 'kakaopay', 'card', 'other']);

export const AddPaymentAlertSchema = z.object({
  paymentType: PaymentTypeSchema,
});
export type AddPaymentAlertDto = z.infer<typeof AddPaymentAlertSchema>;
