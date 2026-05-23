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
        const payerMembership = await TeamMembership.findOne({
            where: { teamId, userId: payerId },
        });

        if (!payerMembership) {
            throw new BadRequestException('O pagador deve ser membro do time');
        }

        const debtorMemberships = await TeamMembership.findAll({
            where: { teamId, userId: { [Op.in]: debtorsIds } },
        });

        if (debtorMemberships.length !== debtorsIds.length) {
            throw new BadRequestException('Todos os devedores devem ser membros do time');
        }

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
        teamId: string,
        paymentId: string,
        updates: {
            payerId?: string;
            debtorsIds?: string[];
            title?: string;
            amount?: number;
        }
    ): Promise<void> {
        const payment = await TeamPayment.findOne({ where: { id: paymentId, teamId } });

        if (!payment) {
            throw new NotFoundException('Pagamento do time não encontrado');
        }

        // If payerId is being updated, validate new payer is a team member
        if (updates.payerId && updates.payerId !== payment.payerId) {
            const payerMembership = await TeamMembership.findOne({
                where: { teamId, userId: updates.payerId },
            });

            if (!payerMembership) {
                throw new BadRequestException('O novo pagador deve ser membro do time');
            }
        }

        // If debtorsIds is being updated, validate all new debtors are team members
        if (updates.debtorsIds && updates.debtorsIds.length > 0) {
            const debtorMemberships = await TeamMembership.findAll({
                where: { teamId, userId: { [Op.in]: updates.debtorsIds } },
            });

            if (debtorMemberships.length !== updates.debtorsIds.length) {
                throw new BadRequestException('Todos os devedores devem ser membros do time');
            }
        }

        await TeamPayment.update(updates, { where: { id: paymentId } });
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

    async deleteTeamPayment(teamId: string, paymentId: string, userId: string): Promise<void> {
        const isMember = await TeamMembership.findOne({
            where: { teamId, userId },
        });

        if (!isMember) {
            throw new BadRequestException('Você não é membro deste time');
        }

        const payment = await TeamPayment.findOne({ where: { id: paymentId, teamId } });

        if (!payment) {
            throw new NotFoundException('Pagamento do time não encontrado');
        }

        await TeamPayment.destroy({ where: { id: paymentId } });
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
