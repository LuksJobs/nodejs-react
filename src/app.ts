require('dotenv').config();
import express, { NextFunction, Request, Response } from 'express';
import config from 'config';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { AppDataSource } from './utils/data-source';
import AppError from './utils/appError';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import postRouter from './routes/post.routes';
import validateEnv from './utils/validateEnv';
import cluster from 'cluster';
import os from 'os';


const numCpus = os.cpus().length;
AppDataSource.initialize()
  .then(async () => {
    // VALIDAR O ARQUIVO
    validateEnv();

    const app = express();

    // ENGINE TEMPLATES PARA AS VIEWS
    app.set('view engine', 'pug');
    app.set('views', `${__dirname}/views`);

    // MIDDLEWARES

    // 1. Body Parsers
    app.use(express.json({ limit: '10kb' }));

    // 2. Loggers
    if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

    // 3. Cookie Parsers
    app.use(cookieParser());

    // 4. Corss
    app.use(
      cors({
        origin: config.get<string>('origin'),
        credentials: true,
      })
    );

    // ROTAS DA API
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/posts', postRouter);

    // HEALTHCHEKER DA API 
    app.get('/api/healthChecker', async (_, res: Response) => {
      // const message = await redisClient.get('try');

      res.status(200).json({
        status: 'success',
        message: 'Bem-vindo ao NodeJs Motherfucker!',
      });
    });

    // ERROR DE ROTA UNHANDLER
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(404, `A rota que você procura: '${req.originalUrl}' não foi encontrada`));
    });

    // HANDLER DE ERRO DE ROTA (GLOBAL)
    app.use(
      (error: AppError, req: Request, res: Response, next: NextFunction) => {
        error.status = error.status || 'error';
        error.statusCode = error.statusCode || 500;

        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      }
    );

    const port = config.get<number>('port');
    if (cluster.isPrimary) {
      for (let i = 0; i < numCpus; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        console.log(`O Worker de pid nº: ${worker.process.pid} foi encerrado/morreu`);
        cluster.fork();
      });
    } else {
      app.listen(port);
      console.log(`Aplicação inciada com sucesso com o nº do pid: ${process.pid} rodando na porta: ${port}`);
    }
  })
  .catch((error) => console.log(error));
