import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { setupSwagger } from './config/swagger';
import { routeNotFound } from './config/middleware/route-not-found.middleware';
import { errorHandler } from './config/middleware/error-handler.middleware';
import morgan from 'morgan';
import { setupSequelize } from './config/db';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

dotenv.config();

const app = express();

app.use(helmet());

// if needed change to body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));

app.use(express.static('public'));

setupSwagger(app);

setupSequelize();

app.use(
    cors({
        origin: process.env.ORIGIN,
        credentials: true,
    })
);

app.use('/api', routes);

app.use(routeNotFound);

app.use(errorHandler);

export default app;
