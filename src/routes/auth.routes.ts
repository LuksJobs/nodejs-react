import express from 'express';
import {
  loginUserHandler,
  logoutHandler,
  refreshAccessTokenHandler,
  registerUserHandler,
  verifyEmailHandler,
} from '../controllers/auth.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  loginUserSchema,
  verifyEmailSchema,
} from '../schemas/user.schema';

const router = express.Router();

// Registro de Usuários
router.post('/register', validate(createUserSchema), registerUserHandler);

// Login de Usuários
router.post('/login', validate(loginUserSchema), loginUserHandler);

// Logout de usuários
router.get('/logout', deserializeUser, requireUser, logoutHandler);

// Recarregar o token
router.get('/refresh', refreshAccessTokenHandler);

// Verificar o endereço de e-mail
router.get(
  '/verifyemail/:verificationCode',
  validate(verifyEmailSchema),
  verifyEmailHandler
);

export default router;
