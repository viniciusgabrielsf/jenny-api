import dotenv from 'dotenv';
dotenv.config();

export const env = {
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV!,
    ORIGIN: process.env.ORIGIN!,
    DB_CONTAINER_NAME: process.env.DB_CONTAINER_NAME!,
    POSTGRES_HOST: process.env.POSTGRES_HOST!,
    POSTGRES_PORT: process.env.POSTGRES_PORT!,
    POSTGRES_USER: process.env.POSTGRES_USER!,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD!,
    POSTGRES_DB: process.env.POSTGRES_DB!,
    TZ: process.env.TZ!,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION!,
    REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION!,
    MAX_TOKENS: Number(process.env.MAX_TOKENS!),
};
