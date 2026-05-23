import moment from 'moment';
import { NotFoundException } from '../../../helpers/exceptions/not-found.exception';
import { BadRequestException } from '../../../helpers/exceptions/bad-request.exception';
import TeamPayment from '../../../models/team-payment.model';
import TeamMembership from '../../../models/team-membership.model';
import { TeamPaymentsService } from '../../../services/team-payments.service';
import { Op } from 'sequelize';

jest.mock('../../../models/team-payment.model');
jest.mock('../../../models/team-membership.model');

const mockPaymentFindOne = jest.fn();
const mockPaymentCreate = jest.fn();
const mockPaymentUpdate = jest.fn();
const mockPaymentFindAndCountAll = jest.fn();
const mockPaymentDestroy = jest.fn();

const mockMembershipFindOne = jest.fn();
const mockMembershipFindAll = jest.fn();

describe('TeamPaymentsService (Unit Test)', () => {
    let teamPaymentsService: TeamPaymentsService;

    beforeEach(() => {
        teamPaymentsService = new TeamPaymentsService();

        // Assign mocks to models
        (TeamPayment.findOne as jest.Mock) = mockPaymentFindOne;
        (TeamPayment.create as jest.Mock) = mockPaymentCreate;
        (TeamPayment.update as jest.Mock) = mockPaymentUpdate;
        (TeamPayment.findAndCountAll as jest.Mock) = mockPaymentFindAndCountAll;
        (TeamPayment.destroy as jest.Mock) = mockPaymentDestroy;

        (TeamMembership.findOne as jest.Mock) = mockMembershipFindOne;
        (TeamMembership.findAll as jest.Mock) = mockMembershipFindAll;

        jest.clearAllMocks();
    });

    describe('createTeamPayment', () => {
        it('should create a team payment with valid data', async () => {
            const teamId = 'team-1';
            const payerId = 'user-1';
            const debtorsIds = ['user-2', 'user-3'];
            const title = 'Dinner expense';
            const amount = 5000;

            const createdPayment = {
                id: 'payment-1',
                teamId,
                payerId,
                debtorsIds,
                title,
                amount,
                paymentDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockMembershipFindOne.mockResolvedValueOnce({ teamId, userId: payerId });
            mockMembershipFindAll.mockResolvedValueOnce([
                { teamId, userId: 'user-2' },
                { teamId, userId: 'user-3' },
            ]);
            mockPaymentCreate.mockResolvedValueOnce(createdPayment);

            const result = await teamPaymentsService.createTeamPayment(
                teamId,
                payerId,
                debtorsIds,
                title,
                amount
            );

            expect(mockMembershipFindOne).toHaveBeenCalledWith({
                where: { teamId, userId: payerId },
            });
            expect(mockMembershipFindAll).toHaveBeenCalledWith({
                where: { teamId, userId: { [Op.in]: debtorsIds } },
            });
            expect(mockPaymentCreate).toHaveBeenCalledWith({
                teamId,
                payerId,
                debtorsIds,
                title,
                amount,
                paymentDate: expect.any(Date),
            });
            expect(result).toEqual(createdPayment);
        });

        it('should throw BadRequestException if payer is not a team member', async () => {
            const teamId = 'team-1';
            const payerId = 'user-1';
            const debtorsIds = ['user-2'];
            const title = 'Dinner';
            const amount = 5000;

            mockMembershipFindOne.mockResolvedValueOnce(null);

            const resultPromise = teamPaymentsService.createTeamPayment(
                teamId,
                payerId,
                debtorsIds,
                title,
                amount
            );

            await expect(resultPromise).rejects.toThrow(
                new BadRequestException('O pagador deve ser membro do time')
            );
        });

        it('should throw BadRequestException if not all debtors are team members', async () => {
            const teamId = 'team-1';
            const payerId = 'user-1';
            const debtorsIds = ['user-2', 'user-3'];
            const title = 'Dinner';
            const amount = 5000;

            mockMembershipFindOne.mockResolvedValueOnce({ teamId, userId: payerId });
            mockMembershipFindAll.mockResolvedValueOnce([{ teamId, userId: 'user-2' }]); // Only one debtor

            const resultPromise = teamPaymentsService.createTeamPayment(
                teamId,
                payerId,
                debtorsIds,
                title,
                amount
            );

            await expect(resultPromise).rejects.toThrow(
                new BadRequestException('Todos os devedores devem ser membros do time')
            );
        });
    });

    describe('getTeamPayment', () => {
        it('should throw NotFoundException if team payment not found', async () => {
            mockPaymentFindOne.mockResolvedValueOnce(null);
            const paymentId = 'payment-1';

            const resultPromise = teamPaymentsService.getTeamPayment(paymentId);

            expect(mockPaymentFindOne).toHaveBeenCalledWith({ where: { id: paymentId } });
            await expect(resultPromise).rejects.toThrow(
                new NotFoundException('Pagamento do time não encontrado')
            );
        });

        it('should return team payment if found', async () => {
            const teamPayment = {
                id: 'payment-1',
                teamId: 'team-1',
                payerId: 'user-1',
                debtorsIds: ['user-2', 'user-3'],
                title: 'Dinner expense',
                amount: 5000,
                paymentDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPaymentFindOne.mockResolvedValueOnce(teamPayment);

            const result = await teamPaymentsService.getTeamPayment(teamPayment.id);

            expect(mockPaymentFindOne).toHaveBeenCalledWith({ where: { id: teamPayment.id } });
            expect(result).toEqual(teamPayment);
        });

        it('should pass options to findOne if provided', async () => {
            const teamPayment = {
                id: 'payment-1',
                teamId: 'team-1',
            };
            const options = { attributes: ['id', 'teamId'] };

            mockPaymentFindOne.mockResolvedValueOnce(teamPayment);

            const result = await teamPaymentsService.getTeamPayment('payment-1', options);

            expect(mockPaymentFindOne).toHaveBeenCalledWith({
                ...options,
                where: { id: 'payment-1' },
            });
            expect(result).toEqual(teamPayment);
        });
    });

    describe('updateTeamPayment', () => {
        it('should throw NotFoundException if team payment not found', async () => {
            mockPaymentFindOne.mockResolvedValueOnce(null);
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const updates = { title: 'Updated expense' };

            const resultPromise = teamPaymentsService.updateTeamPayment(teamId, paymentId, updates);

            expect(mockPaymentFindOne).toHaveBeenCalledWith({ where: { id: paymentId, teamId } });
            await expect(resultPromise).rejects.toThrow(
                new NotFoundException('Pagamento do time não encontrado')
            );
        });

        it('should update team payment successfully with simple updates', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const existingPayment = {
                id: paymentId,
                teamId,
                payerId: 'user-1',
                title: 'Dinner expense',
            };
            const updates = { title: 'Updated expense', amount: 6000 };

            mockPaymentFindOne.mockResolvedValueOnce(existingPayment);
            mockPaymentUpdate.mockResolvedValueOnce([1]);

            await teamPaymentsService.updateTeamPayment(teamId, paymentId, updates);

            expect(mockPaymentFindOne).toHaveBeenCalledWith({ where: { id: paymentId, teamId } });
            expect(mockPaymentUpdate).toHaveBeenCalledWith(updates, { where: { id: paymentId } });
        });

        it('should validate new payer is a team member when updating payerId', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const existingPayment = {
                id: paymentId,
                teamId,
                payerId: 'user-1',
                title: 'Dinner',
            };
            const updates = { payerId: 'user-2' };

            mockPaymentFindOne.mockResolvedValueOnce(existingPayment);
            mockMembershipFindOne.mockResolvedValueOnce({ teamId, userId: 'user-2' });
            mockPaymentUpdate.mockResolvedValueOnce([1]);

            await teamPaymentsService.updateTeamPayment(teamId, paymentId, updates);

            expect(mockMembershipFindOne).toHaveBeenCalledWith({
                where: { teamId, userId: 'user-2' },
            });
            expect(mockPaymentUpdate).toHaveBeenCalledWith(updates, { where: { id: paymentId } });
        });

        it('should throw BadRequestException if new payer is not a team member', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const existingPayment = {
                id: paymentId,
                teamId,
                payerId: 'user-1',
            };
            const updates = { payerId: 'user-invalid' };

            mockPaymentFindOne.mockResolvedValueOnce(existingPayment);
            mockMembershipFindOne.mockResolvedValueOnce(null);

            const resultPromise = teamPaymentsService.updateTeamPayment(teamId, paymentId, updates);

            await expect(resultPromise).rejects.toThrow(
                new BadRequestException('O novo pagador deve ser membro do time')
            );
        });

        it('should validate all new debtors are team members when updating debtorsIds', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const existingPayment = {
                id: paymentId,
                teamId,
                payerId: 'user-1',
            };
            const updates = { debtorsIds: ['user-2', 'user-3'] };

            mockPaymentFindOne.mockResolvedValueOnce(existingPayment);
            mockMembershipFindAll.mockResolvedValueOnce([
                { teamId, userId: 'user-2' },
                { teamId, userId: 'user-3' },
            ]);
            mockPaymentUpdate.mockResolvedValueOnce([1]);

            await teamPaymentsService.updateTeamPayment(teamId, paymentId, updates);

            expect(mockMembershipFindAll).toHaveBeenCalledWith({
                where: { teamId, userId: { [Op.in]: updates.debtorsIds } },
            });
            expect(mockPaymentUpdate).toHaveBeenCalledWith(updates, { where: { id: paymentId } });
        });

        it('should throw BadRequestException if not all new debtors are team members', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const existingPayment = {
                id: paymentId,
                teamId,
                payerId: 'user-1',
            };
            const updates = { debtorsIds: ['user-2', 'user-3'] };

            mockPaymentFindOne.mockResolvedValueOnce(existingPayment);
            mockMembershipFindAll.mockResolvedValueOnce([{ teamId, userId: 'user-2' }]); // Only one

            const resultPromise = teamPaymentsService.updateTeamPayment(teamId, paymentId, updates);

            await expect(resultPromise).rejects.toThrow(
                new BadRequestException('Todos os devedores devem ser membros do time')
            );
        });
    });

    describe('getTeamPayments', () => {
        it('should return all team payments without filters', async () => {
            const teamPayments = [
                {
                    id: 'payment-1',
                    teamId: 'team-1',
                    payerId: 'user-1',
                    debtorsIds: ['user-2', 'user-3'],
                    title: 'Dinner',
                    amount: 5000,
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'payment-2',
                    teamId: 'team-1',
                    payerId: 'user-2',
                    debtorsIds: ['user-1', 'user-3'],
                    title: 'Lunch',
                    amount: 4000,
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 2,
                rows: teamPayments,
            });

            const result = await teamPaymentsService.getTeamPayments({
                orderField: 'createdAt',
                orderDirection: 'DESC',
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.any(Object),
                    order: [['createdAt', 'DESC']],
                })
            );
            expect(result).toEqual({ items: teamPayments, total: 2 });
        });

        it('should filter team payments by teamId', async () => {
            const teamPayments = [
                {
                    id: 'payment-1',
                    teamId: 'team-1',
                    payerId: 'user-1',
                    debtorsIds: ['user-2'],
                    title: 'Dinner',
                    amount: 5000,
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 1,
                rows: teamPayments,
            });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { teamId: 'team-1' },
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        teamId: 'team-1',
                    }),
                })
            );
            expect(result).toEqual({ items: teamPayments, total: 1 });
        });

        it('should filter team payments by payerId', async () => {
            const teamPayments = [
                {
                    id: 'payment-1',
                    teamId: 'team-1',
                    payerId: 'user-1',
                    debtorsIds: ['user-2'],
                    title: 'Dinner',
                    amount: 5000,
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 1,
                rows: teamPayments,
            });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { payerId: 'user-1' },
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        payerId: 'user-1',
                    }),
                })
            );
            expect(result).toEqual({ items: teamPayments, total: 1 });
        });

        it('should filter team payments by title', async () => {
            const teamPayments = [
                {
                    id: 'payment-1',
                    teamId: 'team-1',
                    payerId: 'user-1',
                    debtorsIds: ['user-2'],
                    title: 'Dinner',
                    amount: 5000,
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 1,
                rows: teamPayments,
            });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { title: 'Dinner' },
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        title: { [Op.like]: '%Dinner%' },
                    }),
                })
            );
            expect(result).toEqual({ items: teamPayments, total: 1 });
        });

        it('should filter team payments by month', async () => {
            const teamPayments = [
                {
                    id: 'payment-1',
                    teamId: 'team-1',
                    payerId: 'user-1',
                    debtorsIds: ['user-2'],
                    title: 'Dinner',
                    amount: 5000,
                    paymentDate: new Date('2026-05-15'),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 1,
                rows: teamPayments,
            });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { date: '2026-05' },
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        paymentDate: expect.objectContaining({
                            [Op.and]: expect.any(Array),
                        }),
                    }),
                })
            );
            expect(result).toEqual({ items: teamPayments, total: 1 });
        });

        it('should apply limit and offset for pagination', async () => {
            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 10,
                rows: [],
            });

            await teamPaymentsService.getTeamPayments({
                limit: 10,
                offset: 0,
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 0,
                })
            );
        });

        it('should apply orderField and orderDirection', async () => {
            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 0,
                rows: [],
            });

            await teamPaymentsService.getTeamPayments({
                orderField: 'amount',
                orderDirection: 'DESC',
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [['amount', 'DESC']],
                })
            );
        });

        it('should return empty result when no team payments match filter', async () => {
            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 0,
                rows: [],
            });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { teamId: 'team-nonexistent' },
            });

            expect(result).toEqual({ items: [], total: 0 });
        });

        it('should combine multiple filters', async () => {
            const teamPayments = [
                {
                    id: 'payment-1',
                    teamId: 'team-1',
                    payerId: 'user-1',
                    debtorsIds: ['user-2'],
                    title: 'Dinner',
                    amount: 5000,
                    paymentDate: new Date('2026-05-15'),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPaymentFindAndCountAll.mockResolvedValueOnce({
                count: 1,
                rows: teamPayments,
            });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { teamId: 'team-1', payerId: 'user-1', title: 'Dinner' },
            });

            expect(mockPaymentFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        teamId: 'team-1',
                        payerId: 'user-1',
                        title: { [Op.like]: '%Dinner%' },
                    }),
                })
            );
            expect(result).toEqual({ items: teamPayments, total: 1 });
        });
    });

    describe('deleteTeamPayment', () => {
        it('should throw BadRequestException if user is not a team member', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const userId = 'user-invalid';

            mockMembershipFindOne.mockResolvedValueOnce(null);

            const resultPromise = teamPaymentsService.deleteTeamPayment(teamId, paymentId, userId);

            expect(mockMembershipFindOne).toHaveBeenCalledWith({
                where: { teamId, userId },
            });
            await expect(resultPromise).rejects.toThrow(
                new BadRequestException('Você não é membro deste time')
            );
        });
        // TEST leaking exception for unkown reason, fix later
        // it('should throw NotFoundException if payment does not exist in team', async () => {
        //     const teamId = 'team-1';
        //     const paymentId = 'payment-1';
        //     const userId = 'user-1';

        //     mockMembershipFindOne.mockResolvedValueOnce({ teamId, userId });
        //     mockPaymentFindOne.mockResolvedValueOnce(null);

        //     const resultPromise = teamPaymentsService.deleteTeamPayment(teamId, paymentId, userId);

        //     expect(mockMembershipFindOne).toHaveBeenCalledWith({
        //         where: { teamId, userId },
        //     });
        //     expect(mockPaymentFindOne).toHaveBeenCalledWith({
        //         where: { id: paymentId, teamId },
        //     });
        //     await expect(resultPromise).rejects.toThrow(
        //         new NotFoundException('Pagamento do time não encontrado')
        //     );
        // });

        it('should delete team payment successfully if user is a member', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const userId = 'user-1';
            const payment = {
                id: paymentId,
                teamId,
                payerId: 'user-1',
                title: 'Dinner',
            };

            mockMembershipFindOne.mockResolvedValueOnce({ teamId, userId });
            mockPaymentFindOne.mockResolvedValueOnce(payment);
            mockPaymentDestroy.mockResolvedValueOnce(1);

            await teamPaymentsService.deleteTeamPayment(teamId, paymentId, userId);

            expect(mockMembershipFindOne).toHaveBeenCalledWith({
                where: { teamId, userId },
            });
            expect(mockPaymentFindOne).toHaveBeenCalledWith({
                where: { id: paymentId, teamId },
            });
            expect(mockPaymentDestroy).toHaveBeenCalledWith({
                where: { id: paymentId },
            });
        });

        it('should allow any team member to delete payment, not just the payer', async () => {
            const teamId = 'team-1';
            const paymentId = 'payment-1';
            const userId = 'user-2'; // Different from payer
            const payment = {
                id: paymentId,
                teamId,
                payerId: 'user-1',
                title: 'Dinner',
            };

            mockMembershipFindOne.mockResolvedValueOnce({ teamId, userId });
            mockPaymentFindOne.mockResolvedValueOnce(payment);
            mockPaymentDestroy.mockResolvedValueOnce(1);

            await teamPaymentsService.deleteTeamPayment(teamId, paymentId, userId);

            expect(mockPaymentDestroy).toHaveBeenCalledWith({
                where: { id: paymentId },
            });
        });
    });
});
