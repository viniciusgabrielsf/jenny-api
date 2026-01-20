import moment from 'moment';
import { BadRequestException } from '../../../helpers/exceptions/bad-request.exception';
import User from '../../../models/user.model';
import { UsersService } from '../../../services/users.service';
import { NotFoundException } from '../../../helpers/exceptions/not-found.exception';

const mockFindOne = jest.fn();
const mockCreate = jest.fn();
jest.mock('../../../models/user.model', () => {
    return jest.fn().mockImplementation(() => {
        return { findOne: mockFindOne, create: mockCreate };
    });
});

describe('UsersService (Unit Test)', () => {
    let usersService: UsersService;

    beforeEach(() => {
        usersService = new UsersService();

        User.findOne = mockFindOne;
        User.create = mockCreate;
    });

    it('createUser should throw error if email already in use', async () => {
        const userData = {
            email: 'killua@zoldyck.com',
            name: 'Killua Zoldyck',
            birthDate: '2000-01-01',
            password: 'GonsBestFriend123',
        };
        mockFindOne.mockResolvedValueOnce({ id: 1, ...userData });

        const resultPromise = usersService.createUser(
            userData.name,
            userData.email,
            userData.birthDate,
            userData.password
        );

        expect(mockFindOne).toHaveBeenCalledWith({ where: { email: userData.email } });
        await expect(resultPromise).rejects.toThrow(
            new BadRequestException('Email already in use')
        );
    });

    it('createUser should return user if created', async () => {
        const userData = {
            email: 'killua@zoldyck.com',
            name: 'Killua Zoldyck',
            birthDate: '2000-01-01',
            password: 'GonsBestFriend123',
        };

        const userResult = {
            id: 1,
            fullName: userData.name,
            email: userData.email,
            birthDate: moment(userData.birthDate, 'YYYY-MM-DD').toDate(),
            passwordHash: userData.password,
        };

        mockFindOne.mockResolvedValueOnce(null);
        mockCreate.mockResolvedValueOnce(userResult);

        const result = await usersService.createUser(
            userData.name,
            userData.email,
            userData.birthDate,
            userData.password
        );

        expect(mockFindOne).toHaveBeenCalledWith({ where: { email: userData.email } });
        expect(mockCreate).toHaveBeenCalledWith({
            fullName: userData.name,
            email: userData.email,
            birthDate: moment(userData.birthDate, 'YYYY-MM-DD').toDate(),
            passwordHash: userData.password,
        });
        expect(result).toEqual(userResult);
    });

    it('getUser should throw error if user not found', async () => {
        mockFindOne.mockResolvedValueOnce(null);
        const userId = 1;

        const resultPromise = usersService.getUser(userId);

        expect(mockFindOne).toHaveBeenCalledWith({ where: { id: userId } });
        await expect(resultPromise).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('getUser should return user if found', async () => {
        const user = {
            id: 1,
            fullName: 'killua@zoldyck.com',
            email: 'Killua Zoldyck',
            birthDate: moment('2000-01-01', 'YYYY-MM-DD').toDate(),
            passwordHash: 'GonsBestFriend123',
        };

        mockFindOne.mockResolvedValueOnce(user);

        const result = await usersService.getUser(user.id);

        expect(mockFindOne).toHaveBeenCalledWith({ where: { id: user.id } });

        expect(result).toEqual(user);
    });
});
