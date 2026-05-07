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
            throw new NotFoundException('Pagamento não encontrado');
        }

        await Payment.update(updates, { where: { id } });
    }

    async getPayment(
        id: number,
        options?: FindOptions<Attributes<Payment>>
    ): Promise<IPayment | null> {
        const existingPayment = await Payment.findOne({ ...options, where: { id } });

        if (!existingPayment) {
            throw new NotFoundException('Pagamento não encontrado');
        }

        return existingPayment;
    }

    // TODO define tiype of balances
    async getPayments(
        options?: IGetOptions<MyPaymentsFilterSchemaType>
    ): Promise<{ items: IPayment[]; total: number; balances: any[] }> {
        // const findOptions = this.buildFindOptions(options);

        // const payments = await Payment.findAndCountAll(findOptions);

        const payments = [
            {
                id: '1',
                userId: '95485d7a-9c06-49a4-a7b9-72db266cf18e',
                partakers: [
                    '95485d7a-9c06-49a4-a7b9-72db266cf18e',
                    '6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd',
                    '90920d0a-8e42-4b46-aa89-d68b97525375',
                    'd5b109c9-10f5-4a1f-ba5c-d6478170d39e',
                ],
                title: 'Pagamento de teste',
                amount: 100.0,
                paymentDate: new Date(),
                category: 'alimentação',
                status: 'pendente',
            },
            {
                id: '2',
                userId: '6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd',
                partakers: [
                    '95485d7a-9c06-49a4-a7b9-72db266cf18e',
                    '6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd',
                    '90920d0a-8e42-4b46-aa89-d68b97525375',
                    'd5b109c9-10f5-4a1f-ba5c-d6478170d39e',
                ],
                title: 'Pagamento de teste',
                amount: 100.0,
                paymentDate: new Date(),
                category: 'alimentação',
                status: 'pendente',
            },
            {
                id: '3',
                userId: '90920d0a-8e42-4b46-aa89-d68b97525375',
                partakers: [
                    '95485d7a-9c06-49a4-a7b9-72db266cf18e',
                    '6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd',
                    '90920d0a-8e42-4b46-aa89-d68b97525375',
                    'd5b109c9-10f5-4a1f-ba5c-d6478170d39e',
                ],
                title: 'Pagamento de teste',
                amount: 100.0,
                paymentDate: new Date(),
                category: 'alimentação',
                status: 'pendente',
            },
        ];

        return {
            items: payments.map(
                payment =>
                    ({
                        id: payment.id,
                        userId: payment.userId,
                        title: payment.title,
                        amount: payment.amount,
                        paymentDate: payment.paymentDate,
                        category: payment.category,
                        status: payment.status,
                    }) as IPayment
            ),
            total: 3,
            balances: this.settleUpPayments(payments),
        };
    }

    buildFindOptions = (options?: IGetOptions<MyPaymentsFilterSchemaType>): FindOptions => {
        const findOptions: FindOptions = buildBaseFindOptions(options);
        findOptions.where = {};
        const filters = options?.filter;

        const referenceDate = filters?.date ? moment(filters.date) : moment();
        const monthStart = referenceDate.clone().startOf('month').toDate();
        const monthEnd = referenceDate.clone().endOf('month').toDate();

        findOptions.where['paymentDate'] = {
            [Op.and]: [{ [Op.gte]: monthStart }, { [Op.lte]: monthEnd }],
        };

        if (filters) {
            if (filters.userId) findOptions.where['userId'] = filters.userId;
            if (filters.title) findOptions.where['title'] = { [Op.like]: `%${filters.title}%` };
            if (filters.category) findOptions.where['category'] = filters.category;
            if (filters.status) findOptions.where['status'] = filters.status;
        }

        return findOptions;
    };

    // TODO change to Payment[]
    settleUpPayments(payments: any[]): any[] {
        return [];
    }
}
