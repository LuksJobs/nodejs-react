//arquivo responsável por fechar a conexão da api com o redis que está rodando em container
//docker na porta: "6379"

import { createClient } from 'redis';

const redisUrl = 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('COnexão com o client do Redis foi um sucesso!');
    redisClient.set('Sistema inicializado!', 'NodeJS, Express com TypeORM');
  } catch (error) {
    console.log(error);
    setTimeout(connectRedis, 5000);
  }
};

connectRedis();

export default redisClient;
