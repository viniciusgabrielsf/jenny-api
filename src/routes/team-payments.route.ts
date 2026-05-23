import { Router } from 'express';
import { TeamPaymentsController } from '../controllers/team-payments.controller';
import { TeamPaymentsService } from '../services/team-payments.service';
import { authentication } from '../config/middleware/auth.middleware';
import { fowardParams } from '../config/middleware/forward-params.middleware';

const router = Router();

const teamPaymentsController = new TeamPaymentsController(new TeamPaymentsService());

router.get('/', fowardParams, authentication, teamPaymentsController.getTeamPayments);
router.post('/', fowardParams, authentication, teamPaymentsController.createTeamPayment);
router.patch('/:paymentId', fowardParams, authentication, teamPaymentsController.updateTeamPayment);
export default router;
