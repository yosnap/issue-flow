#!/bin/bash

# IssueFlow Docker Development Script
# Este script gestiona el entorno de desarrollo con Docker

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Mostrar ayuda
show_help() {
    print_message $BLUE "🐳 IssueFlow Docker Development Helper"
    print_message $BLUE "====================================="
    echo ""
    print_message $BLUE "Uso: $0 [comando]"
    echo ""
    print_message $BLUE "Comandos disponibles:"
    print_message $GREEN "  start    - Iniciar entorno de desarrollo"
    print_message $GREEN "  stop     - Parar servicios de desarrollo"  
    print_message $GREEN "  restart  - Reiniciar servicios"
    print_message $GREEN "  logs     - Ver logs en tiempo real"
    print_message $GREEN "  status   - Mostrar estado de servicios"
    print_message $GREEN "  clean    - Limpiar contenedores y volúmenes"
    print_message $GREEN "  rebuild  - Reconstruir todo desde cero"
    print_message $GREEN "  shell    - Abrir shell en el contenedor core"
    print_message $GREEN "  db       - Conectar a la base de datos"
    print_message $GREEN "  redis    - Conectar a Redis CLI"
    echo ""
    print_message $BLUE "Ejemplos:"
    print_message $YELLOW "  $0 start"
    print_message $YELLOW "  $0 logs core"
    print_message $YELLOW "  $0 shell"
}

# Verificar si Docker está disponible
check_docker() {
    if ! command -v docker &> /dev/null || ! docker info &> /dev/null; then
        print_message $RED "❌ Docker no está disponible. Asegúrate de que Docker Desktop esté ejecutándose."
        exit 1
    fi
}

# Iniciar servicios de desarrollo
start_dev() {
    print_message $YELLOW "🚀 Iniciando entorno de desarrollo..."
    
    # Usar el compose de desarrollo si existe, sino el principal
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml up -d
    else
        docker-compose up -d
    fi
    
    print_message $GREEN "✅ Servicios iniciados"
    show_urls
}

# Parar servicios
stop_dev() {
    print_message $YELLOW "🛑 Parando servicios de desarrollo..."
    
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker-compose down
    fi
    
    print_message $GREEN "✅ Servicios detenidos"
}

# Reiniciar servicios
restart_dev() {
    print_message $YELLOW "🔄 Reiniciando servicios..."
    stop_dev
    start_dev
}

# Ver logs
show_logs() {
    local service=$1
    
    if [ -n "$service" ]; then
        print_message $BLUE "📋 Mostrando logs del servicio: $service"
        if [ -f "docker-compose.dev.yml" ]; then
            docker-compose -f docker-compose.dev.yml logs -f "$service"
        else
            docker-compose logs -f "$service"
        fi
    else
        print_message $BLUE "📋 Mostrando logs de todos los servicios"
        if [ -f "docker-compose.dev.yml" ]; then
            docker-compose -f docker-compose.dev.yml logs -f
        else
            docker-compose logs -f
        fi
    fi
}

# Mostrar estado de servicios
show_status() {
    print_message $BLUE "📊 Estado de los servicios:"
    
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml ps
    else
        docker-compose ps
    fi
}

# Limpiar contenedores y volúmenes
clean_dev() {
    print_message $YELLOW "🧹 Limpiando contenedores y volúmenes..."
    
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
    else
        docker-compose down -v --remove-orphans
    fi
    
    # Limpiar imágenes huérfanas
    docker image prune -f
    
    print_message $GREEN "✅ Limpieza completada"
}

# Reconstruir todo
rebuild_dev() {
    print_message $YELLOW "🔨 Reconstruyendo servicios desde cero..."
    
    stop_dev
    
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    start_dev
    print_message $GREEN "✅ Reconstrucción completada"
}

# Abrir shell en contenedor
open_shell() {
    local service=${1:-core}
    
    print_message $BLUE "🐚 Abriendo shell en el contenedor: $service"
    
    # Verificar si el contenedor existe y está ejecutándose
    if docker ps --format "table {{.Names}}" | grep -q "issueflow-${service}"; then
        docker exec -it "issueflow-${service}" /bin/sh
    elif docker ps --format "table {{.Names}}" | grep -q "issueflow-${service}-dev"; then
        docker exec -it "issueflow-${service}-dev" /bin/sh
    else
        print_message $RED "❌ No se encontró el contenedor $service ejecutándose"
        print_message $BLUE "Servicios disponibles:"
        docker ps --format "table {{.Names}}\t{{.Status}}"
    fi
}

# Conectar a base de datos
connect_db() {
    print_message $BLUE "🗄️  Conectando a PostgreSQL..."
    
    if docker ps --format "table {{.Names}}" | grep -q "postgres"; then
        docker exec -it issueflow-postgres psql -U issueflow -d issueflow
    elif docker ps --format "table {{.Names}}" | grep -q "postgres-dev"; then
        docker exec -it issueflow-postgres-dev psql -U dev_user -d issueflow_dev
    else
        print_message $RED "❌ No se encontró el contenedor de PostgreSQL ejecutándose"
    fi
}

# Conectar a Redis
connect_redis() {
    print_message $BLUE "📮 Conectando a Redis..."
    
    if docker ps --format "table {{.Names}}" | grep -q "redis"; then
        docker exec -it issueflow-redis redis-cli
    elif docker ps --format "table {{.Names}}" | grep -q "redis-dev"; then
        docker exec -it issueflow-redis-dev redis-cli
    else
        print_message $RED "❌ No se encontró el contenedor de Redis ejecutándose"
    fi
}

# Mostrar URLs disponibles
show_urls() {
    print_message $BLUE "\n🌐 URLs disponibles:"
    
    if [ -f "docker-compose.dev.yml" ]; then
        print_message $GREEN "  - Adminer (DB): http://localhost:8082"
        print_message $GREEN "  - Redis Commander: http://localhost:8083"
        print_message $BLUE "  - PostgreSQL: localhost:5433"
        print_message $BLUE "  - Redis: localhost:6380"
    else
        print_message $GREEN "  - API Core: http://localhost:3000"
        print_message $GREEN "  - Dashboard: http://localhost:3001"
        print_message $GREEN "  - HTTPS (Nginx): https://localhost"
        print_message $GREEN "  - Adminer (DB): http://localhost:8080"  
        print_message $GREEN "  - Redis Commander: http://localhost:8081"
        print_message $BLUE "  - PostgreSQL: localhost:5432"
        print_message $BLUE "  - Redis: localhost:6379"
    fi
}

# Función principal
main() {
    check_docker
    
    case "${1:-help}" in
        "start")
            start_dev
            ;;
        "stop")
            stop_dev
            ;;
        "restart")
            restart_dev
            ;;
        "logs")
            show_logs $2
            ;;
        "status")
            show_status
            ;;
        "clean")
            clean_dev
            ;;
        "rebuild")
            rebuild_dev
            ;;
        "shell")
            open_shell $2
            ;;
        "db")
            connect_db
            ;;
        "redis")
            connect_redis
            ;;
        "urls")
            show_urls
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Verificar directorio
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    print_message $RED "❌ Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

main "$@"