import { Op } from 'sequelize';
import Team from '../models/team.model';
import TeamMembership from '../models/team-membership.model';
import User from '../models/user.model';

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
}
