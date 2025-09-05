# 🐳 Docker Setup para IssueFlow

Esta guía te ayudará a configurar y ejecutar IssueFlow usando Docker y Docker Compose.

## 📋 Requisitos Previos

- **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (incluido con Docker Desktop)
- **Node.js 18+** (para scripts de desarrollo)

## 🚀 Inicio Rápido

### Setup Automático (Recomendado)

Ejecuta el script de configuración automática:

```bash
./scripts/docker-setup.sh
```

Este script:
- ✅ Verifica que Docker esté instalado y ejecutándose
- 📝 Crea el archivo `.env` desde `.env.example`
- 📁 Crea los directorios necesarios
- 🔐 Genera certificados SSL auto-firmados para desarrollo
- 🔨 Construye las imágenes Docker
- 🚀 Inicia todos los servicios

### Setup Manual

1. **Clonar y navegar al proyecto:**
   ```bash
   git clone <repository-url>
   cd issue-flow
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env según tus necesidades
   ```

3. **Crear directorios necesarios:**
   ```bash
   mkdir -p docker/nginx/ssl docker/postgres/init logs
   ```

4. **Generar certificados SSL (desarrollo):**
   ```bash
   openssl genrsa -out docker/nginx/ssl/key.pem 2048
   openssl req -new -x509 -key docker/nginx/ssl/key.pem -out docker/nginx/ssl/cert.pem -days 365 -subj "/C=ES/ST=Madrid/L=Madrid/O=IssueFlow/CN=localhost"
   ```

5. **Iniciar servicios:**
   ```bash
   docker-compose up -d
   ```

## 🛠️ Comandos Disponibles

### Scripts NPM

```bash
# Construcción y gestión
npm run docker:build          # Construir imágenes
npm run docker:up             # Iniciar servicios
npm run docker:down           # Parar servicios
npm run docker:logs           # Ver logs

# Desarrollo
npm run docker:dev            # Iniciar entorno de desarrollo
npm run docker:dev:down       # Parar entorno de desarrollo
npm run docker:dev:logs       # Ver logs del entorno de desarrollo

# Mantenimiento
npm run docker:clean          # Limpiar contenedores y volúmenes
npm run docker:rebuild        # Reconstruir y reiniciar
```

### Script de Desarrollo

El script `./scripts/docker-dev.sh` proporciona comandos útiles para desarrollo:

```bash
# Gestión de servicios
./scripts/docker-dev.sh start     # Iniciar entorno
./scripts/docker-dev.sh stop      # Parar servicios
./scripts/docker-dev.sh restart   # Reiniciar servicios
./scripts/docker-dev.sh status    # Estado de servicios

# Debugging y logs
./scripts/docker-dev.sh logs          # Ver todos los logs
./scripts/docker-dev.sh logs core     # Ver logs de un servicio específico
./scripts/docker-dev.sh shell         # Abrir shell en contenedor core
./scripts/docker-dev.sh shell nginx   # Abrir shell en contenedor específico

# Base de datos y cache
./scripts/docker-dev.sh db        # Conectar a PostgreSQL
./scripts/docker-dev.sh redis     # Conectar a Redis CLI

# Mantenimiento
./scripts/docker-dev.sh clean     # Limpiar todo
./scripts/docker-dev.sh rebuild   # Reconstruir desde cero
./scripts/docker-dev.sh urls      # Mostrar URLs disponibles
```

## 🏗️ Arquitectura de Servicios

### Servicios Principales

#### 🔧 Core Service (IssueFlow API)
- **Puerto:** 3000
- **Descripción:** API principal del framework
- **Health Check:** `/health`
- **Tecnologías:** Node.js, Express, TypeScript

#### 🎨 Dashboard (Frontend)
- **Puerto:** 3001
- **Descripción:** Interfaz de usuario con Next.js
- **Tecnologías:** Next.js, React, TypeScript

#### 🌐 Nginx (Reverse Proxy)
- **Puertos:** 80 (HTTP), 443 (HTTPS)
- **Descripción:** Proxy reverso y balanceador de carga
- **Features:** SSL termination, rate limiting, static file serving

### Servicios de Infraestructura

#### 🗄️ PostgreSQL
- **Puerto:** 5432 (producción), 5433 (desarrollo)
- **Base de Datos:** `issueflow` / `issueflow_dev`
- **Descripción:** Base de datos principal

#### 📮 Redis
- **Puerto:** 6379 (producción), 6380 (desarrollo)
- **Descripción:** Cache y cola de tareas
- **Features:** Persistencia activada

### Herramientas de Desarrollo

#### 🔍 Adminer
- **Puerto:** 8080 (producción), 8082 (desarrollo)
- **Descripción:** Interfaz web para gestión de base de datos
- **URL:** http://localhost:8080

#### 📊 Redis Commander
- **Puerto:** 8081 (producción), 8083 (desarrollo)
- **Descripción:** Interfaz web para gestión de Redis
- **URL:** http://localhost:8081

## 🌐 URLs de Acceso

### Entorno de Producción
- **🔗 HTTPS (Principal):** https://localhost
- **🔗 HTTP (Redirige a HTTPS):** http://localhost
- **🔗 API Core:** http://localhost:3000
- **🔗 Dashboard:** http://localhost:3001
- **🔗 Adminer:** http://localhost:8080
- **🔗 Redis Commander:** http://localhost:8081

### Entorno de Desarrollo
- **🔗 Adminer:** http://localhost:8082
- **🔗 Redis Commander:** http://localhost:8083
- **🔌 PostgreSQL:** localhost:5433
- **🔌 Redis:** localhost:6380

## 🔧 Configuración

### Variables de Entorno

Las principales variables se configuran en el archivo `.env`:

```bash
# Base de Datos
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=issueflow
POSTGRES_USER=issueflow
POSTGRES_PASSWORD=issueflow_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API
NODE_ENV=development
PORT=3000
API_VERSION=v1
API_PREFIX=/api
```

### Personalización de Nginx

Los archivos de configuración de Nginx están en:
- `docker/nginx/nginx.conf` - Configuración principal
- `docker/nginx/conf.d/default.conf` - Configuración del servidor
- `docker/nginx/ssl/` - Certificados SSL

### Volúmenes Persistentes

Los datos se almacenan en volúmenes Docker:
- `postgres_data` - Datos de PostgreSQL
- `redis_data` - Datos de Redis
- `nginx_logs` - Logs de Nginx

## 🚨 Troubleshooting

### Problemas Comunes

#### Puerto ya en uso
```bash
# Verificar qué proceso usa el puerto
lsof -i :3000
# Parar servicios Docker
docker-compose down
```

#### Permisos de archivos SSL
```bash
# Regenerar certificados
rm -rf docker/nginx/ssl/*
./scripts/docker-setup.sh
```

#### Contenedores no se inician
```bash
# Ver logs de un servicio específico
docker-compose logs core

# Reconstruir imágenes
npm run docker:rebuild
```

#### Base de datos no conecta
```bash
# Verificar estado del contenedor
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Conectar manualmente
./scripts/docker-dev.sh db
```

### Logs y Debugging

```bash
# Ver logs en tiempo real
npm run docker:logs

# Ver logs de un servicio específico
docker-compose logs -f core

# Abrir shell en contenedor
./scripts/docker-dev.sh shell core

# Inspeccionar red
docker network inspect issueflow-network
```

### Performance y Recursos

```bash
# Ver uso de recursos
docker stats

# Limpiar recursos no utilizados
docker system prune -a

# Ver tamaño de imágenes
docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"
```

## 📦 Desarrollo con Docker

### Hot Reloading

En desarrollo, el código se monta como volumen para hot reloading:
- Core service: `./packages/core` → `/app`
- Dashboard: `./packages/dashboard` → `/app`

### Debugging

Para debugging con VS Code:
1. Asegúrate de que el servicio esté ejecutándose
2. Usa la configuración de debugging para Docker
3. O conecta directamente al proceso Node.js en el contenedor

### Testing

```bash
# Ejecutar tests en contenedor
docker-compose exec core npm test

# Ejecutar tests específicos
docker-compose exec core npm test -- --grep "auth"
```

## 🔒 Seguridad

### Certificados SSL

En desarrollo se usan certificados auto-firmados. Para producción:
1. Obtén certificados válidos (Let's Encrypt, CA comercial)
2. Reemplaza los archivos en `docker/nginx/ssl/`
3. Actualiza la configuración de Nginx si es necesario

### Secrets y Passwords

- Cambia todas las contraseñas por defecto en producción
- Usa variables de entorno para secrets
- No commitees archivos `.env` con datos sensibles

## 📚 Referencias

- [Documentación de Docker](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)