import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import AuthRefreshToken from '../models/auth-refresh-token.model';
import { timeStringToMilliseconds } from '../helpers/time-to-miliseconds.helper';

export class AuthTokensService {
    constructor() {}

    static generateAccessToken = (userId: string) => {
        const secret = env.ACCESS_TOKEN_SECRET as import('jsonwebtoken').Secret;
        const expiresIn =
            env.ACCESS_TOKEN_EXPIRATION as import('jsonwebtoken').SignOptions['expiresIn'];

        return jwt.sign(
            {
                sub: userId,
                type: 'access',
            },
            secret,
            { expiresIn }
        );
    };

    static generateRefreshToken = (userId: string) => {
        const secret = env.REFRESH_TOKEN_SECRET as import('jsonwebtoken').Secret;
        const expiresIn =
            env.REFRESH_TOKEN_EXPIRATION as import('jsonwebtoken').SignOptions['expiresIn'];

        return jwt.sign(
            {
                sub: userId,
                type: 'refresh',
                jti: uuidv4(), // Unique identifier for the token instance
            },
            secret,
            { expiresIn }
        );
    };

    static setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
        const isProd = env.NODE_ENV === 'production';

        res.cookie('accessToken', accessToken, {
            httpOnly: true, // Critical: inaccessible to JS
            secure: isProd, // Critical: HTTPS only in prod
            sameSite: 'strict', // Protection against CSRF
            maxAge: timeStringToMilliseconds(env.ACCESS_TOKEN_EXPIRATION),
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            path: '/api/auth/refresh', // Path scoping for additional security
            maxAge: timeStringToMilliseconds(env.REFRESH_TOKEN_EXPIRATION),
        });
    };

    static clearAuthCookies = (res: Response) => {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    };

    static cleanUpOldTokens = async (userId: string, maxTokens: number) => {
        const tokens = await AuthRefreshToken.findAll({
            where: { userId },
            order: [['expiresAt', 'DESC']],
        });

        let activeTokens = 0;
        let now = new Date();

        for (const token of tokens) {
            if (activeTokens >= maxTokens || token.isRevoked || token.expiresAt <= now) {
                await token.destroy();
            } else {
                activeTokens++;
            }
        }
    };
}
