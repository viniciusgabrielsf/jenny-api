import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthTokensService } from '../services/auth-token.service';
import { UnauthorizedException } from '../helpers/exceptions/unauthorized.exception';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';

export class AuthController {
    constructor(private authService: AuthService) {}

    logIn = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new BadRequestException('Email and password are required');
        }

        const { accessToken, refreshToken, user } = await this.authService.logIn(email, password);

        AuthTokensService.setAuthCookies(res, accessToken, refreshToken);

        res.status(200).json({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            birthDate: user.birthDate,
        });
    };

    refresh = async (req: Request, res: Response): Promise<void> => {
        const incomingRefreshToken = req.cookies?.refreshToken;

        if (!incomingRefreshToken) throw new UnauthorizedException('No token provided');

        try {
            const { accessToken, refreshToken } =
                await this.authService.refresh(incomingRefreshToken);

            AuthTokensService.setAuthCookies(res, accessToken, refreshToken);

            res.status(200).json({ message: 'refreshed tokens' });
        } catch (error) {
            AuthTokensService.clearAuthCookies(res);
            throw error;
        }
    };

    logOut = async (req: Request, res: Response): Promise<void> => {
        const refreshToken = req.cookies.refreshToken;

        await this.authService.logOut(refreshToken);

        AuthTokensService.clearAuthCookies(res);

        res.status(200).json({ message: 'logged out' });
    };
}
