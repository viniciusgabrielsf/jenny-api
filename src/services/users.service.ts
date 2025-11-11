import { Attributes, FindOptions } from 'sequelize/types/model';
import Users, { User } from '../models/users.model';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';

export class UsersService {
    constructor() {}

    async getUsers(options?: FindOptions<Attributes<Users>>): Promise<User[]> {
        return Users.findAll(options);
    }

    async createUser(name: string, email: string, password: string): Promise<User> {
        const existingUser = await Users.findOne({ where: { email } });

        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        const newUser = await Users.create({ name, email, passwordHash: password });

        return newUser;
    }
}
