import { z } from 'zod';
import { PaymentCategory, PaymentStatus } from '../../../models/payment.model';
export const myPaymentsFilterSchema = z.object({
    userId: z.uuid().optional(),
    title: z.string().optional(),
    amount: z.number().optional(),
    paymentDate: z.date().optional(),
    category: z.enum(PaymentCategory).optional(),
    status: z.enum(PaymentStatus).optional(),
});

export type MyPaymentsFilterSchemaType = z.infer<typeof myPaymentsFilterSchema>;
