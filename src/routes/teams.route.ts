import { Router } from 'express';
import { TeamsController } from '../controllers/teams.controller';
import { TeamsService } from '../services/teams.service';
import { authentication } from '../config/middleware/auth.middleware';

const router = Router();
const teamsController = new TeamsController(new TeamsService());

router.get('/', authentication, teamsController.getTeams);

export default router;
