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

type FlowEdge = {
    to: string;
    capacity: number;
    flow: number;
    cost: number;
    // Index of the matching reverse edge inside graph.get(to) — lets us refund flow in O(1).
    rev: number;
    // Real debt/source/sink edge (a candidate transaction) vs. a residual edge used only for routing.
    isReal: boolean;
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
        // Residual graph as an adjacency list. Adjacency lists (rather than a
        // from->to->edge map) are required so a real edge and its residual edge
        // can coexist for the same ordered pair, and so antiparallel debts
        // (A owes B *and* B owes A) are kept as two independent real edges.
        const graph = new Map<string, FlowEdge[]>();
        const netChanges = new Map<string, number>();

        // Initialize all vertices
        const allVertices = ['source', 'sink', ...members.map(m => m.id)];
        for (const vertex of allVertices) {
            graph.set(vertex, []);
            if (vertex !== 'source' && vertex !== 'sink') {
                netChanges.set(vertex, 0);
            }
        }

        // Build edges from original payments
        for (const originalPayment of originalPayments) {
            const debtorCount = originalPayment.debtorsIds.length;
            const baseShare = Math.floor(originalPayment.amount / debtorCount);
            // Units that don't divide evenly are handed out one-by-one to the first
            // `remainder` debtors so the books stay balanced (sum of shares === amount).
            const remainder = originalPayment.amount - baseShare * debtorCount;

            // Payer is credited the full amount.
            netChanges.set(
                originalPayment.payerId,
                (netChanges.get(originalPayment.payerId) || 0) + originalPayment.amount
            );

            for (let i = 0; i < debtorCount; i++) {
                const debtorId = originalPayment.debtorsIds[i];
                const share = baseShare + (i < remainder ? 1 : 0);

                // Update net change for debtor (owes their share)
                netChanges.set(debtorId, (netChanges.get(debtorId) || 0) - share);

                if (debtorId === originalPayment.payerId) continue; // Skip self loops

                // Real debt edge: one monetary transaction, so cost 1.
                this.addEdge(graph, debtorId, originalPayment.payerId, share, 1);
            }
        }

        // Connect source to users with negative net change (debtors)
        // Connect users with positive net change (creditors) to sink.
        // These are artificial edges, not transactions, so their cost is 0.
        for (const [userId, netChange] of netChanges.entries()) {
            if (netChange < 0) {
                // User owes money: source -> user with capacity |netChange|
                this.addEdge(graph, 'source', userId, Math.abs(netChange), 0);
            } else if (netChange > 0) {
                // User should receive money: user -> sink with capacity netChange
                this.addEdge(graph, userId, 'sink', netChange, 0);
            }
        }

        return { graph, netChanges };
    }

    private addEdge(
        graph: Map<string, FlowEdge[]>,
        from: string,
        to: string,
        capacity: number,
        cost: number
    ): void {
        const fromList = graph.get(from)!;

        // Merge parallel debts in the same direction so the settlement keeps a
        // single transaction per ordered pair.
        const existing = fromList.find(e => e.isReal && e.to === to);
        if (existing) {
            existing.capacity += capacity;
            return;
        }

        const toList = graph.get(to)!;
        fromList.push({ to, capacity, flow: 0, cost, rev: toList.length, isReal: true });
        // Residual edge: zero capacity and negated cost so cancelling flow refunds its cost.
        toList.push({
            to: from,
            capacity: 0,
            flow: 0,
            cost: -cost,
            rev: fromList.length - 1,
            isReal: false,
        });
    }

    private successiveShortestPath(
        graph: Map<string, FlowEdge[]>,
        source: string,
        sink: string,
        netChanges: Map<string, number>
    ): MinCostFlowEdge[] {
        const totalFlow = Array.from(netChanges.values())
            .filter(v => v > 0)
            .reduce((sum, v) => sum + v, 0);

        let currentFlow = 0;

        // Johnson potentials let us route with Dijkstra even though residual edges
        // carry negative cost. They start at 0 (no negative-cost edge is usable yet).
        const potential = new Map<string, number>();
        for (const vertex of graph.keys()) potential.set(vertex, 0);

        while (currentFlow < totalFlow) {
            const { dist, prevNode, prevEdgeIdx } = this.dijkstra(graph, source, potential);

            // No remaining augmenting path. The balanced construction guarantees we
            // always reach totalFlow, but guard against it to avoid an infinite loop.
            if (dist.get(sink) === Infinity) break;

            // Shift potentials by the latest shortest-path distances (keeps reduced costs >= 0).
            for (const [vertex, d] of dist.entries()) {
                if (d < Infinity) potential.set(vertex, potential.get(vertex)! + d);
            }

            // Bottleneck residual capacity along the chosen path.
            let bottleneck = totalFlow - currentFlow;
            for (let node = sink; node !== source; node = prevNode.get(node)!) {
                const edge = graph.get(prevNode.get(node)!)![prevEdgeIdx.get(node)!];
                bottleneck = Math.min(bottleneck, edge.capacity - edge.flow);
            }

            // Push flow forward and refund it on the reverse (residual) edge. Using
            // antisymmetric flow means extractFinalFlow reads the true net flow.
            for (let node = sink; node !== source; node = prevNode.get(node)!) {
                const edge = graph.get(prevNode.get(node)!)![prevEdgeIdx.get(node)!];
                edge.flow += bottleneck;
                graph.get(edge.to)![edge.rev].flow -= bottleneck;
            }

            currentFlow += bottleneck;
        }

        return this.extractFinalFlow(graph);
    }

    // Shortest path by reduced cost over the residual graph (Dijkstra + Johnson potentials).
    // TODO use max capacity as a tie-breaker between equal-cost paths to further reduce transactions
    private dijkstra(
        graph: Map<string, FlowEdge[]>,
        source: string,
        potential: Map<string, number>
    ): {
        dist: Map<string, number>;
        prevNode: Map<string, string>;
        prevEdgeIdx: Map<string, number>;
    } {
        const dist = new Map<string, number>();
        const prevNode = new Map<string, string>();
        const prevEdgeIdx = new Map<string, number>();
        const visited = new Set<string>();

        for (const vertex of graph.keys()) dist.set(vertex, Infinity);
        dist.set(source, 0);

        while (true) {
            // Pick the unvisited vertex with the smallest tentative distance.
            // O(V^2) is fine here: a team has few members, so the graph is tiny.
            let current: string | null = null;
            let best = Infinity;
            for (const [vertex, d] of dist.entries()) {
                if (!visited.has(vertex) && d < best) {
                    best = d;
                    current = vertex;
                }
            }
            if (current === null) break;
            visited.add(current);

            const edges = graph.get(current)!;
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i];
                if (edge.capacity - edge.flow <= 0) continue; // no residual capacity

                // Reduced cost is kept non-negative by the potentials.
                const reducedCost =
                    edge.cost + potential.get(current)! - potential.get(edge.to)!;
                const candidate = dist.get(current)! + reducedCost;
                if (candidate < dist.get(edge.to)!) {
                    dist.set(edge.to, candidate);
                    prevNode.set(edge.to, current);
                    prevEdgeIdx.set(edge.to, i);
                }
            }
        }

        return { dist, prevNode, prevEdgeIdx };
    }

    // Extract final flow edges (excluding source and sink, only real edges with positive net flow)
    private extractFinalFlow(graph: Map<string, FlowEdge[]>): MinCostFlowEdge[] {
        const resultFlow: MinCostFlowEdge[] = [];
        for (const [from, edges] of graph.entries()) {
            if (from === 'source' || from === 'sink') continue;

            for (const edge of edges) {
                if (edge.to === 'source' || edge.to === 'sink') continue;
                // Only real edges are transactions; residual edges hold negative flow.
                if (edge.isReal && edge.flow > 0) {
                    resultFlow.push({ from, to: edge.to, flow: edge.flow });
                }
            }
        }

        return resultFlow;
    }
}
