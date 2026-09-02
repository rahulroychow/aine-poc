# 🐳 Docker Quick Reference

## One-Minute Setup

```bash
# Copy environment config
cp .env.example .env

# Build images (first time only)
docker-compose build

# Start all services
docker-compose up

# View in browser
open http://localhost:3000

# Check health
curl http://localhost:5000/health | jq
```

## Essential Commands

| Command | What It Does |
|---------|-------------|
| `docker-compose up` | Start all services in background |
| `docker-compose down` | Stop all services |
| `docker-compose logs -f` | View live logs |
| `docker-compose ps` | Show container status |
| `make help` | Show all Makefile commands |
| `./docker.sh help` | Show all docker.sh commands |

## Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5000 | http://localhost:5000 |

## Health Endpoints

```bash
# Frontend (just loads the app)
curl http://localhost:3000

# Backend - Liveness (is it running?)
curl http://localhost:5000/health/live

# Backend - Readiness (is it ready?)
curl http://localhost:5000/health/ready

# Backend - Combined check
curl http://localhost:5000/health | jq
```

## Environment Modes

```bash
# Development (default)
docker-compose up

# With dev overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Test mode
docker-compose -f docker-compose.yml -f docker-compose.test.yml up

# Production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Using Makefiles

```bash
make build          # Build images
make up             # Start services
make logs           # View logs
make health         # Check health
make down           # Stop services
make help           # Show all commands
```

## Using docker.sh Script

```bash
./docker.sh build           # Build all
./docker.sh up              # Start all
./docker.sh logs -f         # Follow logs
./docker.sh health          # Check health
./docker.sh shell:app       # Shell into app
./docker.sh shell:server    # Shell into server
./docker.sh help            # Show help
```

## Useful Docker Commands

```bash
# See what's running
docker ps

# View container logs
docker logs aine-app
docker logs aine-server

# Stop specific container
docker stop aine-app

# Remove everything
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache

# View resource usage
docker stats

# Execute command in container
docker exec -it aine-app sh
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | `APP_PORT=3001 SERVER_PORT=5001 docker-compose up` |
| Container won't start | `docker-compose logs app` to see error |
| Health check failing | `curl http://localhost:5000/health` |
| Docker not found | Install Docker Desktop |

## Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Frontend build recipe |
| `server/Dockerfile` | Backend build recipe |
| `docker-compose.yml` | Main service orchestration |
| `docker-compose.dev.yml` | Development overrides |
| `docker-compose.test.yml` | Test overrides |
| `docker-compose.prod.yml` | Production overrides |
| `.dockerignore` | Files to exclude from build |
| `.env.example` | Environment template |
| `DOCKER.md` | Full documentation |
| `docker.sh` | Helper script |
| `Makefile` | Make targets |

## Production Checklist

- [ ] Update `.env` with real values
- [ ] Set `NODE_ENV=production`
- [ ] Use `docker-compose.prod.yml`
- [ ] Health checks passing: `curl http://localhost:5000/health`
- [ ] Logs accessible: `docker-compose logs`
- [ ] Resource limits enforced (see docker-compose.prod.yml)
- [ ] Non-root user verified: containers run as `appuser`
- [ ] Images scanned for vulnerabilities

## Next Steps

1. **Learn More:** Read `DOCKER.md` for complete documentation
2. **Deploy:** Push to Docker Hub or cloud registry
3. **Orchestrate:** Use Kubernetes or Docker Swarm for production
4. **Monitor:** Set up logging and monitoring stack

---

**Pro tip:** Use `make help` or `./docker.sh help` to see all available commands! 🚀
