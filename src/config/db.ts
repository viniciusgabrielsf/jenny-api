import { Sequelize } from 'sequelize-typescript';
import { env } from './env';

export const sequelize = new Sequelize(env.POSTGRES_DB, env.POSTGRES_USER, env.POSTGRES_PASSWORD, {
    host: env.POSTGRES_HOST,
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    models: [__dirname + '/../models/**/*.model.ts'],
    modelMatch: (filename, member) => {
        const normalizedFile = filename
            .substring(0, filename.indexOf('.model'))
            .replace(/-/g, '');
        return normalizedFile === member.toLowerCase();
    },
    timezone: '-03:00',
});

export const setupSequelize = async () => {
    sequelize
        .authenticate()
        .then(() => console.log('💾 Sequelize: Connection has been established successfully.'))
        .catch(err => {
            console.error('🚨 Sequelize: Unable to connect to the database:', err);
            throw err;
        });

    // REMOVING SYNC TO AVOID DATA LOSS, USE TRANSACTIONS IF NEEDED TO ALTER SCHEMA
    // sequelize.sync().then(() => {
    //     console.log('💾 Sequelize: All models were synchronized successfully.');
    // });
};

const db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
};

export default db;
