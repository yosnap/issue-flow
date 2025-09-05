# IssueFlow Framework

<div align="center">

![IssueFlow Logo](https://via.placeholder.com/200x200?text=IssueFlow)

**Sistema completo de gestión de feedback y tracking de issues para aplicaciones web modernas**

[![npm version](https://img.shields.io/npm/v/@issueflow/sdk?style=flat-square)](https://npmjs.com/package/@issueflow/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg?style=flat-square)](http://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/issueflow/issueflow/ci.yml?style=flat-square)](https://github.com/issueflow/issueflow/actions)
[![Discord](https://img.shields.io/discord/1234567890?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/issueflow)

[Documentación](./docs) • [Demo](https://demo.issueflow.dev) • [Discord](https://discord.gg/issueflow)

</div>

## 🚀 ¿Qué es IssueFlow?

IssueFlow es un framework completo y moderno para la gestión de feedback de usuarios y tracking de issues en aplicaciones web. Diseñado para ser **framework-agnostic**, ofrece adapters nativos para los principales frameworks de frontend.

### ✨ Características Principales

- 🎯 **Multi-Framework**: Adapters para Vue, React/Next.js, Angular, Svelte
- 🔧 **Plug & Play**: Configuración mínima, máxima funcionalidad
- 🎨 **Totalmente Personalizable**: Temas, estilos y comportamientos
- 📱 **Responsive**: Optimizado para desktop y móvil
- 🌐 **SSR Ready**: Soporte nativo para renderizado del lado del servidor
- 🔒 **Seguro**: Validación robusta y protección CSRF
- ♿ **Accesible**: Cumplimiento WCAG 2.1
- 🧪 **Testeado**: Suite completa de tests automatizados
- 📊 **Analytics**: Métricas detalladas de feedback
- 🌍 **i18n Ready**: Preparado para internacionalización

## 📦 Instalación Rápida

### Core SDK
```bash
npm install @issueflow/sdk
```

### Adapters por Framework

#### Vue 3
```bash
npm install @issueflow/vue
```

#### Next.js
```bash
npm install @issueflow/nextjs
```

#### Angular 15+
```bash
npm install @issueflow/angular
```

#### Svelte 4+
```bash
npm install @issueflow/svelte
```

## 🏁 Inicio Rápido

### Vue 3
```vue
<template>
  <div>
    <!-- Tu app -->
    <IssueFlowWidget :config="config" />
  </div>
</template>

<script setup>
import { IssueFlowWidget } from '@issueflow/vue'

const config = {
  projectId: 'tu-proyecto-id',
  apiUrl: 'https://api.tu-dominio.com/issueflow'
}
</script>
```

### Next.js
```tsx
import { IssueFlowProvider, IssueFlowWidget } from '@issueflow/nextjs'

export default function App() {
  const config = {
    projectId: 'tu-proyecto-id',
    apiUrl: 'https://api.tu-dominio.com/issueflow'
  }

  return (
    <IssueFlowProvider config={config}>
      <div>
        {/* Tu app */}
        <IssueFlowWidget />
      </div>
    </IssueFlowProvider>
  )
}
```

### Angular
```typescript
// app.module.ts
import { IssueFlowModule } from '@issueflow/angular'

@NgModule({
  imports: [
    IssueFlowModule.forRoot({
      projectId: 'tu-proyecto-id',
      apiUrl: 'https://api.tu-dominio.com/issueflow'
    })
  ]
})
export class AppModule { }
```

```html
<!-- app.component.html -->
<div>
  <!-- Tu app -->
  <if-widget></if-widget>
</div>
```

### Svelte
```svelte
<script>
  import { IssueFlowWidget } from '@issueflow/svelte'
  
  const config = {
    projectId: 'tu-proyecto-id',
    apiUrl: 'https://api.tu-dominio.com/issueflow'
  }
</script>

<div>
  <!-- Tu app -->
  <IssueFlowWidget {config} />
</div>
```

## 🏗️ Arquitectura del Proyecto

```
issue-flow/
├── packages/
│   ├── sdk/              # Core SDK
│   ├── server/           # Backend services
│   ├── cli/              # CLI tool
│   ├── vue/              # Vue 3 adapter
│   ├── nextjs/           # Next.js adapter
│   ├── angular/          # Angular adapter
│   └── svelte/           # Svelte adapter
├── apps/
│   ├── dashboard/        # Admin dashboard
│   ├── docs/             # Documentation site
│   └── examples/         # Example implementations
└── docs/                 # Documentation
```

## 📚 Documentación Completa

### Guías de Inicio
- [Configuración Inicial](./docs/getting-started.md)
- [Conceptos Básicos](./docs/concepts.md)
- [Configuración Avanzada](./docs/advanced-config.md)

### Adapters
- [Comparativa de Adapters](./docs/adapters.md)
- [Vue 3 Guide](./docs/adapters/vue.md)
- [Next.js Guide](./docs/adapters/nextjs.md)
- [Angular Guide](./docs/adapters/angular.md)
- [Svelte Guide](./docs/adapters/svelte.md)

### Backend
- [Server Setup](./docs/server/setup.md)
- [API Reference](./docs/server/api.md)
- [Database Schema](./docs/server/database.md)

### Desarrollo
- [Contributing Guide](./CONTRIBUTING.md)
- [Development Setup](./docs/development.md)
- [Release Process](./docs/release.md)

## 🎨 Personalización

### Configuración de Tema
```typescript
const config = {
  projectId: 'mi-proyecto',
  apiUrl: 'https://api.ejemplo.com/issueflow',
  theme: {
    mode: 'auto', // 'light' | 'dark' | 'auto'
    primaryColor: '#3b82f6',
    borderRadius: '0.5rem',
    fontFamily: 'system-ui, sans-serif'
  },
  behavior: {
    requireEmail: true,
    allowFileUploads: true,
    maxAttachmentSize: 10485760, // 10MB
    captureConsoleErrors: true
  }
}
```

### Campos Personalizados
```typescript
const customFields = [
  {
    name: 'browser',
    label: 'Navegador',
    type: 'select',
    required: true,
    options: [
      { label: 'Chrome', value: 'chrome' },
      { label: 'Firefox', value: 'firefox' },
      { label: 'Safari', value: 'safari' }
    ]
  },
  {
    name: 'reproduce_steps',
    label: 'Pasos para Reproducir',
    type: 'textarea',
    required: false,
    placeholder: 'Describe los pasos...'
  }
]
```

## 🌟 Casos de Uso

### E-commerce
- Feedback de productos
- Reportes de bugs en checkout
- Solicitudes de características
- Problemas de envío

### SaaS Applications  
- Feature requests de usuarios
- Bug reports técnicos
- Feedback de UX/UI
- Issues de integración

### Corporate Websites
- Feedback de contenido
- Problemas técnicos
- Solicitudes de información
- Reportes de accesibilidad

### Educational Platforms
- Feedback de cursos
- Issues técnicos
- Solicitudes de mejora
- Reportes de contenido

## 📈 Roadmap

### Q4 2024 ✅
- [x] Core SDK v0.1.0
- [x] Vue 3 Adapter
- [x] Next.js Adapter  
- [x] Angular Adapter
- [x] Svelte Adapter
- [x] Documentación completa

### Q1 2025
- [ ] React Native Adapter
- [ ] Flutter Integration
- [ ] Advanced Analytics Dashboard
- [ ] Real-time Notifications

### Q2 2025
- [ ] AI-Powered Issue Classification
- [ ] Multi-tenant Support
- [ ] Advanced Workflow Automation
- [ ] Enterprise SSO Integration

### Q3 2025
- [ ] Mobile SDK
- [ ] Desktop Electron Integration
- [ ] Advanced Reporting
- [ ] Third-party Integrations (Jira, Linear, etc.)

## 🤝 Comunidad y Soporte

### Comunidad
- [Discord Server](https://discord.gg/issueflow)
- [GitHub Discussions](https://github.com/issueflow/issueflow/discussions)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/issueflow)

### Soporte Comercial
- [Enterprise Support](https://issueflow.dev/enterprise)
- [Consulting Services](https://issueflow.dev/consulting)
- [Training Programs](https://issueflow.dev/training)

### Contributing
¡Las contribuciones son bienvenidas! Lee nuestra [Contributing Guide](./CONTRIBUTING.md) para comenzar.

### 🛠️ Development Setup

#### Desarrollo Local
```bash
# Clonar repositorio
git clone https://github.com/issueflow/issueflow.git
cd issueflow

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Ejecutar tests
npm test
```

#### Desarrollo con Docker 🐳

Para un setup completo con base de datos y servicios:

```bash
# Setup automático con Docker
./scripts/docker-setup.sh

# Comandos disponibles
npm run docker:up        # Iniciar todos los servicios
npm run docker:down      # Parar servicios
npm run docker:dev       # Entorno de desarrollo
npm run docker:logs      # Ver logs

# Script de desarrollo interactivo
./scripts/docker-dev.sh start    # Iniciar desarrollo
./scripts/docker-dev.sh logs     # Ver logs
./scripts/docker-dev.sh shell    # Abrir shell en contenedor
```

Ver la [Guía Completa de Docker](./docs/docker.md) para más detalles.

## 🙏 Agradecimientos

IssueFlow está construido sobre los hombros de gigantes. Agradecemos a:

- **Open Source Community**: Por las increíbles herramientas y librerías
- **Framework Teams**: Vue, React, Angular, Svelte por sus ecosistemas
- **Contributors**: Todos los que han contribuido código, docs, y feedback
- **Early Adopters**: Por confiar en IssueFlow y proporcionar feedback valioso

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para más detalles.

---

<div align="center">

**¿Te gusta IssueFlow?** ⭐ Dale una estrella en GitHub y síguenos para updates!

[Website](https://issueflow.dev) • [Docs](./docs) • [Demo](https://demo.issueflow.dev) • [Blog](https://issueflow.dev/blog)

</div>