import { Request, Response } from 'express';
import { TeamsService } from '../services/teams.service';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import { getTeamsQuerySchema } from '../helpers/schemas/teams/get-teams.schema';
import { createTeamBodySchema } from '../helpers/schemas/teams/create-team.schema';
import { updateTeamBodySchema } from '../helpers/schemas/teams/update-team.schema';

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

    createTeam = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('Usuario nao encontrado');

        let name: string;
        let members: string[];

        try {
            ({ name, members } = createTeamBodySchema.parse(req.body));
        } catch (error) {
            throw new BadRequestException('Dados de criacao do time invalidos');
        }

        const team = await this.teamsService.createTeam(name, userId, members);

        res.status(201).json(team);
    };

    updateTeam = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('Usuario nao encontrado');

        const { id } = req.params;

        let name: string;
        let members: string[];

        try {
            ({ name, members } = updateTeamBodySchema.parse(req.body));
        } catch (error) {
            throw new BadRequestException('Dados de atualizacao do time invalidos');
        }

        const team = await this.teamsService.updateTeam(id, userId, name, members);

        res.status(200).json(team);
    };
}
