import { z } from 'zod';
import { emptyStringToUndefined } from '../../string.helper';

export const getUsersFilterSchema = z.object({
    search: z.preprocess(
        value => emptyStringToUndefined(typeof value === 'string' ? value.trim() : value),
        z.string().optional()
    ),
    teamId: z.preprocess(emptyStringToUndefined, z.uuid().optional()),
});

export type GetUsersFilterSchemaType = z.infer<typeof getUsersFilterSchema>;
