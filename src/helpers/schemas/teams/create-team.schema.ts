import { z } from 'zod';

export const createTeamBodySchema = z.object({
    name: z.string().min(1, 'Nome do time é obrigatório'),
    members: z.array(z.string()).default([]),
});

export type CreateTeamBodySchemaType = z.infer<typeof createTeamBodySchema>;
