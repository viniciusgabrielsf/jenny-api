import { Attributes, FindOptions } from 'sequelize/types/model';
import Users, { User } from '../models/users.model';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import moment from 'moment';

export class UsersService {
    constructor() {}

    async getUsers(options?: FindOptions<Attributes<Users>>): Promise<User[]> {
        return Users.findAll(options);
    }

    async createUser(
        fullName: string,
        email: string,
        birthDate: string,
        password: string
    ): Promise<User> {
        const existingUser = await Users.findOne({ where: { email } });

        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        const newUser = await Users.create({
            fullName,
            email,
            birthDate: moment(birthDate, 'YYYY-MM-DD').toDate(),
            passwordHash: password,
        });

        return newUser;
    }
}
