import { Router } from 'express';
import usersRouter from './users.route';
import authRouter from './auth.route';

const router = Router();

router.use('/users', usersRouter);
router.use('/auth', authRouter);

export default router;
