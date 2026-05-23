import { z } from 'zod';
import { emptyStringToUndefined } from '../../string.helper';

export const teamPaymentsFilterSchema = z.object({
    title: z.string().optional(),
    teamId: z.preprocess(emptyStringToUndefined, z.uuid().optional()),
    payerId: z.preprocess(emptyStringToUndefined, z.uuid().optional()),
    date: z.string().optional(),
});

export type TeamPaymentsFilterSchemaType = z.infer<typeof teamPaymentsFilterSchema>;
