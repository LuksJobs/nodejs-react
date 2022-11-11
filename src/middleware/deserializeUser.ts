import { NextFunction, Request, Response } from 'express';
import { findUserById } from '../services/user.service';
import AppError from '../utils/appError';
import redisClient from '../utils/connectRedis';
import { verifyJwt } from '../utils/jwt';

export const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let access_token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      access_token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.access_token) {
      access_token = req.cookies.access_token;
    }

    if (!access_token) {
      return next(new AppError(401, 'Você precisa estar autenticado para visualizar está página!'));
    }

    // Validar o acesso com o Token
    const decoded = verifyJwt<{ sub: string }>(
      access_token,
      'accessTokenPublicKey'
    );

    if (!decoded) {
      return next(new AppError(401, `Token inválido ou o Usuário não existe!`));
    }

    // Verificar se o usuário tem uma sessão válida
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(new AppError(401, `Token inválido ou sua sessão expirou`));
    }

    // Verificar se o usuário ainda está com a sessão ativa
    const user = await findUserById(JSON.parse(session).id);

    if (!user) {
      return next(new AppError(401, `Token inválido ou sua sessão expirou`));
    }

    // adicionando o usuário ao locals users;
    res.locals.user = user;

    next();
  } catch (err: any) {
    next(err);
  }
};
