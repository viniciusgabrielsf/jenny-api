import { z } from 'zod';
export const getOptionsSchema = z.object({
    orderField: z.string().optional(),
    order: z
        .string()
        .refine(value => value === 'ASC' || value === 'DESC', {
            message: 'ordem deve ser "ASC" ou "DESC"',
        })
        .optional(),
    limit: z
        .number({ message: 'limite deve ser um número' })
        .max(50, { message: 'limite máximo é 50' })
        .optional(),
    offset: z.number({ message: 'offset deve ser um número' }).optional(),
});

export type GetOptionsSchemaType = z.infer<typeof getOptionsSchema>;
