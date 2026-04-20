import { z } from 'zod';
import { PaymentCategory, PaymentStatus } from '../../../models/payment.model';
import { emptyStringToUndefined } from '../../string.helper';

export const myPaymentsFilterSchema = z.object({
    userId: z.preprocess(emptyStringToUndefined, z.uuid().optional()),
    title: z.preprocess(emptyStringToUndefined, z.string().optional()),
    amount: z.preprocess(emptyStringToUndefined, z.coerce.number().optional()),
    date: z.preprocess(emptyStringToUndefined, z.coerce.date().optional()),
    category: z.preprocess(
        value => (typeof value === 'string' ? value.toLowerCase() : value),
        z.enum(PaymentCategory).optional()
    ),
    status: z.preprocess(
        value => (typeof value === 'string' ? value.toLowerCase() : value),
        z.enum(PaymentStatus).optional()
    ),
});

export type MyPaymentsFilterSchemaType = z.infer<typeof myPaymentsFilterSchema>;
