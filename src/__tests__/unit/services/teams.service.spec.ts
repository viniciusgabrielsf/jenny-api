import { TeamsService } from '../../../services/teams.service';
import Team from '../../../models/team.model';
import TeamMembership from '../../../models/team-membership.model';
import User from '../../../models/user.model';
import { Op } from 'sequelize';

jest.mock('../../../models/team.model');
jest.mock('../../../models/team-membership.model');
jest.mock('../../../models/user.model');
jest.mock('../../../config/db', () => ({
    sequelize: {
        transaction: jest.fn(),
    },
}));

import { sequelize } from '../../../config/db';

describe('TeamsService (Unit Test)', () => {
    let teamsService: TeamsService;
    const mockTeam = {
        id: 'team-1',
        name: 'Test Team',
        createdByUserId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        memberships: [],
    };

    const mockUser = {
        id: 'user-1',
        fullName: 'Test User',
        avatar: 'avatar-url',
    };

    const mockMembership = {
        teamId: 'team-1',
        userId: 'user-1',
        user: mockUser,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        teamsService = new TeamsService();
    });

    describe('getTeamsForUser', () => {
        it('should return empty teams list if user has no memberships', async () => {
            (TeamMembership.findAll as jest.Mock).mockResolvedValue([]);

            const result = await teamsService.getTeamsForUser('user-1');

            expect(result).toEqual({ items: [], total: 0 });
            expect(TeamMembership.findAll).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                attributes: ['teamId'],
            });
        });

        it('should return teams list for user', async () => {
            const mockMemberships = [{ teamId: 'team-1' }, { teamId: 'team-2' }];
            const mockTeams = [
                {
                    id: 'team-1',
                    name: 'Team 1',
                    createdByUserId: 'user-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    memberships: [
                        {
                            teamId: 'team-1',
                            userId: 'user-1',
                            user: { id: 'user-1', fullName: 'User 1', avatar: 'url-1' },
                        },
                    ],
                },
                {
                    id: 'team-2',
                    name: 'Team 2',
                    createdByUserId: 'user-2',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    memberships: [
                        {
                            teamId: 'team-2',
                            userId: 'user-1',
                            user: { id: 'user-1', fullName: 'User 1', avatar: 'url-1' },
                        },
                    ],
                },
            ];

            (TeamMembership.findAll as jest.Mock).mockResolvedValue(mockMemberships);
            (Team.findAll as jest.Mock).mockResolvedValue(mockTeams);

            const result = await teamsService.getTeamsForUser('user-1');

            expect(result.total).toBe(2);
            expect(result.items).toHaveLength(2);
            expect(result.items[0].name).toBe('Team 1');
            expect(result.items[0].members).toHaveLength(1);

            // Check that findAll was called with correct parameters
            const findAllCall = (Team.findAll as jest.Mock).mock.calls[0][0];
            expect(findAllCall.where.id).toBeDefined();
            expect(findAllCall.attributes).toEqual([
                'id',
                'name',
                'createdByUserId',
                'createdAt',
                'updatedAt',
            ]);
        });

        it('should filter teams by search term', async () => {
            const mockMemberships = [{ teamId: 'team-1' }];
            const mockTeams = [
                {
                    id: 'team-1',
                    name: 'Test Team',
                    createdByUserId: 'user-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    memberships: [mockMembership],
                },
            ];

            (TeamMembership.findAll as jest.Mock).mockResolvedValue(mockMemberships);
            (Team.findAll as jest.Mock).mockResolvedValue(mockTeams);

            const result = await teamsService.getTeamsForUser('user-1', 'Test');

            // Check that findAll was called with search parameter
            const findAllCall = (Team.findAll as jest.Mock).mock.calls[0][0];
            expect(findAllCall.where.name).toBeDefined();
            expect(result.items).toHaveLength(1);
        });
    });

    describe('createTeam', () => {
        it('should create team with members including creator', async () => {
            const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn(),
            };

            (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
            (Team.create as jest.Mock).mockResolvedValue({
                id: 'team-1',
                name: 'New Team',
                createdByUserId: 'user-1',
            });
            (TeamMembership.bulkCreate as jest.Mock).mockResolvedValue([]);
            (Team.findByPk as jest.Mock).mockResolvedValue({
                id: 'team-1',
                name: 'New Team',
                createdByUserId: 'user-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                memberships: [
                    {
                        teamId: 'team-1',
                        userId: 'user-1',
                        user: { id: 'user-1', fullName: 'User 1', avatar: 'url' },
                    },
                    {
                        teamId: 'team-1',
                        userId: 'user-2',
                        user: { id: 'user-2', fullName: 'User 2', avatar: 'url' },
                    },
                ],
            });

            const result = await teamsService.createTeam('New Team', 'user-1', ['user-2']);

            expect(Team.create).toHaveBeenCalledWith(
                { name: 'New Team', createdByUserId: 'user-1' },
                { transaction: mockTransaction }
            );
            expect(TeamMembership.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    { teamId: 'team-1', userId: 'user-1' },
                    { teamId: 'team-1', userId: 'user-2' },
                ]),
                { transaction: mockTransaction }
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(result.members).toHaveLength(2);
        });

        it('should ensure creator is included even if not in members array', async () => {
            const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn(),
            };

            (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
            (Team.create as jest.Mock).mockResolvedValue({
                id: 'team-1',
                name: 'New Team',
                createdByUserId: 'user-1',
            });
            (TeamMembership.bulkCreate as jest.Mock).mockResolvedValue([]);
            (Team.findByPk as jest.Mock).mockResolvedValue({
                id: 'team-1',
                name: 'New Team',
                createdByUserId: 'user-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                memberships: [
                    {
                        teamId: 'team-1',
                        userId: 'user-1',
                        user: { id: 'user-1', fullName: 'User 1', avatar: 'url' },
                    },
                ],
            });

            await teamsService.createTeam('New Team', 'user-1', []);

            expect(TeamMembership.bulkCreate).toHaveBeenCalledWith(
                [{ teamId: 'team-1', userId: 'user-1' }],
                { transaction: mockTransaction }
            );
        });

        it('should deduplicate members if creator is in the array', async () => {
            const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn(),
            };

            (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
            (Team.create as jest.Mock).mockResolvedValue({
                id: 'team-1',
                name: 'New Team',
                createdByUserId: 'user-1',
            });
            (TeamMembership.bulkCreate as jest.Mock).mockResolvedValue([]);
            (Team.findByPk as jest.Mock).mockResolvedValue({
                id: 'team-1',
                name: 'New Team',
                createdByUserId: 'user-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                memberships: [
                    {
                        teamId: 'team-1',
                        userId: 'user-1',
                        user: { id: 'user-1', fullName: 'User 1', avatar: 'url' },
                    },
                    {
                        teamId: 'team-1',
                        userId: 'user-2',
                        user: { id: 'user-2', fullName: 'User 2', avatar: 'url' },
                    },
                ],
            });

            await teamsService.createTeam('New Team', 'user-1', ['user-1', 'user-2']);

            const bulkCreateCall = (TeamMembership.bulkCreate as jest.Mock).mock.calls[0][0];
            expect(bulkCreateCall).toHaveLength(2);
            expect(bulkCreateCall.filter((m: any) => m.userId === 'user-1')).toHaveLength(1);
        });

        it('should rollback transaction on error', async () => {
            const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn(),
            };

            (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
            (Team.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await expect(teamsService.createTeam('New Team', 'user-1', [])).rejects.toThrow(
                'DB Error'
            );

            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(mockTransaction.commit).not.toHaveBeenCalled();
        });
    });
});
