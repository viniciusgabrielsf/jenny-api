import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { authentication } from '../config/middleware/auth.middleware';

const router = Router();
const authController = new AuthController(new AuthService());

router.post('/login', authController.logIn);
router.post('/refresh', authController.refresh);
router.post('/logout', authentication, authController.logOut);

export default router;
