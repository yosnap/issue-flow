#!/bin/bash

# IssueFlow Docker Setup Script
# Este script facilita la configuración inicial de Docker para el proyecto

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Verificar si Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker no está instalado"
        print_message $YELLOW "Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_message $RED "❌ Docker no está ejecutándose"
        print_message $YELLOW "Por favor inicia Docker Desktop e intenta de nuevo"
        exit 1
    fi
    
    print_message $GREEN "✅ Docker está instalado y ejecutándose"
}

# Verificar si Docker Compose está instalado
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_message $RED "❌ Docker Compose no está instalado"
        print_message $YELLOW "Por favor instala Docker Compose desde: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_message $GREEN "✅ Docker Compose está disponible"
}

# Crear archivo .env si no existe
create_env_file() {
    if [ ! -f .env ]; then
        print_message $YELLOW "📝 Creando archivo .env desde .env.example"
        cp .env.example .env
        print_message $GREEN "✅ Archivo .env creado"
        print_message $BLUE "💡 Revisa y actualiza las variables de entorno en .env según tus necesidades"
    else
        print_message $BLUE "📁 El archivo .env ya existe"
    fi
}

# Crear directorios necesarios
create_directories() {
    print_message $YELLOW "📁 Creando directorios necesarios..."
    
    # Directorios para SSL (auto-firmados para desarrollo)
    mkdir -p docker/nginx/ssl
    mkdir -p docker/postgres/init
    mkdir -p logs
    
    print_message $GREEN "✅ Directorios creados"
}

# Generar certificados SSL auto-firmados para desarrollo
generate_ssl_certs() {
    if [ ! -f docker/nginx/ssl/cert.pem ] || [ ! -f docker/nginx/ssl/key.pem ]; then
        print_message $YELLOW "🔐 Generando certificados SSL auto-firmados para desarrollo..."
        
        # Generar clave privada
        openssl genrsa -out docker/nginx/ssl/key.pem 2048
        
        # Generar certificado auto-firmado
        openssl req -new -x509 -key docker/nginx/ssl/key.pem -out docker/nginx/ssl/cert.pem -days 365 -subj "/C=ES/ST=Madrid/L=Madrid/O=IssueFlow/CN=localhost"
        
        print_message $GREEN "✅ Certificados SSL generados"
        print_message $BLUE "💡 Los certificados son válidos por 365 días y están configurados para localhost"
    else
        print_message $BLUE "🔐 Los certificados SSL ya existen"
    fi
}

# Construir imágenes Docker
build_images() {
    print_message $YELLOW "🔨 Construyendo imágenes Docker..."
    docker-compose build
    print_message $GREEN "✅ Imágenes construidas exitosamente"
}

# Iniciar servicios
start_services() {
    print_message $YELLOW "🚀 Iniciando servicios..."
    docker-compose up -d
    print_message $GREEN "✅ Servicios iniciados"
    
    print_message $BLUE "📋 Estado de los servicios:"
    docker-compose ps
    
    print_message $BLUE "\n🌐 URLs disponibles:"
    print_message $BLUE "  - API Core: http://localhost:3000"
    print_message $BLUE "  - Dashboard: http://localhost:3001" 
    print_message $BLUE "  - HTTPS (Nginx): https://localhost"
    print_message $BLUE "  - Adminer (DB): http://localhost:8080"
    print_message $BLUE "  - Redis Commander: http://localhost:8081"
}

# Función principal
main() {
    print_message $BLUE "🐳 Configurando IssueFlow con Docker"
    print_message $BLUE "====================================\n"
    
    check_docker
    check_docker_compose
    create_env_file
    create_directories
    generate_ssl_certs
    build_images
    start_services
    
    print_message $GREEN "\n🎉 ¡Setup completado exitosamente!"
    print_message $BLUE "\n📖 Comandos útiles:"
    print_message $BLUE "  npm run docker:logs    - Ver logs de todos los servicios"
    print_message $BLUE "  npm run docker:down    - Parar todos los servicios"
    print_message $BLUE "  npm run docker:rebuild - Reconstruir y reiniciar"
    print_message $BLUE "  npm run docker:clean   - Limpiar volúmenes y contenedores"
}

# Verificar si se está ejecutando desde el directorio raíz del proyecto
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    print_message $RED "❌ Este script debe ejecutarse desde el directorio raíz del proyecto"
    print_message $YELLOW "Asegúrate de estar en el directorio que contiene package.json y docker-compose.yml"
    exit 1
fi

# Ejecutar función principal
main