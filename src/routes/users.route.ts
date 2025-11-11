import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';

const router = Router();
const usersController = new UsersController(new UsersService());

router.get('/', usersController.getUsers);

export default router;
