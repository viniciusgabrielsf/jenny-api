import { AuthService } from '../../../services/auth.service';
import { AuthTokensService } from '../../../services/auth-token.service';
import AuthRefreshToken from '../../../models/auth-refresh-token.model';
import User from '../../../models/user.model';
import { env } from '../../../config/env';
import jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../../../helpers/exceptions/unauthorized.exception';
import { timeStringToMilliseconds } from '../../../helpers/time-to-miliseconds.helper';

jest.mock('../../../models/user.model');
jest.mock('../../../models/auth-refresh-token.model');
jest.mock('../../../services/auth-token.service');
jest.mock('jsonwebtoken');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../../helpers/time-to-miliseconds.helper');

describe('AuthService (Unit Test)', () => {
    let authService: AuthService;
    const user = { id: 'user-1', checkPassword: jest.fn() } as any;
    const refreshToken = 'refresh-token';
    const accessToken = 'access-token';
    const familyId = 'family-1';

    beforeEach(() => {
        jest.clearAllMocks();
        authService = new AuthService();
        (AuthTokensService.generateAccessToken as jest.Mock).mockReturnValue(accessToken);
        (AuthTokensService.generateRefreshToken as jest.Mock).mockReturnValue(refreshToken);
        (AuthTokensService.cleanUpOldTokens as jest.Mock).mockResolvedValue(undefined);
        (timeStringToMilliseconds as jest.Mock).mockReturnValue(1000);
    });

    describe('logIn', () => {
        it('should throw UnauthorizedException if user not found', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);

            await expect(authService.logIn('email', 'pass')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(user);
            user.checkPassword.mockResolvedValue(false);

            await expect(authService.logIn('email', 'pass')).rejects.toThrow(UnauthorizedException);
        });

        it('should return tokens and user on success', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(user);
            user.checkPassword.mockResolvedValue(true);
            (AuthRefreshToken.create as jest.Mock).mockResolvedValue({});

            const result = await authService.logIn('email', 'pass');

            expect(result).toEqual({ accessToken, refreshToken, user });
            expect(AuthTokensService.cleanUpOldTokens).toHaveBeenCalledWith(
                user.id,
                env.MAX_TOKENS - 1
            );
            expect(AuthRefreshToken.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: refreshToken,
                    userId: user.id,
                    familyId: expect.any(String),
                    isRevoked: false,
                    expiresAt: expect.any(Date),
                })
            );
        });
    });

    describe('refresh', () => {
        it('should throw UnauthorizedException if token invalid', async () => {
            (jwt.verify as jest.Mock).mockImplementationOnce(() => {
                throw new Error('invalid token');
            });

            await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if stored token not found', async () => {
            (jwt.verify as jest.Mock).mockReturnValue({});
            (AuthRefreshToken.findOne as jest.Mock).mockResolvedValue(null);

            await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if token is revoked', async () => {
            (jwt.verify as jest.Mock).mockReturnValue({});
            const storedToken = { isRevoked: true, familyId, save: jest.fn() };
            (AuthRefreshToken.findOne as jest.Mock).mockResolvedValue(storedToken);
            (AuthRefreshToken.update as jest.Mock).mockResolvedValue(undefined);

            await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
            expect(AuthRefreshToken.update).toHaveBeenCalledWith(
                { isRevoked: true },
                { where: { familyId } }
            );
        });

        it('should throw UnauthorizedException if user not found', async () => {
            (jwt.verify as jest.Mock).mockReturnValue({});
            const storedToken = { isRevoked: false, userId: user.id, familyId, save: jest.fn() };
            (AuthRefreshToken.findOne as jest.Mock).mockResolvedValue(storedToken);
            (User.findOne as jest.Mock).mockResolvedValue(null);

            await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
        });

        it('should return new tokens on success', async () => {
            (jwt.verify as jest.Mock).mockReturnValue({});
            const storedToken = { isRevoked: false, userId: user.id, familyId, save: jest.fn() };
            (AuthRefreshToken.findOne as jest.Mock).mockResolvedValue(storedToken);
            (User.findOne as jest.Mock).mockResolvedValue(user);
            (AuthRefreshToken.create as jest.Mock).mockResolvedValue({});

            const result = await authService.refresh(refreshToken);

            expect(result).toEqual({ accessToken, refreshToken });
            expect(storedToken.save).toHaveBeenCalled();
            expect(AuthTokensService.cleanUpOldTokens).toHaveBeenCalledWith(
                user.id,
                env.MAX_TOKENS - 1
            );
            expect(AuthRefreshToken.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: refreshToken,
                    userId: user.id,
                    familyId,
                    isRevoked: false,
                    expiresAt: expect.any(Date),
                })
            );
        });
    });

    describe('logOut', () => {
        it('should revoke token if found', async () => {
            const storedToken = { familyId };
            (AuthRefreshToken.findOne as jest.Mock).mockResolvedValue(storedToken);
            (AuthRefreshToken.update as jest.Mock).mockResolvedValue(undefined);

            await authService.logOut(refreshToken);

            expect(AuthRefreshToken.update).toHaveBeenCalledWith(
                { isRevoked: true },
                { where: { familyId } }
            );
        });

        it('should do nothing if token not found', async () => {
            (AuthRefreshToken.findOne as jest.Mock).mockResolvedValue(null);

            await authService.logOut(refreshToken);

            expect(AuthRefreshToken.update).not.toHaveBeenCalled();
        });
    });
});
