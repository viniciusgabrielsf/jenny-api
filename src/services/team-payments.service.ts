import { Attributes, FindOptions } from 'sequelize/types/model';
import TeamPayment, { ITeamPayment } from '../models/team-payment.model';
import TeamMembership from '../models/team-membership.model';
import moment from 'moment';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import { IGetOptions } from '../config/interfaces';
import { buildBaseFindOptions } from '../helpers/get-options.helper';
import { Op } from 'sequelize';
import { TeamPaymentsFilterSchemaType } from '../helpers/schemas/team-payments/team-payments-filter.schema';

export type ITeamPaymentRequest = Omit<
    ITeamPayment,
    'id' | 'createdAt' | 'updatedAt' | 'paymentDate'
> & {
    paymentDate: string;
};

export class TeamPaymentsService {
    constructor() {}

    async createTeamPayment(
        teamId: string,
        payerId: string,
        debtorsIds: string[],
        title: string,
        amount: number
    ): Promise<ITeamPayment> {
        // Validate if payer is a member of the team
        const payerMembership = await TeamMembership.findOne({
            where: { teamId, userId: payerId },
        });

        if (!payerMembership) {
            throw new BadRequestException('O pagador deve ser membro do time');
        }

        // Validate if all debtors are members of the team
        const debtorMemberships = await TeamMembership.findAll({
            where: { teamId, userId: { [Op.in]: debtorsIds } },
        });

        if (debtorMemberships.length !== debtorsIds.length) {
            throw new BadRequestException('Todos os devedores devem ser membros do time');
        }

        // Create the team payment
        const newTeamPayment = await TeamPayment.create({
            teamId,
            payerId,
            debtorsIds,
            title,
            amount,
            paymentDate: moment().toDate(),
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
