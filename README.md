# API with Node.js + PostgreSQL + TypeORM e Docker

Projeto Node.js com TypeScript, ExpressJs, PostgreSQL, TypeORM, Redis e Docker.

* Node.js – uma linguagem de script em tempo de execução JavaScript
* TypeORM – um ORM (Object Relational Mapping) para serviços de banco de dados populares como PostgreSQL, MySQL, MongoDB e muitos mais.
* PostgreSQL – um banco de dados SQL
* Bcryptjs – um pacote de hash
* JsonWebToken (JWT) – gerando e verificando JSON Web Tokens
* Redis – para armazenamento em cache de sessão dos usuários
* Zod – para validar entradas do usuário

# Colocando a API para rodar

Antes de tudo é necessário fornecer as credenciais necessárias à imagem do PostgreSQL Docker, para isso precisamos criar um .env no diretório raiz. O arquivo de exemplo é o "exemploconexaodb".

```
$ make env 
```
O comando "make" quando íniciado faz com que os dois containers "postgresql e redis" rodem no ambiente docker, setados com as configurações nas variáveis para se conectarem a nossa API;

# Após os containers serem inicializados, agora é a hora de subir a API com o NPM:

```
npm run start
```

O npm irá executar a API no localhost, escutando na porta 8000; Exemplo: localhost:8000;

# Uso do Redis

O Redis é um banco de dados relacional de código aberto, que tem como uma de suas principais características o fato de estruturar informações em sua memória.
* Redis conteinerizado na imagem do Alpine, rodando na porta "6379" local;
* Nome do container: Redis
* Nome do volume para armazenar os objetos: "progresDB";

# Uso do PostgresSQL

PostgreSQL é um sistema gerenciador de banco de dados objeto relacional (SGBD), desenvolvido como projeto de código aberto.
* Rondado em container na porta "6500:5432" em localhost; 
* Serve para armazenar, criar tabelas e objetos gerados nos inputs da api;
* Nome do volume para armazenar objetos: redisDB
