import { Op } from 'sequelize';
import { sequelize } from '../config/db';
import Team from '../models/team.model';
import TeamMembership from '../models/team-membership.model';
import User from '../models/user.model';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';

export type TeamMemberResponse = {
    id: string;
    fullName: string;
    avatar?: string;
};

export type TeamResponse = {
    id: string;
    name: string;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
    members: TeamMemberResponse[];
};

export type TeamsListResponse = {
    items: TeamResponse[];
    total: number;
};

export class TeamsService {
    async getTeamsForUser(userId: string, search?: string): Promise<TeamsListResponse> {
        const memberships = await TeamMembership.findAll({
            where: { userId },
            attributes: ['teamId'],
        });

        const teamIds = memberships.map(membership => membership.teamId);
        if (teamIds.length === 0) {
            return { items: [], total: 0 };
        }

        const where: { id: { [Op.in]: string[] }; name?: { [Op.iLike]: string } } = {
            id: { [Op.in]: teamIds },
        };

        if (search) {
            where.name = { [Op.iLike]: `%${search}%` };
        }

        const teams = await Team.findAll({
            where,
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

        const items = teams.map(team => ({
            id: team.id,
            name: team.name,
            createdByUserId: team.createdByUserId,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            members: (team.memberships || [])
                .map(membership => membership.user)
                .filter((member): member is User => Boolean(member))
                .map(member => ({
                    id: member.id,
                    fullName: member.fullName,
                    avatar: member.avatar,
                })),
        }));

        return { items, total: items.length };
    }

    async createTeam(
        name: string,
        createdByUserId: string,
        memberIds: string[]
    ): Promise<TeamResponse> {
        const transaction = await sequelize.transaction();

        try {
            const team = await Team.create(
                {
                    name,
                    createdByUserId,
                },
                { transaction }
            );

            const uniqueMemberIds = Array.from(new Set([createdByUserId, ...memberIds]));

            await TeamMembership.bulkCreate(
                uniqueMemberIds.map(userId => ({
                    teamId: team.id,
                    userId,
                })),
                { transaction }
            );

            const createdTeam = await Team.findByPk(team.id, {
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
                transaction,
            });

            await transaction.commit();

            return {
                id: createdTeam!.id,
                name: createdTeam!.name,
                createdByUserId: createdTeam!.createdByUserId,
                createdAt: createdTeam!.createdAt,
                updatedAt: createdTeam!.updatedAt,
                members: (createdTeam!.memberships || [])
                    .map(membership => membership.user)
                    .filter((member): member is User => Boolean(member))
                    .map(member => ({
                        id: member.id,
                        fullName: member.fullName,
                        avatar: member.avatar,
                    })),
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateTeam(
        teamId: string,
        createdByUserId: string,
        name: string,
        memberIds: string[]
    ): Promise<TeamResponse> {
        if (!memberIds.includes(createdByUserId)) {
            throw new BadRequestException('o criador deve ser um membro do grupo');
        }

        const transaction = await sequelize.transaction();

        try {
            const team = await Team.findByPk(teamId);

            if (!team) {
                throw new NotFoundException('Time não encontrado');
            }

            await team.update({ name }, { transaction });

            await TeamMembership.destroy({
                where: { teamId },
                transaction,
            });
            const uniqueMemberIds = Array.from(new Set(memberIds));

            await TeamMembership.bulkCreate(
                uniqueMemberIds.map(userId => ({
                    teamId,
                    userId,
                })),
                { transaction }
            );

            const updatedTeam = await Team.findByPk(teamId, {
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
                transaction,
            });

            await transaction.commit();

            return {
                id: updatedTeam!.id,
                name: updatedTeam!.name,
                createdByUserId: updatedTeam!.createdByUserId,
                createdAt: updatedTeam!.createdAt,
                updatedAt: updatedTeam!.updatedAt,
                members: (updatedTeam!.memberships || [])
                    .map(membership => membership.user)
                    .filter((member): member is User => Boolean(member))
                    .map(member => ({
                        id: member.id,
                        fullName: member.fullName,
                        avatar: member.avatar,
                    })),
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        // TODO: Validate team transactions upon delete in the future
        
        // Check if user is a member of the team
        const isMember = await TeamMembership.findOne({
            where: { teamId, userId },
        });

        if (!isMember) {
            throw new BadRequestException('Você não é membro deste time');
        }

        const transaction = await sequelize.transaction();

        try {
            // Delete all team memberships
            await TeamMembership.destroy({
                where: { teamId },
                transaction,
            });

            // Delete the team
            await Team.destroy({
                where: { id: teamId },
                transaction,
            });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
