import { Router } from 'express';
import { TeamPaymentsController } from '../controllers/team-payments.controller';
import { TeamPaymentsService } from '../services/team-payments.service';
import { authentication } from '../config/middleware/auth.middleware';

const router = Router();

const teamPaymentsController = new TeamPaymentsController(new TeamPaymentsService());

router.get('/', authentication, teamPaymentsController.getTeamPayments);

export default router;
