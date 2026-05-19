import { Router } from 'express';
import { TeamsController } from '../controllers/teams.controller';
import { TeamsService } from '../services/teams.service';
import { authentication } from '../config/middleware/auth.middleware';

const router = Router();
const teamsController = new TeamsController(new TeamsService());

router.get('/me', authentication, teamsController.getTeams);
router.post('/', authentication, teamsController.createTeam);
router.patch('/:id', authentication, teamsController.updateTeam);
router.delete('/:id', authentication, teamsController.deleteTeam);

export default router;
