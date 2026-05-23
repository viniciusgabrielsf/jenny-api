import { TeamPaymentsService } from '../services/team-payments.service';
import { Request, Response } from 'express';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { teamPaymentsFilterSchema } from '../helpers/schemas/team-payments/team-payments-filter.schema';
import { getOptionsSchema } from '../helpers/schemas/get-options.schema';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import { createTeamPaymentSchema } from '../helpers/schemas/team-payments/create-team-payment.schema';
import { updateTeamPaymentSchema } from '../helpers/schemas/team-payments/update-team-payment.schema';

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

    updateTeamPayment = async (req: Request, res: Response): Promise<void> => {
        const teamId = req.fullParams.teamId;
        const paymentId = req.fullParams.paymentId;

        if (!teamId) throw new NotFoundException('Time não encontrado');
        if (!paymentId) throw new NotFoundException('Pagamento não encontrado');

        let updateData;
        try {
            updateData = updateTeamPaymentSchema.parse(req.body);
        } catch (error) {
            throw new BadRequestException('Dados de atualização inválidos');
        }

        await this.teamPaymentsService.updateTeamPayment(teamId, paymentId, updateData);

        res.status(200);
        res.json({ message: 'Pagamento atualizado com sucesso' });
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

    deleteTeamPayment = async (req: Request, res: Response): Promise<void> => {
        const teamId = req.fullParams.teamId;
        const paymentId = req.fullParams.paymentId;
        const userId = req.user?.id;

        if (!teamId) throw new NotFoundException('Time não encontrado');
        if (!paymentId) throw new NotFoundException('Pagamento não encontrado');

        await this.teamPaymentsService.deleteTeamPayment(teamId, paymentId, userId!);

        res.status(200);
        res.json({ message: 'Pagamento deletado com sucesso' });
    };
}
