import { NextFunction, Request, Response } from 'express';
import { UnauthorizedException } from '../../helpers/exceptions/unauthorized.exception';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fowardParams(req: Request, res: Response, next: NextFunction) {
    req.fullParams = {
        ...(req.fullParams || {}),
        ...req.params,
    };

    next();
}
