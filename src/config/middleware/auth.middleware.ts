import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { UnauthorizedException } from '../../helpers/exceptions/unauthorized.exception';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function authentication(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.accessToken;

    if (!token) {
        throw new UnauthorizedException('Authentication token missing');
    }

    try {
        // Verify JWT signature and expiration
        const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as any;

        req.user = {
            id: payload.sub,
        };

        next();
    } catch (error) {
        throw new UnauthorizedException('Invalid or expired token');
    }
}

// Role Guard Factory
// Usage: router.delete('/users/:id', authenticate, requireRole('admin'), deleteUser);
// export const requireRole = (role: string) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         if (!req.user) {
//             throw new ForbiddenException('Insufficient permissions');
//         }
//         next();
//     };
// };
