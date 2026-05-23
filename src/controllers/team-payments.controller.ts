import { TeamPaymentsService } from '../services/team-payments.service';
import { Request, Response } from 'express';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { teamPaymentsFilterSchema } from '../helpers/schemas/payments/team-payments-filter.schema';
import { getOptionsSchema } from '../helpers/schemas/get-options.schema';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';

export class TeamPaymentsController {
    constructor(private teamPaymentsService: TeamPaymentsService) {}

    getTeamPayments = async (req: Request, res: Response): Promise<void> => {
        const teamId = req.fullParams?.teamId;
        if (!teamId) throw new NotFoundException('Time não encontrado');

        let filter, options;

        try {
            filter = teamPaymentsFilterSchema.parse(req.query?.filter);
            filter.teamId = teamId;
            options = getOptionsSchema.parse(req.query);
        } catch (error) {
            throw new BadRequestException('Parâmetros de consulta inválidos');
        }

        const { items, total } = await this.teamPaymentsService.getTeamPayments({
            ...options,
            filter,
        });

        if (!items) throw new NotFoundException('Pagamentos não encontrados');

        res.status(200);
        res.json({ items, total });
    };
}
