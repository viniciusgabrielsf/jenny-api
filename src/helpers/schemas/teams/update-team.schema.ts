import { z } from 'zod';

export const updateTeamBodySchema = z.object({
    name: z.string().min(1, 'Nome do time é obrigatório'),
    members: z.array(z.string()).min(1, 'Time deve ter pelo menos um membro'),
});

export type UpdateTeamBodySchemaType = z.infer<typeof updateTeamBodySchema>;
