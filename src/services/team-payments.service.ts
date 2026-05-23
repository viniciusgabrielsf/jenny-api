import { Attributes, FindOptions } from 'sequelize/types/model';
import TeamPayment, { ITeamPayment } from '../models/team-payment.model';
import moment from 'moment';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { IGetOptions } from '../config/interfaces';
import { buildBaseFindOptions } from '../helpers/get-options.helper';
import { Op } from 'sequelize';
import { TeamPaymentsFilterSchemaType } from '../helpers/schemas/payments/team-payments-filter.schema';

export type ITeamPaymentRequest = Omit<
    ITeamPayment,
    'id' | 'createdAt' | 'updatedAt' | 'paymentDate'
> & {
    paymentDate: string;
};

export class TeamPaymentsService {
    constructor() {}

    async createTeamPayment(teamPaymentData: ITeamPaymentRequest): Promise<ITeamPayment> {
        const newTeamPayment = await TeamPayment.create({
            teamId: teamPaymentData.teamId,
            payerId: teamPaymentData.payerId,
            debtorsIds: teamPaymentData.debtorsIds,
            title: teamPaymentData.title,
            amount: teamPaymentData.amount,
            paymentDate: moment(teamPaymentData.paymentDate, 'YYYY-MM-DD').toDate(),
        });

        return newTeamPayment;
    }

    async updateTeamPayment(
        id: string,
        updates: Partial<Omit<TeamPayment, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<void> {
        const teamPayment = await TeamPayment.findOne({ where: { id } });

        if (!teamPayment) {
            throw new NotFoundException('Pagamento do time não encontrado');
        }

        await TeamPayment.update(updates, { where: { id } });
    }

    async getTeamPayment(
        id: string,
        options?: FindOptions<Attributes<TeamPayment>>
    ): Promise<ITeamPayment | null> {
        const existingTeamPayment = await TeamPayment.findOne({ ...options, where: { id } });

        if (!existingTeamPayment) {
            throw new NotFoundException('Pagamento do time não encontrado');
        }

        return existingTeamPayment;
    }

    async getTeamPayments(
        options?: IGetOptions<TeamPaymentsFilterSchemaType>
    ): Promise<{ items: ITeamPayment[]; total: number }> {
        const findOptions = this.buildFindOptions(options);

        const teamPayments = await TeamPayment.findAndCountAll(findOptions);

        return {
            items: teamPayments.rows,
            total: teamPayments.count,
        };
    }

    buildFindOptions = (options?: IGetOptions<TeamPaymentsFilterSchemaType>): FindOptions => {
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
            if (filters.teamId) findOptions.where['teamId'] = filters.teamId;
            if (filters.title) findOptions.where['title'] = { [Op.like]: `%${filters.title}%` };
            if (filters.payerId) findOptions.where['payerId'] = filters.payerId;
        }

        return findOptions;
    };
}
