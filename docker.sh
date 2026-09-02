#!/bin/bash

# ===== Aine POC Docker Helper Script =====
# Provides convenient Docker and Docker Compose commands

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project name
PROJECT_NAME="aine"

# Functions
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

show_help() {
    cat <<EOF
${BLUE}Aine POC Docker Helper${NC}

Usage: ./docker.sh <command> [options]

${YELLOW}Build Commands:${NC}
  build               Build all services
  build:app           Build frontend only
  build:server        Build backend only
  build:fresh         Rebuild without cache

${YELLOW}Run Commands:${NC}
  up                  Start all services (development mode)
  up:app              Start frontend only
  up:server           Start backend only
  up:prod             Start in production mode
  up:test             Start in test mode
  down                Stop all services
  restart             Restart all services
  logs                View logs (all services)
  logs:app            View frontend logs
  logs:server         View backend logs

${YELLOW}Status Commands:${NC}
  ps                  Show container status
  health              Check service health
  shell:app           Open shell in app container
  shell:server        Open shell in server container

${YELLOW}Cleanup Commands:${NC}
  clean               Stop containers (keep volumes)
  clean:all           Stop containers and remove volumes
  prune               Remove unused images and containers

${YELLOW}Development Commands:${NC}
  dev                 Start with development overrides
  test                Start with test overrides
  prod                Start with production overrides

${YELLOW}Utility Commands:${NC}
  env                 Create .env from .env.example
  verify              Verify Docker installation and configuration
  info                Show system and service information

${YELLOW}Examples:${NC}
  ./docker.sh up              # Start all services
  ./docker.sh logs -f         # Follow logs
  ./docker.sh shell:app       # Connect to app container
  ./docker.sh health          # Check health status

EOF
}

# Command implementations

cmd_build() {
    print_header "Building Docker Images"

    case "${1:-all}" in
        app)
            docker-compose build app
            print_success "Frontend image built"
            ;;
        server)
            docker-compose build server
            print_success "Backend image built"
            ;;
        fresh)
            docker-compose build --no-cache
            print_success "All images rebuilt (fresh)"
            ;;
        *)
            docker-compose build
            print_success "All images built"
            ;;
    esac
}

cmd_up() {
    print_header "Starting Services"

    case "${1:-all}" in
        app)
            docker-compose --profile app up -d
            print_success "Frontend service started"
            ;;
        server)
            docker-compose --profile server up -d
            print_success "Backend service started"
            ;;
        prod)
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
            print_success "Services started (production mode)"
            ;;
        test)
            docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
            print_success "Services started (test mode)"
            ;;
        *)
            docker-compose up -d
            print_success "All services started"
            ;;
    esac

    sleep 2
    cmd_ps
}

cmd_down() {
    print_header "Stopping Services"
    docker-compose down
    print_success "All services stopped"
}

cmd_restart() {
    print_header "Restarting Services"
    docker-compose restart
    print_success "All services restarted"
}

cmd_logs() {
    case "${1:-all}" in
        app)
            docker-compose logs -f ${@:2} app
            ;;
        server)
            docker-compose logs -f ${@:2} server
            ;;
        *)
            docker-compose logs -f "$@"
            ;;
    esac
}

cmd_ps() {
    print_header "Container Status"
    docker-compose ps
}

cmd_health() {
    print_header "Service Health Check"

    # Check frontend
    echo -e "\n${YELLOW}Frontend (http://localhost:3000):${NC}"
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend is not responding"
    fi

    # Check backend
    echo -e "\n${YELLOW}Backend Health Endpoints:${NC}"

    print_info "Checking liveness..."
    if curl -s http://localhost:5000/health/live | jq . 2>/dev/null; then
        print_success "Backend liveness check passed"
    else
        print_error "Backend liveness check failed"
    fi

    print_info "Checking readiness..."
    if curl -s http://localhost:5000/health/ready | jq . 2>/dev/null; then
        print_success "Backend readiness check passed"
    else
        print_error "Backend readiness check failed"
    fi

    # Docker health status
    echo -e "\n${YELLOW}Docker Container Health:${NC}"
    docker-compose ps --format "table {{.Names}}\t{{.Status}}"
}

cmd_shell() {
    local service="${1##*:}"

    if [ -z "$service" ]; then
        print_error "Specify service: shell:app or shell:server"
        return 1
    fi

    print_info "Opening shell in $service container..."
    docker-compose exec "$service" sh
}

cmd_clean() {
    if [ "$1" == "all" ]; then
        print_header "Cleaning Up (removing volumes)"
        docker-compose down -v
        print_success "Containers and volumes removed"
    else
        print_header "Stopping Services"
        docker-compose down
        print_success "Containers stopped (volumes preserved)"
    fi
}

cmd_prune() {
    print_header "Pruning Docker Resources"
    print_info "Removing unused images, containers, and networks..."
    docker system prune -f
    print_success "Docker cleanup complete"
}

cmd_dev() {
    print_header "Starting Development Mode"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    print_success "Development mode started"
    sleep 2
    cmd_ps
}

cmd_test() {
    print_header "Starting Test Mode"
    docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
    print_success "Test mode started"
    sleep 2
    cmd_ps
}

cmd_prod() {
    print_header "Starting Production Mode"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    print_success "Production mode started"
    sleep 2
    cmd_ps
}

cmd_env() {
    if [ ! -f .env ]; then
        print_info "Creating .env from .env.example..."
        cp .env.example .env
        print_success ".env created - edit as needed"
    else
        print_info ".env already exists"
    fi
}

cmd_verify() {
    print_header "Verifying Docker Installation"

    print_info "Checking Docker..."
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version)
        print_success "Docker installed: $docker_version"
    else
        print_error "Docker not found"
        return 1
    fi

    print_info "Checking Docker Compose..."
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version)
        print_success "Docker Compose installed: $compose_version"
    else
        print_error "Docker Compose not found"
        return 1
    fi

    print_info "Checking Docker daemon..."
    if docker ps &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        return 1
    fi

    echo -e "\n${GREEN}All checks passed!${NC}"
}

cmd_info() {
    print_header "System Information"

    echo -e "\n${YELLOW}Docker:${NC}"
    docker --version
    docker-compose --version

    echo -e "\n${YELLOW}System:${NC}"
    uname -a

    echo -e "\n${YELLOW}Disk Space:${NC}"
    df -h | head -2

    echo -e "\n${YELLOW}Docker System Info:${NC}"
    docker system df

    echo -e "\n${YELLOW}Running Services:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main command dispatcher
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    case "$1" in
        build)
            shift
            cmd_build "$@"
            ;;
        up)
            shift
            cmd_up "$@"
            ;;
        down)
            cmd_down
            ;;
        restart)
            cmd_restart
            ;;
        logs)
            shift
            cmd_logs "$@"
            ;;
        ps)
            cmd_ps
            ;;
        health)
            cmd_health
            ;;
        shell:*)
            cmd_shell "$1"
            ;;
        clean)
            shift
            cmd_clean "$@"
            ;;
        prune)
            cmd_prune
            ;;
        dev)
            cmd_dev
            ;;
        test)
            cmd_test
            ;;
        prod)
            cmd_prod
            ;;
        env)
            cmd_env
            ;;
        verify)
            cmd_verify
            ;;
        info)
            cmd_info
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main
main "$@"
