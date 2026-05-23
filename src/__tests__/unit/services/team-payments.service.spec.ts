import moment from 'moment';
import { NotFoundException } from '../../../helpers/exceptions/not-found.exception';
import TeamPayment from '../../../models/team-payment.model';
import { TeamPaymentsService } from '../../../services/team-payments.service';
import { Op } from 'sequelize';

const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockFindAndCountAll = jest.fn();

jest.mock('../../../models/team-payment.model', () => {
    return jest.fn().mockImplementation(() => {
        return { findOne: mockFindOne, create: mockCreate, update: mockUpdate };
    });
});

describe('TeamPaymentsService (Unit Test)', () => {
    let teamPaymentsService: TeamPaymentsService;

    beforeEach(() => {
        teamPaymentsService = new TeamPaymentsService();

        TeamPayment.findOne = mockFindOne;
        TeamPayment.create = mockCreate;
        TeamPayment.update = mockUpdate;
        TeamPayment.findAndCountAll = mockFindAndCountAll;
        jest.clearAllMocks();
    });

    describe('createTeamPayment', () => {
        it('should create a team payment with valid data', async () => {
            const teamPaymentData = {
                teamId: 'team-1',
                payerId: 'user-1',
                debtorsIds: ['user-2', 'user-3'],
                title: 'Dinner expense',
                amount: 5000,
                paymentDate: '2026-05-23',
            };

            const createdPayment = {
                id: 'payment-1',
                ...teamPaymentData,
                paymentDate: moment(teamPaymentData.paymentDate, 'YYYY-MM-DD').toDate(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockCreate.mockResolvedValueOnce(createdPayment);

            const result = await teamPaymentsService.createTeamPayment(teamPaymentData);

            expect(mockCreate).toHaveBeenCalledWith({
                teamId: teamPaymentData.teamId,
                payerId: teamPaymentData.payerId,
                debtorsIds: teamPaymentData.debtorsIds,
                title: teamPaymentData.title,
                amount: teamPaymentData.amount,
                paymentDate: moment(teamPaymentData.paymentDate, 'YYYY-MM-DD').toDate(),
            });
            expect(result).toEqual(createdPayment);
        });
    });

    describe('getTeamPayment', () => {
        it('should throw NotFoundException if team payment not found', async () => {
            mockFindOne.mockResolvedValueOnce(null);
            const paymentId = 'payment-1';

            const resultPromise = teamPaymentsService.getTeamPayment(paymentId);

            expect(mockFindOne).toHaveBeenCalledWith({ where: { id: paymentId } });
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

            mockFindOne.mockResolvedValueOnce(teamPayment);

            const result = await teamPaymentsService.getTeamPayment(teamPayment.id);

            expect(mockFindOne).toHaveBeenCalledWith({ where: { id: teamPayment.id } });
            expect(result).toEqual(teamPayment);
        });
    });

    describe('updateTeamPayment', () => {
        it('should throw NotFoundException if team payment not found', async () => {
            mockFindOne.mockResolvedValueOnce(null);
            const paymentId = 'payment-1';
            const updates = { title: 'Updated expense' };

            const resultPromise = teamPaymentsService.updateTeamPayment(paymentId, updates);

            expect(mockFindOne).toHaveBeenCalledWith({ where: { id: paymentId } });
            await expect(resultPromise).rejects.toThrow(
                new NotFoundException('Pagamento do time não encontrado')
            );
        });

        it('should update team payment successfully', async () => {
            const paymentId = 'payment-1';
            const existingPayment = {
                id: paymentId,
                teamId: 'team-1',
                title: 'Dinner expense',
            };
            const updates = { title: 'Updated expense', amount: 6000 };

            mockFindOne.mockResolvedValueOnce(existingPayment);
            mockUpdate.mockResolvedValueOnce([1]);

            await teamPaymentsService.updateTeamPayment(paymentId, updates);

            expect(mockFindOne).toHaveBeenCalledWith({ where: { id: paymentId } });
            expect(mockUpdate).toHaveBeenCalledWith(updates, { where: { id: paymentId } });
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

            mockFindAndCountAll.mockResolvedValueOnce({ count: 2, rows: teamPayments });

            const result = await teamPaymentsService.getTeamPayments({
                orderField: 'createdAt',
                orderDirection: 'DESC',
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
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

            mockFindAndCountAll.mockResolvedValueOnce({ count: 1, rows: teamPayments });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { teamId: 'team-1' },
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
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

            mockFindAndCountAll.mockResolvedValueOnce({ count: 1, rows: teamPayments });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { payerId: 'user-1' },
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
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

            mockFindAndCountAll.mockResolvedValueOnce({ count: 1, rows: teamPayments });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { title: 'Dinner' },
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
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

            mockFindAndCountAll.mockResolvedValueOnce({ count: 1, rows: teamPayments });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { date: '2026-05' },
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
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
            const teamPayments: any[] = [];

            mockFindAndCountAll.mockResolvedValueOnce({ count: 10, rows: teamPayments });

            await teamPaymentsService.getTeamPayments({
                limit: 10,
                offset: 0,
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 0,
                })
            );
        });

        it('should apply orderField and orderDirection', async () => {
            const teamPayments: any[] = [];

            mockFindAndCountAll.mockResolvedValueOnce({ count: 0, rows: teamPayments });

            await teamPaymentsService.getTeamPayments({
                orderField: 'amount',
                orderDirection: 'DESC',
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [['amount', 'DESC']],
                })
            );
        });

        it('should return empty result when no team payments match filter', async () => {
            mockFindAndCountAll.mockResolvedValueOnce({ count: 0, rows: [] });

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

            mockFindAndCountAll.mockResolvedValueOnce({ count: 1, rows: teamPayments });

            const result = await teamPaymentsService.getTeamPayments({
                filter: { teamId: 'team-1', payerId: 'user-1', title: 'Dinner' },
            });

            expect(mockFindAndCountAll).toHaveBeenCalledWith(
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
});
