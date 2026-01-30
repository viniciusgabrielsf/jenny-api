import moment from 'moment';
import { BadRequestException } from '../../../helpers/exceptions/bad-request.exception';
import User from '../../../models/user.model';
import { UsersService } from '../../../services/users.service';
import { NotFoundException } from '../../../helpers/exceptions/not-found.exception';

const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
jest.mock('../../../models/user.model', () => {
    return jest.fn().mockImplementation(() => {
        return { findOne: mockFindOne, create: mockCreate, update: mockUpdate };
    });
});

describe('UsersService (Unit Test)', () => {
    let usersService: UsersService;

    beforeEach(() => {
        usersService = new UsersService();

        User.findOne = mockFindOne;
        User.create = mockCreate;
        User.update = mockUpdate;
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

    describe('updateUser', () => {
        it('should throw NotFoundException if user not found', async () => {
            mockFindOne.mockResolvedValueOnce(null);
            const userId = 1;
            const updates = { fullName: 'New Name' };

            const resultPromise = usersService.updateUser(userId, updates);

            expect(mockFindOne).toHaveBeenCalledWith({ where: { id: userId } });
            await expect(resultPromise).rejects.toThrow(new NotFoundException('User not found'));
        });

        it('should throw BadRequestException if email already in use', async () => {
            const existingUser = {
                id: 1,
                fullName: 'Killua Zoldyck',
                email: 'killua@zoldyck.com',
            };
            const updates = { email: 'gon@freecss.com' };

            mockFindOne
                .mockResolvedValueOnce(existingUser)
                .mockResolvedValueOnce({ id: 2, email: 'gon@freecss.com' });

            const resultPromise = usersService.updateUser(existingUser.id, updates);

            await expect(resultPromise).rejects.toThrow(
                new BadRequestException('Email already in use')
            );
        });

        it('should update user successfully when email is not changed', async () => {
            const existingUser = {
                id: 1,
                fullName: 'Killua Zoldyck',
                email: 'killua@zoldyck.com',
            };
            const updates = { fullName: 'Killua Zoldyck Updated', email: 'killua@zoldyck.com' };

            mockFindOne.mockResolvedValueOnce(existingUser);
            mockUpdate.mockResolvedValueOnce([1]);

            await usersService.updateUser(existingUser.id, updates);

            expect(mockUpdate).toHaveBeenCalledWith(updates, { where: { id: existingUser.id } });
        });

        it('should update user successfully when email is changed and not in use', async () => {
            const existingUser = {
                id: 1,
                fullName: 'Killua Zoldyck',
                email: 'killua@zoldyck.com',
            };
            const updates = { fullName: 'Killua Zoldyck', email: 'killua.new@zoldyck.com' };

            mockFindOne.mockResolvedValueOnce(existingUser).mockResolvedValueOnce(null);
            mockUpdate.mockResolvedValueOnce([1]);

            await usersService.updateUser(existingUser.id, updates);

            expect(mockFindOne).toHaveBeenCalledWith({ where: { email: updates.email } });
            expect(mockUpdate).toHaveBeenCalledWith(updates, { where: { id: existingUser.id } });
        });
    });

    describe('updatePassword', () => {
        it('should throw NotFoundException if user not found', async () => {
            mockFindOne.mockResolvedValueOnce(null);
            const userId = 1;

            const resultPromise = usersService.updatePassword(userId, 'oldPass', 'newPass');

            expect(mockFindOne).toHaveBeenCalledWith({ where: { id: userId } });
            await expect(resultPromise).rejects.toThrow(new NotFoundException('User not found'));
        });

        it('should throw BadRequestException if old password is incorrect', async () => {
            const user = {
                id: 1,
                checkPassword: jest.fn().mockResolvedValue(false),
            };
            mockFindOne.mockResolvedValueOnce(user);

            const resultPromise = usersService.updatePassword(user.id, 'wrongOldPass', 'newPass');

            await expect(resultPromise).rejects.toThrow(
                new BadRequestException('Old password is incorrect')
            );
            expect(user.checkPassword).toHaveBeenCalledWith('wrongOldPass');
        });

        it('should update password successfully', async () => {
            const mockSave = jest.fn().mockResolvedValue(undefined);
            const user = {
                id: 1,
                passwordHash: 'oldHashedPassword',
                checkPassword: jest.fn().mockResolvedValue(true),
                save: mockSave,
            };
            mockFindOne.mockResolvedValueOnce(user);

            await usersService.updatePassword(user.id, 'correctOldPass', 'newPass');

            expect(user.checkPassword).toHaveBeenCalledWith('correctOldPass');
            expect(user.passwordHash).toBe('newPass');
            expect(mockSave).toHaveBeenCalled();
        });
    });
});
