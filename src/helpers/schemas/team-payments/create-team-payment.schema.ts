import { z } from 'zod';

export const createTeamPaymentSchema = z.object({
    payerId: z.uuid('Payer Id é obrigatório e deve ser um UUID válido'),
    debtorsIds: z
        .array(z.uuid('cada participante deve ser válido'))
        .min(1, 'Ao menos um participante é necessário'),
    title: z.string().min(1, 'Título não pode ser vazio'),
    amount: z
        .number()
        .int('Quantidade deve ser um número inteiro (sem casas decimais)')
        .gt(1, 'Quantidade deve ser maior que 1'),
});

export type CreateTeamPaymentSchemaType = z.infer<typeof createTeamPaymentSchema>;
