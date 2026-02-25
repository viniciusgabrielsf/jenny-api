import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';
import { PaymentsService } from '../services/payments.service';
import { authentication } from '../config/middleware/auth.middleware';

const router = Router();

const paymentsController = new PaymentsController(new PaymentsService());

router.get('/me', authentication, paymentsController.getMyPayments);

export default router;
