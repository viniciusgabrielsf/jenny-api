import { PaymentsService } from '../services/payments.service';
import { Request, Response } from 'express';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { myPaymentsFilterSchema } from '../helpers/schemas/payments/my-payments-filter.schema';
import { getOptionsSchema } from '../helpers/schemas/get-options.schema';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';

export class PaymentsController {
    constructor(private paymentsService: PaymentsService) {}

    getMyPayments = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('Usuário não encontrado');
        let filter, options;

        try {
            filter = myPaymentsFilterSchema.parse(req.query?.filter);
            filter.userId = userId;
            options = getOptionsSchema.parse(req.query);
        } catch (error) {
            throw new BadRequestException('Parâmetros de consulta inválidos');
        }

        const { items, total } = await this.paymentsService.getPayments({
            ...options,
            filter,
        });

        if (!items) throw new NotFoundException('Pagamentos não encontrados');

        res.status(200);
        res.json({ items, total });
    };
}
