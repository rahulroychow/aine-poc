.PHONY: help build up down restart logs ps health clean dev test prod

# Docker Compose helpers
.DEFAULT_GOAL := help

help:
	@echo "🐳 Aine POC Docker Commands"
	@echo ""
	@echo "Build:"
	@echo "  make build           Build all services"
	@echo "  make build-app       Build frontend only"
	@echo "  make build-server    Build backend only"
	@echo ""
	@echo "Run:"
	@echo "  make up              Start all services"
	@echo "  make up-app          Start frontend only"
	@echo "  make up-server       Start backend only"
	@echo "  make dev             Start in development mode"
	@echo "  make test            Start in test mode"
	@echo "  make prod            Start in production mode"
	@echo ""
	@echo "Manage:"
	@echo "  make down            Stop all services"
	@echo "  make restart         Restart all services"
	@echo "  make logs            View logs"
	@echo "  make ps              Show container status"
	@echo "  make health          Check service health"
	@echo "  make clean           Stop and remove containers"
	@echo "  make shell-app       Shell into app container"
	@echo "  make shell-server    Shell into server container"
	@echo ""

build:
	docker-compose build

build-app:
	docker-compose build app

build-server:
	docker-compose build server

up:
	docker-compose up -d
	@sleep 2
	@$(MAKE) ps

up-app:
	docker-compose --profile app up -d
	@sleep 2
	@$(MAKE) ps

up-server:
	docker-compose --profile server up -d
	@sleep 2
	@$(MAKE) ps

dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@sleep 2
	@$(MAKE) ps

test:
	docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
	@sleep 2
	@$(MAKE) ps

prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@sleep 2
	@$(MAKE) ps

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-app:
	docker-compose logs -f app

logs-server:
	docker-compose logs -f server

ps:
	docker-compose ps

health:
	@echo "🔍 Checking Frontend..."
	@curl -s http://localhost:3000 > /dev/null && echo "✓ Frontend is healthy" || echo "✗ Frontend is not responding"
	@echo ""
	@echo "🔍 Checking Backend Health..."
	@curl -s http://localhost:5000/health | jq . 2>/dev/null || echo "✗ Backend is not responding"

clean:
	docker-compose down

clean-all:
	docker-compose down -v

prune:
	docker system prune -f

shell-app:
	docker-compose exec app sh

shell-server:
	docker-compose exec server sh

verify:
	@echo "✓ Docker: $$(docker --version)"
	@echo "✓ Docker Compose: $$(docker-compose --version)"
	@docker ps > /dev/null && echo "✓ Docker daemon is running" || echo "✗ Docker daemon is not running"

info:
	@echo "=== Docker System Info ==="
	@docker system df
	@echo ""
	@echo "=== Running Services ==="
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
