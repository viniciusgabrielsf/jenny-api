import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { authentication } from '../config/middleware/auth.middleware';

const router = Router();
const usersController = new UsersController(new UsersService());

router.post('/', usersController.createUser);
router.get('/me', authentication, usersController.getCurrentUser);

export default router;
