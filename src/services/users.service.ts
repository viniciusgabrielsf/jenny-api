import { Attributes, FindOptions } from 'sequelize/types/model';
import User, { IUser } from '../models/user.model';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import moment from 'moment';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';

export class UsersService {
    constructor() {}

    async getUsers(options?: FindOptions<Attributes<User>>): Promise<IUser[]> {
        return User.findAll(options);
    }

    async createUser(
        fullName: string,
        email: string,
        birthDate: string,
        password: string
    ): Promise<IUser> {
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        const newUser = await User.create({
            fullName,
            email,
            birthDate: moment(birthDate, 'YYYY-MM-DD').toDate(),
            passwordHash: password,
        });

        return newUser;
    }

    async getUser(id: number, options?: FindOptions<Attributes<User>>): Promise<IUser | null> {
        const existingUser = await User.findOne({ ...options, where: { id } });

        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        return existingUser;
    }

    async updateUser(
        id: number,
        updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'>>
    ): Promise<void> {
        const user = await User.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.email !== updates.email) {
            const emailExists = await User.findOne({ where: { email: updates.email } });

            if (emailExists) throw new BadRequestException('Email already in use');
        }

        await User.update(updates, { where: { id } });
    }

    updatePassword = async (
        userId: number,
        oldPassword: string,
        newPassword: string
    ): Promise<void> => {
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!(await user.checkPassword(oldPassword))) {
            throw new BadRequestException('Old password is incorrect');
        }

        user.passwordHash = newPassword;
        await user.save();
    };
}
