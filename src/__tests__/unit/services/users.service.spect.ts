import { BadRequestException } from '../../../helpers/exceptions/bad-request.exception';
import Users from '../../../models/users.model';
import { UsersService } from '../../../services/users.service';

const mockFindOne = jest.fn();
const mockCreate = jest.fn();
jest.mock('../../../models/users.model', () => {
    return jest.fn().mockImplementation(() => {
        return { findOne: mockFindOne, create: mockCreate };
    });
});

describe('UsersService (Unit Test)', () => {
    let usersService: UsersService;

    beforeEach(() => {
        usersService = new UsersService();

        Users.findOne = mockFindOne;
        Users.create = mockCreate;
    });

    it('createUser should throw error if email already in use', async () => {
        const userData = {
            email: 'killua@zoldyck.com',
            name: 'Killua Zoldyck',
            password: 'GonsBestFriend123',
        };
        mockFindOne.mockResolvedValueOnce({ id: 1, ...userData });

        const resultPromise = usersService.createUser(
            userData.name,
            userData.email,
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
            password: 'GonsBestFriend123',
        };

        mockFindOne.mockResolvedValueOnce(null);
        mockCreate.mockResolvedValueOnce({ id: 1, ...userData });

        const result = await usersService.createUser(
            userData.name,
            userData.email,
            userData.password
        );

        expect(mockFindOne).toHaveBeenCalledWith({ where: { email: userData.email } });
        expect(mockCreate).toHaveBeenCalledWith({
            name: userData.name,
            email: userData.email,
            passwordHash: userData.password,
        });
        expect(result).toEqual({ id: 1, ...userData });
    });
});
