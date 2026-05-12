import { Request, Response } from 'express';
import { TeamsService } from '../services/teams.service';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import { getTeamsQuerySchema } from '../helpers/schemas/teams/get-teams.schema';

export class TeamsController {
    constructor(private teamsService: TeamsService) {}

    getTeams = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('Usuario nao encontrado');

        let search: string | undefined;

        try {
            ({ search } = getTeamsQuerySchema.parse(req.query));
        } catch (error) {
            throw new BadRequestException('Parametros de consulta invalidos');
        }

        const result = await this.teamsService.getTeamsForUser(userId, search);

        res.status(200).json(result);
    };
}
