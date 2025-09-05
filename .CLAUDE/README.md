# 🤖 Agentes Especializados - IssueFlow Framework

Esta carpeta contiene los prompts y configuraciones para los agentes especializados que desarrollarán diferentes aspectos del framework IssueFlow.

## 📁 Estructura de Agentes

```
.CLAUDE/agents/
├── framework-architect/          # 🏛️ Arquitectura del sistema
├── cli-engineer/                # 🛠️ Herramientas CLI
├── sdk-developer/               # 📦 APIs y SDKs
├── plugin-system-architect/     # 🧩 Sistema de plugins
├── business-strategist/         # 💼 Estrategia de negocio
└── community-builder/           # 🌐 Comunidad y documentación
```

## 🎯 Cómo Activar un Agente

### Método 1: Comando Directo
```bash
# Ejemplos de activación
Claude actúa como FRAMEWORK_ARCHITECT según CLAUDE.md
Claude actúa como CLI_ENGINEER según CLAUDE.md
Claude actúa como SDK_DEVELOPER según CLAUDE.md
```

### Método 2: Referencia Específica
```bash
# Para trabajo específico
"Actúa como PLUGIN_SYSTEM_ARCHITECT y diseña el marketplace"
"Como BUSINESS_STRATEGIST, define pricing para enterprise"
"COMMUNITY_BUILDER: crea plan de lanzamiento en Product Hunt"
```

## 🏛️ FRAMEWORK_ARCHITECT

**Especialidad**: Arquitectura técnica y escalabilidad
**Entregables**: Sistema multi-tenant, APIs, seguridad
**Uso**: Decisiones arquitectónicas fundamentales

```bash
Claude actúa como FRAMEWORK_ARCHITECT según CLAUDE.md
```

## 🛠️ CLI_ENGINEER

**Especialidad**: Herramientas de desarrollo
**Entregables**: CLI tool, templates, automatización
**Uso**: Experiencia de desarrollador (DX)

```bash
Claude actúa como CLI_ENGINEER según CLAUDE.md
```

## 📦 SDK_DEVELOPER

**Especialidad**: APIs y integraciones
**Entregables**: REST/GraphQL APIs, SDKs multi-lenguaje
**Uso**: Capacidades de integración

```bash
Claude actúa como SDK_DEVELOPER según CLAUDE.md
```

## 🧩 PLUGIN_SYSTEM_ARCHITECT

**Especialidad**: Extensibilidad y marketplace
**Entregables**: Sistema de plugins, marketplace
**Uso**: Ecosistema de terceros

```bash
Claude actúa como PLUGIN_SYSTEM_ARCHITECT según CLAUDE.md
```

## 💼 BUSINESS_STRATEGIST

**Especialidad**: Estrategia comercial
**Entregables**: Pricing, go-to-market, competencia
**Uso**: Decisiones de negocio

```bash
Claude actúa como BUSINESS_STRATEGIST según CLAUDE.md
```

## 🌐 COMMUNITY_BUILDER

**Especialidad**: Comunidad y documentación
**Entregables**: Docs, GitHub, Discord, lanzamiento
**Uso**: Adopción y comunidad

```bash
Claude actúa como COMMUNITY_BUILDER según CLAUDE.md
```

## 🔄 Workflow de Desarrollo

### Fase 1: MVP (Mes 1-2)
1. **FRAMEWORK_ARCHITECT** → Diseño del sistema
2. **SDK_DEVELOPER** → APIs básicas
3. **CLI_ENGINEER** → Herramientas iniciales
4. **PLUGIN_SYSTEM_ARCHITECT** → Adapters React/Vue

### Fase 2: Community Launch (Mes 3)
1. **COMMUNITY_BUILDER** → Documentación y lanzamiento
2. **BUSINESS_STRATEGIST** → Pricing y landing page
3. **CLI_ENGINEER** → CLI production-ready
4. **PLUGIN_SYSTEM_ARCHITECT** → 5+ adapters oficiales

### Fase 3: SaaS Launch (Mes 4-5)
1. **FRAMEWORK_ARCHITECT** → Hosted version
2. **SDK_DEVELOPER** → GraphQL y webhooks
3. **BUSINESS_STRATEGIST** → Ejecución go-to-market
4. **PLUGIN_SYSTEM_ARCHITECT** → Marketplace beta

## 🎯 Estado Actual del Proyecto

### ✅ Completado
- [x] Definición del proyecto (CLAUDE.md)
- [x] Roadmap de desarrollo (roadmap.md)
- [x] Arquitectura conceptual (arquitectura.md)
- [x] Estructura de agentes (.CLAUDE/agents/)

### 🔄 En Progreso
- [ ] Setup inicial del proyecto
- [ ] Configuración monorepo
- [ ] Primer sprint de desarrollo

### 📅 Próximos Pasos
1. Activar **FRAMEWORK_ARCHITECT** para diseño técnico
2. Crear estructura del monorepo
3. Setup del environment de desarrollo
4. Primer adapter (React)

## 📝 Notas de Desarrollo

### Principios de Desarrollo
- **Iterativo**: MVPs rápidos con feedback constante
- **Community-first**: Open source desde día 1
- **Developer-centric**: DX como prioridad
- **Escalable**: Arquitectura preparada para growth

### Guidelines
- Todos los agentes siguen las especificaciones en CLAUDE.md
- Mantener consistencia entre componentes
- Documentar decisiones arquitectónicas
- Tests desde el inicio
- Security by design

---

**Versión**: 0.1.0  
**Última actualización**: 2025-09-05  
**Mantenido por**: Equipo IssueFlow