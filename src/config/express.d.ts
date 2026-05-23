declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
            fullParams?: ParamsDictionary;
        }
    }
}

export {};
