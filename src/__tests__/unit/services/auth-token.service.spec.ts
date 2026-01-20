import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../../../config/env';
import AuthRefreshToken from '../../../models/auth-refresh-token.model';
import { AuthTokensService } from '../../../services/auth-token.service';
import { timeStringToMilliseconds } from '../../../helpers/time-to-miliseconds.helper';

jest.mock('jsonwebtoken');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../../models/auth-refresh-token.model');
jest.mock('../../../helpers/time-to-miliseconds.helper');

describe('AuthTokensService (Unit Test)', () => {
    const userId = 'user-123';
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';
    const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
    } as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
        (jwt.sign as jest.Mock).mockImplementation(() => 'signed-token');
        (timeStringToMilliseconds as jest.Mock).mockImplementation(() => 1000);
    });

    describe('generateAccessToken', () => {
        it('should sign access token with correct payload', () => {
            const token = AuthTokensService.generateAccessToken(userId);
            expect(jwt.sign).toHaveBeenCalledWith(
                { sub: userId, type: 'access' },
                env.ACCESS_TOKEN_SECRET,
                { expiresIn: env.ACCESS_TOKEN_EXPIRATION }
            );
            expect(token).toBe('signed-token');
        });
    });

    describe('generateRefreshToken', () => {
        it('should sign refresh token with correct payload', () => {
            const token = AuthTokensService.generateRefreshToken(userId);
            expect(jwt.sign).toHaveBeenCalledWith(
                { sub: userId, type: 'refresh', jti: 'mock-uuid' },
                env.REFRESH_TOKEN_SECRET,
                { expiresIn: env.REFRESH_TOKEN_EXPIRATION }
            );
            expect(token).toBe('signed-token');
        });
    });

    describe('setAuthCookies', () => {
        it('should set access and refresh cookies', () => {
            AuthTokensService.setAuthCookies(mockRes, accessToken, refreshToken);
            expect(mockRes.cookie).toHaveBeenCalledWith(
                'accessToken',
                accessToken,
                expect.objectContaining({
                    httpOnly: true,
                    secure: env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 1000,
                })
            );
            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                refreshToken,
                expect.objectContaining({
                    httpOnly: true,
                    secure: env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/api/auth/refresh',
                    maxAge: 1000,
                })
            );
        });
    });

    describe('clearAuthCookies', () => {
        it('should clear access and refresh cookies', () => {
            AuthTokensService.clearAuthCookies(mockRes);
            expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken');
            expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', {
                path: '/api/auth/refresh',
            });
        });
    });

    describe('cleanUpOldTokens', () => {
        it('should destroy tokens expired', async () => {
            const now = new Date();
            const tokens = [
                {
                    isRevoked: false,
                    expiresAt: new Date(now.getTime() + 10000),
                    destroy: jest.fn(),
                },
                {
                    isRevoked: false,
                    expiresAt: new Date(now.getTime() - 10000),
                    destroy: jest.fn(),
                },
            ];
            (AuthRefreshToken.findAll as jest.Mock).mockResolvedValue(tokens);
            await AuthTokensService.cleanUpOldTokens(userId, 2);
            expect(tokens[1].destroy).toHaveBeenCalled();
        });

        it('should destroy tokens revoked', async () => {
            const now = new Date();
            const tokens = [
                {
                    isRevoked: false,
                    expiresAt: new Date(now.getTime() + 10000),
                    destroy: jest.fn(),
                },
                {
                    isRevoked: true,
                    expiresAt: new Date(now.getTime() + 10000),
                    destroy: jest.fn(),
                },
            ];
            (AuthRefreshToken.findAll as jest.Mock).mockResolvedValue(tokens);
            await AuthTokensService.cleanUpOldTokens(userId, 2);
            expect(tokens[1].destroy).toHaveBeenCalled();
        });

        it('should destroy tokens exceeding maxTokens', async () => {
            const now = new Date();
            const tokens = [
                {
                    isRevoked: false,
                    expiresAt: new Date(now.getTime() + 10000),
                    destroy: jest.fn(),
                },
                {
                    isRevoked: false,
                    expiresAt: new Date(now.getTime() + 10000),
                    destroy: jest.fn(),
                },
                {
                    isRevoked: false,
                    expiresAt: new Date(now.getTime() + 10000),
                    destroy: jest.fn(),
                },
            ];
            (AuthRefreshToken.findAll as jest.Mock).mockResolvedValue(tokens);
            await AuthTokensService.cleanUpOldTokens(userId, 1);
            expect(tokens[2].destroy).toHaveBeenCalled();
        });
    });
});
