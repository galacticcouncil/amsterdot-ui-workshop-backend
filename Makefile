process: migrate
	@node -r dotenv/config lib/processor.js


serve:
	@npx squid-graphql-server


migrate:
	@npx sqd db:migrate


migration:
	@npx sqd db:create-migration Data


build:
	@npm run build


codegen:
	@npx sqd codegen


typegen: kusamaVersions.json
	@npx squid-substrate-typegen typegen.json


kusamaVersions.json:
	@make explore


explore:
	@npx squid-substrate-metadata-explorer \
		--chain wss://amsterdot.eu.ngrok.io \
		--out basiliskVersions.json


indexer-up:
	@docker compose -f archive/docker-compose.yml up -d


indexer-down:
	@docker compose -f archive/docker-compose.yml down -v

processor-db-up:
	@docker compose up -d

processor-db-down:
	@docker compose down -v

db-up: indexer-up processor-db-up

db-down: indexer-down processor-db-down

.PHONY: process serve start codegen migration migrate up down processor-db-up processor-db-down
