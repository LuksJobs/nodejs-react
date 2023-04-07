env:
	mv dotenv .env

#reponsável por subir os dois containers em docker
dev:
	docker-compose up -d

#reponsável por remover os dois containers em docker
dev-down:
	docker-compose down

dev-down-volume:
	docker-compose down

#migra os objetos criados no banco para o typeorm
migrate:
	rm -rf build && yarn build && yarn typeorm migration:generate ./src/migrations/added-active -d ./src/utils/data-source.ts
	

db-push:
	yarn build && yarn typeorm migrate:run
