import dotenv from 'dotenv';
dotenv.config();

export const env = {
    PORT: process.env.PORT!,
    JWT_SECRET: process.env.JWT_SECRET!,
    DB_CONTAINER_NAME: process.env.DB_CONTAINER_NAME!,
    POSTGRES_HOST: process.env.POSTGRES_HOST!,
    POSTGRES_PORT: process.env.POSTGRES_PORT!,
    POSTGRES_USER: process.env.POSTGRES_USER!,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD!,
    POSTGRES_DB: process.env.POSTGRES_DB!,
    TZ: process.env.TZ!,
};
