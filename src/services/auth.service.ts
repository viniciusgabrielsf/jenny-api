import { UnauthorizedException } from '../helpers/exceptions/unauthorized.exception';
import User from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';
import { AuthTokensService } from './auth-token.service';
import AuthRefreshToken from '../models/auth-refresh-token.model';
import { env } from '../config/env';
import jwt from 'jsonwebtoken';
import { HttpException } from '../helpers/exceptions/http.exception';
import { timeStringToMilliseconds } from '../helpers/time-to-miliseconds.helper';

export interface ILoginResult {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface IRefreshResult {
    accessToken: string;
    refreshToken: string;
}

export class AuthService {
    constructor() {}

    logIn = async (email: string, password: string): Promise<ILoginResult> => {
        const user = await User.findOne({ where: { email } });

        if (!user || !(await user.checkPassword(password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const familyId = uuidv4();

        const accessToken = AuthTokensService.generateAccessToken(user.id);
        const refreshToken = AuthTokensService.generateRefreshToken(user.id);

        await AuthTokensService.cleanUpOldTokens(user.id, env.MAX_TOKENS - 1);

        await AuthRefreshToken.create({
            token: refreshToken,
            userId: user.id,
            familyId: familyId,
            isRevoked: false,
            expiresAt: new Date(
                Date.now() + timeStringToMilliseconds(env.REFRESH_TOKEN_EXPIRATION)
            ),
        });

        return { accessToken, refreshToken, user };
    };

    refresh = async (incomingRefreshToken: string): Promise<IRefreshResult> => {
        try {
            const decoded = jwt.verify(incomingRefreshToken, env.REFRESH_TOKEN_SECRET) as any;

            const storedToken = await AuthRefreshToken.findOne({
                where: { token: incomingRefreshToken },
            });

            if (!storedToken) {
                throw new UnauthorizedException('Invalid token');
            }

            if (storedToken.isRevoked) {
                // token reuse detected
                await AuthRefreshToken.update(
                    { isRevoked: true },
                    { where: { familyId: storedToken.familyId } }
                );

                throw new UnauthorizedException('Invalid token');
            }

            const user = await User.findOne({
                where: { id: storedToken.userId },
            });
            if (!user) throw new UnauthorizedException('User not found');

            const newAccessToken = AuthTokensService.generateAccessToken(user.id);
            const newRefreshToken = AuthTokensService.generateRefreshToken(user.id);

            storedToken.isRevoked = true;
            await storedToken.save();
            const familyId = storedToken.familyId;

            await AuthTokensService.cleanUpOldTokens(user.id, env.MAX_TOKENS - 1);

            await AuthRefreshToken.create({
                token: newRefreshToken,
                userId: user.id,
                familyId: familyId,
                isRevoked: false,
                expiresAt: new Date(
                    Date.now() + timeStringToMilliseconds(env.REFRESH_TOKEN_EXPIRATION)
                ),
            });

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (err) {
            if (err instanceof HttpException) throw err;

            throw new UnauthorizedException('Invalid token');
        }
    };

    logOut = async (refreshToken: string): Promise<void> => {
        if (refreshToken) {
            const storedToken = await AuthRefreshToken.findOne({ where: { token: refreshToken } });

            if (storedToken) {
                await AuthRefreshToken.update(
                    { isRevoked: true },
                    { where: { familyId: storedToken.familyId } }
                );
            }
        }
    };
}
