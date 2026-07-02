import { Attributes, FindOptions, Op } from 'sequelize';
import User, { IUser } from '../models/user.model';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import moment from 'moment';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { IGetOptions } from '../config/interfaces';
import { buildBaseFindOptions } from '../helpers/get-options.helper';
import { GetUsersFilterSchemaType } from '../helpers/schemas/users/get-users.schema';
import TeamMembership from '../models/team-membership.model';

export type UsersListResponse = {
    items: IUser[];
    total: number;
};

export class UsersService {
    constructor() {}

    async getUsers(options?: IGetOptions<GetUsersFilterSchemaType>): Promise<UsersListResponse> {
        const findOptions = await this.buildGetUsersFindOptions(options);

        const { count, rows } = await User.findAndCountAll({
            ...findOptions,
            attributes: { exclude: ['passwordHash', 'createdAt', 'updatedAt'] },
            order: findOptions.order || [['createdAt', 'DESC']],
        });

        return { items: rows, total: count };
    }

    async buildGetUsersFindOptions(
        options?: IGetOptions<GetUsersFilterSchemaType>
    ): Promise<FindOptions> {
        const findOptions = buildBaseFindOptions(options);
        findOptions.where = {};
        const filters = options?.filter;

        if (filters?.search) {
            // @ts-expect-error
            findOptions.where[Op.or] = [
                { email: { [Op.iLike]: `%${filters.search}%` } },
                { fullName: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        if (filters?.teamId) {
            let members = await TeamMembership.findAll({
                where: { teamId: filters.teamId },
                attributes: ['userId'],
            });
            const userIds = members.map((m: TeamMembership) => m.userId);
            findOptions.where.id = { [Op.in]: userIds };
        }

        return findOptions;
    }

    async createUser(
        fullName: string,
        email: string,
        birthDate: string,
        password: string
    ): Promise<IUser> {
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            throw new BadRequestException('Email já está em uso');
        }

        const newUser = await User.create({
            fullName,
            email,
            birthDate: moment(birthDate, 'YYYY-MM-DD').toDate(),
            passwordHash: password,
        });

        return newUser;
    }

    async getUser(id: string, options?: FindOptions<Attributes<User>>): Promise<IUser | null> {
        const existingUser = await User.findOne({ ...options, where: { id } });

        if (!existingUser) {
            throw new NotFoundException('Usuário não encontrado');
        }

        return existingUser;
    }

    async updateUser(
        id: string,
        updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'>>
    ): Promise<void> {
        const user = await User.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (user.email !== updates.email) {
            const emailExists = await User.findOne({ where: { email: updates.email } });

            if (emailExists) throw new BadRequestException('Email já está em uso');
        }

        await User.update(updates, { where: { id } });
    }

    updatePassword = async (
        userId: string,
        oldPassword: string,
        newPassword: string
    ): Promise<void> => {
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (!(await user.checkPassword(oldPassword))) {
            throw new BadRequestException('Senha antiga está incorreta');
        }

        user.passwordHash = newPassword;
        await user.save();
    };
}
