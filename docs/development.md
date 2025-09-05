# 🛠️ Guía de Desarrollo - IssueFlow

Esta guía te ayudará a configurar tu entorno de desarrollo para contribuir al proyecto IssueFlow.

## 📋 Requisitos del Sistema

### Requisitos Básicos
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** >= 2.20.0

### Para Desarrollo con Docker
- **Docker Desktop** - [Instalar aquí](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (incluido con Docker Desktop)

### IDEs Recomendados
- **VS Code** con extensiones recomendadas (ver `.vscode/extensions.json`)
- **WebStorm** con configuración TypeScript

## 🚀 Setup Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/issueflow/issueflow.git
cd issueflow
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias del monorepo
npm install

# Verificar instalación
npm run typecheck
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar variables según tu entorno
nano .env
```

## 🎯 Opciones de Desarrollo

### Opción 1: Desarrollo Local (Rápido)

Ideal para desarrollo frontend y cambios en adapters:

```bash
# Iniciar todos los paquetes en modo desarrollo
npm run dev

# O servicios específicos
npm run dev:core     # Solo Core API
npm run dev:vue      # Solo adapter Vue
npm run dev:nextjs   # Solo adapter Next.js
```

**Pros:**
- ✅ Inicio rápido
- ✅ Hot reloading inmediato
- ✅ Menos recursos del sistema

**Contras:**
- ❌ No incluye base de datos
- ❌ Mock de servicios externos
- ❌ Limitado para testing de integración

### Opción 2: Desarrollo con Docker (Completo)

Ideal para desarrollo full-stack y testing de integración:

```bash
# Setup automático completo
./scripts/docker-setup.sh

# Iniciar entorno de desarrollo
npm run docker:dev

# Ver logs en tiempo real
npm run docker:dev:logs
```

**Pros:**
- ✅ Entorno completo (DB, Redis, Nginx)
- ✅ Réplica exacta de producción
- ✅ Testing de integración real
- ✅ Aislamiento total

**Contras:**
- ❌ Uso mayor de recursos
- ❌ Startup más lento
- ❌ Complejidad adicional

## 🏗️ Estructura del Proyecto

```
issueflow/
├── packages/
│   ├── sdk/                    # Core SDK (TypeScript)
│   │   ├── src/
│   │   │   ├── core/          # Lógica principal
│   │   │   ├── types/         # Definiciones TypeScript
│   │   │   └── utils/         # Utilidades compartidas
│   │   └── tests/
│   │
│   ├── core/                   # Backend API Service
│   │   ├── src/
│   │   │   ├── routes/        # Rutas de la API
│   │   │   ├── services/      # Lógica de negocio
│   │   │   ├── models/        # Modelos de datos
│   │   │   └── middlewares/   # Middlewares Express
│   │   └── tests/
│   │
│   ├── vue/                    # Vue 3 Adapter
│   ├── nextjs/                 # Next.js Adapter
│   ├── angular/                # Angular Adapter
│   └── svelte/                 # Svelte Adapter
│
├── scripts/                    # Scripts de desarrollo y CI
├── docs/                       # Documentación
├── docker/                     # Configuración Docker
└── .github/                    # GitHub Actions y templates
```

## 🔧 Scripts de Desarrollo

### Scripts Principales

```bash
# Desarrollo
npm run dev                     # Todos los paquetes en dev mode
npm run dev:core               # Solo Core API
npm run dev:vue                # Solo Vue adapter

# Building
npm run build                  # Build todos los paquetes
npm run build:core             # Build solo Core
npm run build:sdk              # Build solo SDK

# Testing
npm test                       # Todos los tests
npm run test:watch             # Tests en modo watch
npm run test:angular           # Tests específicos de Angular

# Linting y formato
npm run lint                   # ESLint en todos los paquetes
npm run typecheck             # TypeScript check

# Limpieza
npm run clean                 # Limpiar node_modules y builds
```

### Scripts de Docker

```bash
# Setup y gestión básica
npm run docker:build          # Construir imágenes
npm run docker:up            # Iniciar servicios producción
npm run docker:down          # Parar servicios

# Desarrollo
npm run docker:dev           # Entorno de desarrollo
npm run docker:dev:down      # Parar entorno desarrollo
npm run docker:dev:logs      # Logs entorno desarrollo

# Mantenimiento
npm run docker:clean         # Limpiar contenedores y volúmenes
npm run docker:rebuild       # Reconstruir completamente
```

### Scripts Avanzados con docker-dev.sh

```bash
./scripts/docker-dev.sh start      # Iniciar desarrollo
./scripts/docker-dev.sh stop       # Parar servicios
./scripts/docker-dev.sh restart    # Reiniciar servicios
./scripts/docker-dev.sh logs       # Ver logs (todos los servicios)
./scripts/docker-dev.sh logs core  # Ver logs específicos
./scripts/docker-dev.sh status     # Estado de servicios
./scripts/docker-dev.sh shell      # Shell en contenedor core
./scripts/docker-dev.sh db         # Conectar a PostgreSQL
./scripts/docker-dev.sh redis      # Conectar a Redis CLI
./scripts/docker-dev.sh clean      # Limpieza profunda
./scripts/docker-dev.sh rebuild    # Reconstruir desde cero
```

## 🔍 Testing

### Estructura de Tests

```
packages/[package]/
├── tests/
│   ├── unit/              # Tests unitarios
│   ├── integration/       # Tests de integración
│   └── e2e/              # Tests end-to-end
├── __mocks__/            # Mocks para testing
└── vitest.config.ts      # Configuración Vitest
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm run test:angular
npm run test --workspace=packages/vue

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

### Writing Tests

Ejemplo de test unitario:

```typescript
// packages/sdk/tests/unit/validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateIssue } from '../src/core/validation'

describe('Issue Validation', () => {
  it('should validate required fields', () => {
    const issue = { title: 'Test Issue' }
    const result = validateIssue(issue)
    expect(result.isValid).toBe(true)
  })
  
  it('should reject empty title', () => {
    const issue = { title: '' }
    const result = validateIssue(issue)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Title is required')
  })
})
```

## 🎨 Workflows de Desarrollo

### 1. Desarrollo de Nueva Funcionalidad

```bash
# 1. Crear rama para la funcionalidad
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar en modo dev
npm run dev

# 3. Escribir tests
npm run test:watch

# 4. Verificar código
npm run lint
npm run typecheck

# 5. Commit y push
git add .
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### 2. Bug Fix

```bash
# 1. Crear rama para el bug
git checkout -b fix/descripcion-bug

# 2. Reproducir con Docker (entorno completo)
npm run docker:dev

# 3. Desarrollar fix
# ... hacer cambios

# 4. Verificar fix con tests
npm test

# 5. Test en entorno Docker
./scripts/docker-dev.sh rebuild

# 6. Commit
git add .
git commit -m "fix: corregir problema específico"
```

### 3. Desarrollo de Adapter

```bash
# 1. Trabajar en el adapter específico
npm run dev:vue  # o el framework correspondiente

# 2. Tests del adapter
npm run test --workspace=packages/vue

# 3. Verificar integración
npm run docker:dev
# Verificar en http://localhost:3001
```

## 🔄 Flujo de CI/CD

### GitHub Actions

El proyecto usa GitHub Actions para:
- ✅ Linting y TypeScript checks
- ✅ Tests automatizados
- ✅ Build verification
- ✅ Docker image building
- ✅ Deployment automático

### Pre-commit Hooks

```bash
# Instalar hooks (automático con npm install)
npx husky install

# Los hooks ejecutan:
# - ESLint fix
# - Prettier format
# - TypeScript check
# - Tests relevantes
```

## 🐛 Debugging

### VS Code Setup

Archivo `.vscode/launch.json` incluido para debugging:

```json
{
  "configurations": [
    {
      "name": "Debug Core API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/core/src/index.ts",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Docker Debugging

```bash
# Logs detallados
./scripts/docker-dev.sh logs core

# Shell en contenedor para inspección
./scripts/docker-dev.sh shell core

# Verificar red y conectividad
docker network inspect issueflow-dev-network
```

### Database Debugging

```bash
# Conectar a PostgreSQL
./scripts/docker-dev.sh db

# Comandos útiles en psql
\dt                    # Listar tablas
\d issues             # Describir tabla issues
SELECT * FROM issues LIMIT 10;
```

## 📊 Performance y Monitoring

### Análisis de Bundle

```bash
# Analizar tamaño de paquetes
npm run analyze:bundle

# Ver dependencias
npm run deps:analyze
```

### Memory y Resource Monitoring

```bash
# Ver uso de recursos Docker
docker stats

# Monitorear procesos Node
npm run monitor:processes
```

## 🚀 Release Process

### Versionado Automático

El proyecto usa **Changesets** para versionado automático:

```bash
# Crear changeset
npm run changeset

# Versionar paquetes
npm run version-packages

# Release
npm run release
```

### Manual Release

```bash
# 1. Actualizar versión
npm version patch  # o minor, major

# 2. Build completo
npm run build

# 3. Tests finales
npm test

# 4. Publicar
npm run release
```

## 🤝 Contribution Guidelines

### Antes de Contribuir

1. **Fork** el repositorio
2. **Crear issue** para discutir cambios grandes
3. **Seguir convenciones** de código
4. **Escribir tests** para nuevas funcionalidades
5. **Actualizar documentación** si es necesario

### Commit Convention

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: agregar nueva funcionalidad
fix: corregir bug específico
docs: actualizar documentación
style: cambios de formato
refactor: refactorizar código
test: agregar tests
chore: cambios de herramientas
```

### Code Review Process

1. **Self Review**: Revisar tu propio código
2. **Automated Checks**: CI debe pasar
3. **Peer Review**: Al menos 1 reviewer
4. **Final Testing**: Verificar en entorno Docker

## 📞 Soporte y Ayuda

### Canales de Comunicación

- **GitHub Issues**: Bugs y feature requests
- **GitHub Discussions**: Preguntas generales
- **Discord**: Chat en tiempo real
- **Stack Overflow**: Tag `issueflow`

### Troubleshooting

Ver [Troubleshooting Guide](./troubleshooting.md) para problemas comunes.

### Recursos Adicionales

- [API Reference](./api/README.md)
- [Architecture Decisions](./adr/README.md)
- [Performance Guidelines](./performance.md)