# Thin wrapper over docker compose. The stack lives in docker/ and always
# builds from the repo root, so every target sets the compose file explicitly.

COMPOSE      := docker compose -f docker/compose.yml
COMPOSE_DEV  := $(COMPOSE) -f docker/compose.dev.yml
COMPOSE_TEST := $(COMPOSE) -f docker/compose.test.yml
COMPOSE_PROD := $(COMPOSE) -f docker/compose.prod.yml

.DEFAULT_GOAL := help
.PHONY: help build up dev prod down logs ps health shell-app shell-server clean test test-e2e

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

## ---- Docker ----

build: ## Build both images
	$(COMPOSE) build

up: ## Start the stack in the background
	$(COMPOSE) up -d

dev: ## Start with the development overlay
	$(COMPOSE_DEV) up

prod: ## Start with the production overlay
	$(COMPOSE_PROD) up -d

down: ## Stop and remove containers
	$(COMPOSE) down

logs: ## Follow logs from both services
	$(COMPOSE) logs -f

ps: ## Show container status and health
	$(COMPOSE) ps

health: ## Curl the health endpoints
	@echo "app:"    && curl -fsS http://localhost:3000/ >/dev/null && echo "  ok" || echo "  unreachable"
	@echo "server:" && curl -fsS http://localhost:5000/health || echo "  unreachable"

shell-app: ## Open a shell in the app container
	$(COMPOSE) exec app sh

shell-server: ## Open a shell in the server container
	$(COMPOSE) exec server sh

clean: ## Stop containers and drop volumes
	$(COMPOSE) down -v

## ---- Tests (run on the host, not in Docker) ----

test: ## Unit + component tests with coverage
	npm run test:coverage

test-e2e: ## Playwright end-to-end tests
	npm run test:e2e
