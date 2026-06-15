import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PaymentTypeSchema = z.enum(['naverpay', 'kakaopay', 'card', 'other']);

export const AddPaymentAlertSchema = z.object({
  paymentType: PaymentTypeSchema,
});
export class AddPaymentAlertDto extends createZodDto(AddPaymentAlertSchema) {}
