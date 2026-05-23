import { TeamPaymentsService } from '../services/team-payments.service';
import { Request, Response } from 'express';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { teamPaymentsFilterSchema } from '../helpers/schemas/team-payments/team-payments-filter.schema';
import { getOptionsSchema } from '../helpers/schemas/get-options.schema';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import { createTeamPaymentSchema } from '../helpers/schemas/team-payments/create-team-payment.schema';

export class TeamPaymentsController {
    constructor(private teamPaymentsService: TeamPaymentsService) {}

    createTeamPayment = async (req: Request, res: Response): Promise<void> => {
        const teamId = req.fullParams.teamId;
        if (!teamId) throw new NotFoundException('Time não encontrado');

        let paymentData;
        try {
            paymentData = createTeamPaymentSchema.parse(req.body);
        } catch (error) {
            throw new BadRequestException('Dados de pagamento inválidos');
        }

        const newPayment = await this.teamPaymentsService.createTeamPayment(
            teamId,
            paymentData.payerId,
            paymentData.debtorsIds,
            paymentData.title,
            paymentData.amount
        );

        res.status(201);
        res.json(newPayment);
    };

    getTeamPayments = async (req: Request, res: Response): Promise<void> => {
        const teamId = req.fullParams.teamId;
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
