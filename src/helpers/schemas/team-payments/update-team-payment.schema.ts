import { z } from 'zod';
import { emptyStringToUndefined } from '../../string.helper';

export const updateTeamPaymentSchema = z.object({
    payerId: z.preprocess(emptyStringToUndefined, z.uuid('deve ser um UUID válido').optional()),
    debtorsIds: z
        .array(z.uuid('deve ser um UUID válido'))
        .min(1, 'Ao menos um participante deve ser especificado')
        .optional(),
    title: z.string().min(1, 'Título não pode ser vazio').optional(),
    amount: z
        .number()
        .int('Quantidade deve ser um número inteiro (sem casas decimais)')
        .gt(1, 'Quantidade deve ser maior que 1')
        .optional(),
});

export type UpdateTeamPaymentSchemaType = z.infer<typeof updateTeamPaymentSchema>;
