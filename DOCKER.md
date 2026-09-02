# Docker Setup for Aine POC

Complete Docker containerization for the Aine Todo application with multi-stage builds, health checks, and environment support.

## 📋 Architecture

```
┌─────────────────────────────────────────┐
│      Docker Compose Network             │
│  aine-network (172.28.0.0/16)           │
├─────────────┬─────────────────────────┤
│   App       │   Server                │
│ (Port 3000) │  (Port 5000)            │
│  Frontend   │   Backend/API           │
│  React/Vite│   Node.js/Express       │
└─────────────┴─────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (Mac/Windows) or Docker + Docker Compose on Linux
- No need to have Node.js installed locally

### 1. Build Images

```bash
# Build all services
docker-compose build

# Build with no cache (fresh build)
docker-compose build --no-cache
```

### 2. Run Services

#### Development Mode (both services)
```bash
docker-compose up
```
- App: http://localhost:3000
- Server: http://localhost:5000

#### Frontend Only
```bash
docker-compose --profile app up
```

#### Backend Only
```bash
docker-compose --profile server up
```

#### Full Stack
```bash
docker-compose --profile full up
```

### 3. Stop Services

```bash
# Stop containers (preserves volumes)
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🔍 Health Checks

Each container has built-in health monitoring:

```bash
# Check service status
docker-compose ps

# View health status
docker inspect aine-app --format='{{.State.Health.Status}}'
docker inspect aine-server --format='{{.State.Health.Status}}'
```

### Health Check Endpoints

**Frontend:** http://localhost:3000 (serves the app)

**Backend:**
- Liveness: `GET http://localhost:5000/health/live` - Is the server running?
- Readiness: `GET http://localhost:5000/health/ready` - Is it ready for traffic?
- Combined: `GET http://localhost:5000/health` - Overall health

Example:
```bash
curl http://localhost:5000/health | jq
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-09-01T12:00:00.000Z",
  "uptime": 45.123,
  "environment": "development"
}
```

## 🔧 Environment Management

### Available Configurations

1. **Development** (default)
   ```bash
   docker-compose up
   ```
   - Debug logging enabled
   - Quick restart on changes

2. **Development** (with overrides)
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

3. **Test**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.test.yml up
   ```
   - Optimized for testing
   - No external port exposure
   - Fast fail mode

4. **Production**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
   ```
   - Resource limits enforced
   - Proper logging setup
   - Always restart on failure

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
APP_PORT=3000
SERVER_PORT=5000
REACT_APP_API_URL=http://localhost:5000
```

## 📊 Viewing Logs

```bash
# All services
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Specific service
docker-compose logs app
docker-compose logs server

# Last 50 lines
docker-compose logs --tail=50

# Timestamps included
docker-compose logs -t
```

## 🔐 Security Features

### Multi-Stage Builds
- Smaller production images (only final stage shipped)
- No build tools in final image
- Separate build and runtime contexts

### Non-Root User
- Containers run as `appuser` (UID 1001)
- Prevents privilege escalation
- File permissions enforced

### Security Best Practices Implemented

✅ Non-root user (appuser:appuser)  
✅ Multi-stage builds  
✅ Alpine Linux base (smaller attack surface)  
✅ Health checks configured  
✅ Network isolation  
✅ Resource limits (production)  
✅ .dockerignore for clean context  

## 📦 Docker Images

### Frontend Image
- **Base:** `node:18-alpine`
- **Build Tool:** Vite
- **Server:** serve (lightweight)
- **Size:** ~150MB (production optimized)
- **Port:** 3000

### Backend Image
- **Base:** `node:18-alpine`
- **Framework:** Express.js
- **Features:** API endpoints, health checks, static serving
- **Size:** ~200MB (includes dependencies)
- **Port:** 5000

## 🛠️ Common Commands

```bash
# View running containers
docker-compose ps

# View container details
docker-compose ps -a

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app

# Remove images
docker-compose down --rmi all

# Scale services (if applicable)
docker-compose up --scale app=2

# Execute command in container
docker-compose exec app sh

# View image info
docker inspect aine-app

# Check network
docker network inspect aine-network
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# View logs
docker-compose logs app

# Check container state
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Health Check Failing

```bash
# Test manually
curl http://localhost:5000/health

# Check container health
docker-compose ps
# STATUS should show "Up (healthy)"

# View health logs
docker-compose logs server | grep health
```

### Port Already in Use

```bash
# Use different ports
APP_PORT=3001 SERVER_PORT=5001 docker-compose up

# Or find what's using the port
lsof -i :3000
kill -9 <PID>
```

### Network Issues

```bash
# Check network
docker network ls
docker network inspect aine-network

# Check DNS
docker-compose exec app nslookup server
docker-compose exec server nslookup app
```

## 📈 Production Deployment

### Docker Swarm
```bash
docker stack deploy -c docker-compose.prod.yml aine
docker stack services aine
```

### Kubernetes
Convert compose to Kubernetes manifests:
```bash
# Using kompose (install first)
kompose convert -f docker-compose.yml -o k8s/
```

### Cloud Deployment

**AWS ECS:**
```bash
ecs-cli compose -f docker-compose.yml service up
```

**Google Cloud Run:**
```bash
gcloud run deploy aine-app --source .
```

**Azure Container Instances:**
```bash
az container create --resource-group myRG -f docker-compose.yml
```

## 🔄 Development Workflow

### Edit Code and See Changes

1. **Frontend Changes:**
   - Stop container: `Ctrl+C`
   - Rebuild: `docker-compose build app`
   - Restart: `docker-compose up app`

2. **Backend Changes:**
   - Stop container: `Ctrl+C`
   - Rebuild: `docker-compose build server`
   - Restart: `docker-compose up server`

### With Volume Mounts (Optional)

For hot-reload development, add volume mounts to docker-compose.yml:

```yaml
services:
  app:
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    # Requires: npm install -g vite
    command: vite

  server:
    volumes:
      - ./server:/app/server
    # Requires: npm install -g nodemon
    command: nodemon server/server.js
```

Then run with:
```bash
docker-compose up
```

## 📚 Learn More

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Scanning](https://docs.docker.com/engine/scan/)

## ✅ Checklist for Production

- [ ] All secrets in environment variables (not in Dockerfile)
- [ ] Resource limits set (CPU, memory)
- [ ] Health checks configured and tested
- [ ] Logging aggregated and retained
- [ ] Images scanned for vulnerabilities
- [ ] Non-root user in use
- [ ] Multi-stage builds implemented
- [ ] .dockerignore optimized
- [ ] Restart policies configured
- [ ] Network segmentation in place

---

**Ready to containerize?** Start with `docker-compose up` 🐳
