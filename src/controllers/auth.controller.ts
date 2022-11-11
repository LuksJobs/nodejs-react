import { CookieOptions, NextFunction, Request, Response } from 'express';
import config from 'config';
import crypto from 'crypto';
import {
  CreateUserInput,
  LoginUserInput,
  VerifyEmailInput,
} from '../schemas/user.schema';
import {
  createUser,
  findUser,
  findUserByEmail,
  findUserById,
  signTokens,
} from '../services/user.service';
import AppError from '../utils/appError';
import redisClient from '../utils/connectRedis';
import { signJwt, verifyJwt } from '../utils/jwt';
import { User } from '../entities/user.entity';
import Email from '../utils/email';

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};

if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>('accessTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000,
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>('refreshTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('refreshTokenExpiresIn') * 60 * 1000,
};

export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, password, email } = req.body;

    const newUser = await createUser({
      name,
      email: email.toLowerCase(),
      password,
    });

    const { hashedVerificationCode, verificationCode } =
      User.createVerificationCode();
    newUser.verificationCode = hashedVerificationCode;
    await newUser.save();

    // Enviar verificação de e-mail
    const redirectUrl = `${config.get<string>(
      'origin'
    )}/verifyemail/${verificationCode}`;

    try {
      await new Email(newUser, redirectUrl).sendVerificationCode();

      res.status(201).json({
        status: 'success',
        message:
          'Um e-mail com um código de verificação foi enviado para o seu e-mail',
      });
    } catch (error) {
      newUser.verificationCode = null;
      await newUser.save();

      return res.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao enviar o e-mail, tente novamente',
      });
    }
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({
        status: 'fail',
        message: 'O usuário com esse e-mail já existe',
      });
    }
    next(err);
  }
};

export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail({ email });

    // 1. Verificar se o usuário já existe
    if (!user) {
      return next(new AppError(400, 'E-mail ou senha inválidos'));
    }

    // 2.Verificar se o usuário foi vericado
    if (!user.verified) {
      return next(
        new AppError(
          401,
          'Você não é verificado, verifique seu e-mail para verificar sua conta'
        )
      );
    }

    //3. Verificar se a senha é valida
    if (!(await User.comparePasswords(password, user.password))) {
      return next(new AppError(400, 'E-mail ou senha inválida'));
    }

    // 4. Refresh no token de acesso
    const { access_token, refresh_token } = await signTokens(user);

    // 5. Adicionando Cookies
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 6. Verificando resposta de autenticação
    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

export const verifyEmailHandler = async (
  req: Request<VerifyEmailInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const verificationCode = crypto
      .createHash('sha256')
      .update(req.params.verificationCode)
      .digest('hex');

    const user = await findUser({ verificationCode });

    if (!user) {
      return next(new AppError(401, 'Não foi possível validar o e-mail'));
    }

    user.verified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'E-mail verificado com sucesso!',
    });
  } catch (err: any) {
    next(err);
  }
};

export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    const message = 'Não foi possíbel atualizar o token de acesso';

    if (!refresh_token) {
      return next(new AppError(403, message));
    }

    // Validar o token 
    const decoded = verifyJwt<{ sub: string }>(
      refresh_token,
      'refreshTokenPublicKey'
    );

    if (!decoded) {
      return next(new AppError(403, message));
    }

    // Verificar se o usuário está em uma sessão ativa
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(new AppError(403, message));
    }

    // Verificar se o usuário ainda existe
    const user = await findUserById(JSON.parse(session).id);

    if (!user) {
      return next(new AppError(403, message));
    }

    // Logar com novo token de acesso
    const access_token = signJwt({ sub: user.id }, 'accessTokenPrivateKey', {
      expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
    });

    // 4. Adicionando cookies
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 5. Verificando status do response
    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

const logout = (res: Response) => {
  res.cookie('access_token', '', { maxAge: 1 });
  res.cookie('refresh_token', '', { maxAge: 1 });
  res.cookie('logged_in', '', { maxAge: 1 });
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    await redisClient.del(user.id);
    logout(res);

    res.status(200).json({
      status: 'success',
    });
  } catch (err: any) {
    next(err);
  }
};
