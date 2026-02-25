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
        if (!userId) throw new NotFoundException('User not found');
        let filter, options;

        try {
            filter = myPaymentsFilterSchema.parse({ ...req.params, userId });
            options = getOptionsSchema.parse(req.params);
        } catch (error) {
            throw new BadRequestException('Invalid query parameters');
        }

        const payments = await this.paymentsService.getPayments({ ...options, filter });

        if (!payments) throw new NotFoundException('Payments not found');

        res.status(200);
        res.json(payments);
    };
}
