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
import User from '../models/user.model';
import Team from '../models/team.model';

export type ITeamPaymentRequest = Omit<
    ITeamPayment,
    'id' | 'createdAt' | 'updatedAt' | 'paymentDate'
> & {
    paymentDate: string;
};

export type BalancedPayment = {
    from: string;
    to: string;
    amount: number;
};

export type Balance = {
    from: User;
    to: User;
    amount: number;
};

export type MinCostFlowEdge = {
    from: string;
    to: string;
    flow: number;
};

export type ITeamPaymentResponse = ITeamPayment & {
    debtors: User[];
    payer: User;
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

    async getTeamPayments(
        options?: IGetOptions<TeamPaymentsFilterSchemaType>
    ): Promise<{ items: ITeamPaymentResponse[]; total: number; balances: Balance[] }> {
        const findOptions = this.buildFindOptions(options);

        const teamPayments = await TeamPayment.findAndCountAll({
            ...findOptions,
            include: [
                {
                    model: User,
                    as: 'payer',
                    attributes: ['id', 'fullName', 'avatar'],
                },
            ],
        });

        const team = await Team.findOne({
            where: { id: options?.filter?.teamId },
            attributes: ['id', 'name', 'createdByUserId', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: TeamMembership,
                    as: 'memberships',
                    attributes: ['teamId', 'userId'],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'fullName', 'avatar'],
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const members = team?.memberships ? team.memberships.map(m => m.user) : [];

        const balances = this.settleUpPayments(
            teamPayments.rows,
            members.map(u => u!)
        );

        return {
            items: teamPayments.rows.map(payment => ({
                ...payment.get(),
                payer: payment.payer,
                debtors: members.filter(m => payment.debtorsIds.includes(m?.id || '')),
            })),
            total: teamPayments.count,
            balances,
        };
    }

    private buildFindOptions = (
        options?: IGetOptions<TeamPaymentsFilterSchemaType>
    ): FindOptions => {
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

    private settleUpPayments(originalPayments: TeamPayment[], members: User[]): Balance[] {
        const { graph, netChanges } = this.buildFlowNetwork(originalPayments, members);

        // Run successive shortest path algorithm
        const resultFlow = this.successiveShortestPath(graph, 'source', 'sink', netChanges);

        return resultFlow.map(edge => ({
            from: members.find(m => m.id === edge.from)!,
            to: members.find(m => m.id === edge.to)!,
            amount: edge.flow,
        }));
    }

    private buildFlowNetwork(originalPayments: TeamPayment[], members: User[]) {
        // Initialize residual graph
        const graph = new Map<string, Map<string, { capacity: number; flow: number }>>();
        const netChanges = new Map<string, number>();

        // Initialize all vertices
        const allVertices = ['source', 'sink', ...members.map(m => m.id)];
        for (const vertex of allVertices) {
            graph.set(vertex, new Map());
            if (vertex !== 'source' && vertex !== 'sink') {
                netChanges.set(vertex, 0);
            }
        }

        // Build edges from original payments
        for (const originalPayment of originalPayments) {
            const mod = originalPayment.amount % originalPayment.debtorsIds.length;
            const amountPerDebtor =
                (originalPayment.amount - mod) / originalPayment.debtorsIds.length;

            // Update net changes for payer (receives full amount + mod goes to payer's account)
            netChanges.set(
                originalPayment.payerId,
                (netChanges.get(originalPayment.payerId) || 0) + originalPayment.amount
            );

            for (const debtorId of originalPayment.debtorsIds) {
                // Update net change for debtor (owes their share)
                netChanges.set(debtorId, (netChanges.get(debtorId) || 0) - amountPerDebtor);

                if (debtorId === originalPayment.payerId) continue; // Skip self loops

                // Add or update edge capacity in residual graph
                this.addOrUpdateEdge(graph, debtorId, originalPayment.payerId, amountPerDebtor);
            }
        }

        // Connect source to users with negative net change (debtors)
        // Connect users with positive net change (creditors) to sink
        for (const [userId, netChange] of netChanges.entries()) {
            if (netChange < 0) {
                // User owes money: source -> user with capacity |netChange|
                this.addOrUpdateEdge(graph, 'source', userId, Math.abs(netChange));
            } else if (netChange > 0) {
                // User should receive money: user -> sink with capacity netChange
                this.addOrUpdateEdge(graph, userId, 'sink', netChange);
            }
        }

        return { graph, netChanges };
    }

    private addOrUpdateEdge(
        graph: Map<string, Map<string, { capacity: number; flow: number }>>,
        from: string,
        to: string,
        capacity: number
    ): void {
        const fromNode = graph.get(from)!;
        const existingEdge = fromNode.get(to);

        if (existingEdge) {
            existingEdge.capacity += capacity;
        } else {
            fromNode.set(to, { capacity, flow: 0 });
            // Initialize reverse edge for residual graph
            graph.get(to)!.set(from, { capacity: 0, flow: 0 });
        }
    }

    private successiveShortestPath(
        graph: Map<string, Map<string, { capacity: number; flow: number }>>,
        source: string,
        sink: string,
        netChanges: Map<string, number>
    ): MinCostFlowEdge[] {
        const totalFlow = Array.from(netChanges.values())
            .filter(v => v > 0)
            .reduce((sum, v) => sum + v, 0);

        let currentFlow = 0;

        while (currentFlow < totalFlow) {
            // Find shortest path using BFS (all edge costs are 1)
            const path = this.findShortestPath(graph, source, sink);

            if (!path) {
                // No more augmenting paths
                break;
            }

            // Find bottleneck capacity along the path
            let bottleneck = Infinity;
            for (let i = 0; i < path.length - 1; i++) {
                const from = path[i];
                const to = path[i + 1];
                const edge = graph.get(from)!.get(to)!;
                const residualCapacity = edge.capacity - edge.flow;
                bottleneck = Math.min(bottleneck, residualCapacity);
            }

            // Push flow along the path
            for (let i = 0; i < path.length - 1; i++) {
                const from = path[i];
                const to = path[i + 1];
                const edge = graph.get(from)!.get(to)!;
                const reverseEdge = graph.get(to)!.get(from)!;

                edge.flow += bottleneck;
                reverseEdge.capacity += bottleneck;
            }

            currentFlow += bottleneck;
        }

        return this.extractFinalFlow(graph);
    }

    // TODO optimize with Dijkstra's algorithm and potentials for better performance on larger graphs
    // TODO use max capacity as draw settlement for two paths with same start and end to reduce number of transactions
    private findShortestPath(
        graph: Map<string, Map<string, { capacity: number; flow: number }>>,
        source: string,
        sink: string
    ): string[] | null {
        const queue: string[] = [source];
        const visited = new Set<string>([source]);
        const parent = new Map<string, string>();

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current === sink) {
                // Reconstruct path
                const path: string[] = [];
                let node: string | undefined = sink;
                while (node) {
                    path.unshift(node);
                    node = parent.get(node);
                }
                return path;
            }

            // Explore neighbors with available capacity
            const neighbors = graph.get(current)!;
            for (const [neighbor, edge] of neighbors.entries()) {
                const residualCapacity = edge.capacity - edge.flow;
                if (!visited.has(neighbor) && residualCapacity > 0) {
                    visited.add(neighbor);
                    parent.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }

        return null; // No path found
    }

    // Extract final flow edges (excluding source and sink, only include positive flows between users)
    private extractFinalFlow(
        graph: Map<string, Map<string, { capacity: number; flow: number }>>
    ): MinCostFlowEdge[] {
        const resultFlow: MinCostFlowEdge[] = [];
        for (const [from, neighbors] of graph.entries()) {
            if (from === 'source' || from === 'sink') continue;

            for (const [to, edge] of neighbors.entries()) {
                if (to === 'source' || to === 'sink') continue;
                if (edge.flow > 0) {
                    resultFlow.push({ from, to, flow: edge.flow });
                }
            }
        }

        return resultFlow;
    }
}
