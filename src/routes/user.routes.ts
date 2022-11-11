import express from 'express';
import { getMeHandler } from '../controllers/user.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';

const router = express.Router();

router.use(deserializeUser, requireUser);

// Verificar o perfil logado
router.get('/me', getMeHandler);

export default router;
