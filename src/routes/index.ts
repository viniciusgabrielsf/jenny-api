import { Router } from 'express';
import usersRouter from './users.route';
import authRouter from './auth.route';
import paymentsRouter from './payments.route';
import teamsRouter from './teams.route';
import teamPaymentsRouter from './team-payments.route';
import { fowardParams } from '../config/middleware/forward-params.middleware';

const router = Router();

router.use('/users', usersRouter);
router.use('/auth', authRouter);
router.use('/payments', paymentsRouter);
router.use('/teams/:teamId/payments', fowardParams, teamPaymentsRouter);
router.use('/teams', teamsRouter);

export default router;
