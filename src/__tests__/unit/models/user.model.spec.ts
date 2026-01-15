import { mockSequelizeTypescript } from '../../ mocks/sequelize-typescript.mock';
mockSequelizeTypescript();

import User from '../../../models/user.model';
import { BadRequestException } from '../../../helpers/exceptions/bad-request.exception';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('mockSalt'),
    hash: jest.fn().mockResolvedValue('mockHashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
}));

describe('User model hooks and methods', () => {
    const originalNow = Date.now;

    beforeEach(() => {
        jest.clearAllMocks();
        // fix "today" for birth date tests
        const fixed = new Date('2025-01-01T00:00:00.000Z').getTime();
        Date.now = () => fixed;
    });

    afterAll(() => {
        Date.now = originalNow;
    });

    it('validateEmail throws on missing', () => {
        const instMissing: any = { email: '' };

        expect(() => User.validateEmail(instMissing)).toThrow(BadRequestException);
    });

    it('validateEmail throws on invalid', () => {
        const instBad: any = { email: 'not-an-email' };

        expect(() => User.validateEmail(instBad)).toThrow(BadRequestException);
    });

    it('validateEmail trims and lowercases', () => {
        const inst: any = {
            email: '  KillUa@ZoldyCK.COM  ',
        };

        User.validateEmail(inst);

        expect(inst.email).toBe('killua@zoldyck.com');
    });

    it('validateFullName throws when empty', () => {
        const instEmpty: any = { fullName: '   ' };

        expect(() => User.validateFullName(instEmpty)).toThrow(BadRequestException);
    });

    it('validateFullName trims', () => {
        const inst: any = { fullName: '  Gon Freecss  ' };

        User.validateFullName(inst);

        expect(inst.fullName).toBe('Gon Freecss');
    });

    it('validateBirthDate throws when missing', () => {
        const instMissing: any = { birthDate: null };

        expect(() => User.validateBirthDate(instMissing)).toThrow(BadRequestException);
    });

    it('validateBirthDate throws when in the future', () => {
        // Date.now fixed to 2025-01-01)
        const instFuture: any = { birthDate: new Date('2030-01-01') };
        expect(() => User.validateBirthDate(instFuture)).toThrow(BadRequestException);
    });

    it('validateBirthDate throws when in the future', () => {
        const inst: any = { birthDate: new Date('2000-01-01') };

        expect(() => User.validateBirthDate(inst)).not.toThrow();
    });

    it('hashPassword hashes the passwordHash with bcrypt', async () => {
        const inst: any = { passwordHash: 'plainPassword' };

        await User.hashPassword(inst);

        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 'mockSalt');
        expect(inst.passwordHash).toBe('mockHashedPassword');
    });

    it('hashPasswordOnUpdate dont call hash when passwordHash not changed', async () => {
        const instNotChanged: any = {
            passwordHash: 'plainPassword',
            changed: jest.fn().mockReturnValue(false),
        };

        const spy2 = jest.spyOn(User, 'hashPassword').mockResolvedValue(undefined);

        await User.hashPasswordOnUpdate(instNotChanged);

        expect(instNotChanged.changed).toHaveBeenCalledWith('passwordHash');
        expect(spy2).not.toHaveBeenCalled();
    });

    it('hashPasswordOnUpdate calls hash when passwordHash changed', async () => {
        const instChanged: any = {
            passwordHash: 'plainPassword',
            changed: jest.fn().mockReturnValue(true),
        };

        const spy = jest.spyOn(User, 'hashPassword').mockResolvedValue(undefined);

        await User.hashPasswordOnUpdate(instChanged);

        expect(instChanged.changed).toHaveBeenCalledWith('passwordHash');
        expect(spy).toHaveBeenCalledWith(instChanged);
    });

    it('checkPassword uses bcrypt.compare and returns true if ok', async () => {
        const inst: any = { passwordHash: 'mockHashedPassword' };

        const ok = await User.prototype.checkPassword.call(inst, 'plain');
        expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'mockHashedPassword');
        expect(ok).toBe(true);
    });

    it('checkPassword uses bcrypt.compare and returns false if not ok', async () => {
        const inst: any = { passwordHash: 'mockHashedPassword' };

        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
        const notOk = await User.prototype.checkPassword.call(inst, 'wrong');
        expect(notOk).toBe(false);
    });
});
