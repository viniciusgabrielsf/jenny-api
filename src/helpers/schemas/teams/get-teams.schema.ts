import { z } from 'zod';
import { emptyStringToUndefined } from '../../string.helper';

export const getTeamsQuerySchema = z.object({
    search: z.preprocess(
        value => emptyStringToUndefined(typeof value === 'string' ? value.trim() : value),
        z.string().optional()
    ),
});

export type GetTeamsQuerySchemaType = z.infer<typeof getTeamsQuerySchema>;
