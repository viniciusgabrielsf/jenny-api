import { Attributes, FindOptions } from 'sequelize/types/model';
import Payment, { IPayment } from '../models/payment.model';
import moment from 'moment';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { IGetOptions } from '../config/interfaces';
import { buildBaseFindOptions } from '../helpers/get-options.helper';
import { Op } from 'sequelize';
import { MyPaymentsFilterSchemaType } from '../helpers/schemas/payments/my-payments-filter.schema';

export class PaymentsService {
    constructor() {}

    async createPayment(
        paymentData: Omit<IPayment, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<IPayment> {
        const newPayment = await Payment.create({
            userId: paymentData.userId,
            title: paymentData.title,
            amount: paymentData.amount,
            paymentDate: moment(paymentData.paymentDate, 'YYYY-MM-DD').toDate(),
            category: paymentData.category,
            status: paymentData.status,
        });

        return newPayment;
    }

    async updatePayment(
        id: number,
        updates: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<void> {
        const payment = await Payment.findOne({ where: { id } });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        await Payment.update(updates, { where: { id } });
    }

    async getPayment(
        id: number,
        options?: FindOptions<Attributes<Payment>>
    ): Promise<IPayment | null> {
        const existingPayment = await Payment.findOne({ ...options, where: { id } });

        if (!existingPayment) {
            throw new NotFoundException('Payment not found');
        }

        return existingPayment;
    }

    async getPayments(options?: IGetOptions<MyPaymentsFilterSchemaType>): Promise<IPayment[]> {
        const findOptions = this.buildFindOptions(options);

        const payments = await Payment.findAll(findOptions);

        return payments;
    }

    buildFindOptions = (options?: IGetOptions<MyPaymentsFilterSchemaType>): FindOptions => {
        const findOptions: FindOptions = buildBaseFindOptions(options);
        const filters = options?.filter;

        if (filters) {
            findOptions.where = {};

            if (filters.userId) findOptions.where['userId'] = filters.userId;
            if (filters.title) findOptions.where['title'] = { [Op.like]: `%${filters.title}%` };
            if (filters.category) findOptions.where['category'] = filters.category;
            if (filters.status) findOptions.where['status'] = filters.status;
        }

        return findOptions;
    };
}
