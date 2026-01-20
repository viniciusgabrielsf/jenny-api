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
}
