# IssueFlow Framework Adapters

Esta documentación describe todos los adapters disponibles para integrar IssueFlow con diferentes frameworks y tecnologías de frontend.

## Adapters Disponibles

| Framework | Package | Status | Descripción |
|-----------|---------|--------|-------------|
| Vue 3 | `@issueflow/vue` | ✅ Completo | Adapter para Vue 3 con Composition API |
| Next.js | `@issueflow/nextjs` | ✅ Completo | Adapter para Next.js con SSR/SSG |
| Angular | `@issueflow/angular` | ✅ Completo | Adapter para Angular 15+ |
| Svelte | `@issueflow/svelte` | ✅ Completo | Adapter para Svelte 4+ y SvelteKit |

## Características Comunes

Todos los adapters de IssueFlow comparten las siguientes características:

### 🎯 Funcionalidades Core
- **Widget de Feedback**: Componente completo para recolección de feedback
- **Gestión de Estado**: Manejo reactivo del estado global
- **Configuración Flexible**: Opciones extensas de personalización
- **Tipos TypeScript**: Tipado completo para mejor DX
- **SSR Support**: Soporte para renderizado del lado del servidor
- **Temas Dinámicos**: Sistema de temas adaptable
- **Validación de Formularios**: Validación robusta del lado cliente
- **Archivos Adjuntos**: Soporte para subida de archivos
- **Campos Personalizados**: Campos dinámicos configurables

### 🔧 Características Técnicas
- **Tree Shaking**: Optimización de bundle
- **TypeScript First**: Desarrollado con TypeScript nativo
- **Accesibilidad**: Cumplimiento WCAG 2.1
- **Responsive Design**: Diseño adaptativo móvil-first
- **Internacionalización**: Preparado para i18n
- **Testing Utilities**: Herramientas para testing

## Comparación de Adapters

### Vue 3 (`@issueflow/vue`)

```vue
<template>
  <IssueFlowWidget 
    :config="config" 
    position="bottom-right"
    @issue-submitted="handleSubmitted"
  />
</template>

<script setup>
import { IssueFlowWidget, useIssueFlow } from '@issueflow/vue'

const config = { /* ... */ }
const { submitIssue, isLoading } = useIssueFlow({ config })
</script>
```

**Características específicas:**
- Composition API nativo
- Plugin de Vue con provide/inject
- Compatibilidad con Vue Router y Vuex/Pinia
- Vue DevTools integration
- Teleport para modales

### Next.js (`@issueflow/nextjs`)

```tsx
import { IssueFlowWidget, IssueFlowProvider } from '@issueflow/nextjs'

export default function App() {
  return (
    <IssueFlowProvider config={config}>
      <IssueFlowWidget position="bottom-right" />
    </IssueFlowProvider>
  )
}

// SSR Support
export const getServerSideProps = withIssueFlowSSR(config)
```

**Características específicas:**
- React Context API
- SSR/SSG helpers
- App Router y Pages Router support
- API routes integradas
- Middleware integration
- Edge Runtime compatibility

### Angular (`@issueflow/angular`)

```typescript
// app.module.ts
import { IssueFlowModule } from '@issueflow/angular'

@NgModule({
  imports: [
    IssueFlowModule.forRoot(config)
  ]
})

// component.html
<if-widget 
  [config]="config"
  position="bottom-right"
  (issueSubmitted)="onSubmit($event)">
</if-widget>
```

**Características específicas:**
- Dependency Injection
- RxJS Observables
- Angular Material integration
- Standalone components support
- Guards y Interceptors
- Angular DevTools

### Svelte (`@issueflow/svelte`)

```svelte
<script>
  import { IssueFlowWidget, getIssueFlowStore } from '@issueflow/svelte'
  
  const store = getIssueFlowStore({ config })
</script>

<IssueFlowWidget 
  {config} 
  position="bottom-right"
  on:issue-submitted={handleSubmit}
/>

<!-- O usando actions -->
<div use:issueflow={config}>
  <button use:widgetTrigger>Open Feedback</button>
</div>
```

**Características específicas:**
- Svelte stores nativas
- Actions personalizadas
- SvelteKit support
- Transiciones integradas
- No virtual DOM overhead
- Compilación optimizada

## Guía de Instalación Rápida

### Vue 3
```bash
npm install @issueflow/vue
```

### Next.js
```bash
npm install @issueflow/nextjs
```

### Angular
```bash
npm install @issueflow/angular
```

### Svelte
```bash
npm install @issueflow/svelte
```

## Configuración Común

Todos los adapters comparten la misma interfaz de configuración base:

```typescript
interface IssueFlowConfig {
  // Configuración básica
  projectId: string
  apiUrl: string
  apiKey?: string
  
  // Configuración UI
  theme?: {
    mode?: 'light' | 'dark' | 'auto'
    primaryColor?: string
    borderRadius?: string
  }
  
  // Comportamiento
  behavior?: {
    requireEmail?: boolean
    allowFileUploads?: boolean
    maxAttachmentSize?: number
    captureConsoleErrors?: boolean
  }
  
  // Integrations
  integrations?: {
    analytics?: boolean
    crashReporting?: boolean
  }
}
```

## Patrones de Implementación

### 1. Plugin/Module Pattern
Cada adapter sigue el patrón de plugin/module nativo del framework:

- **Vue**: Plugin con `app.use()`
- **Next.js**: Provider pattern con Context
- **Angular**: NgModule con `forRoot()`
- **Svelte**: Stores globales

### 2. State Management
Gestión de estado específica para cada framework:

- **Vue**: `ref()`, `reactive()`, `computed()`
- **Next.js**: React hooks y Context
- **Angular**: Services con RxJS
- **Svelte**: Writable y derived stores

### 3. Server-Side Rendering
Soporte nativo para SSR en frameworks compatibles:

- **Next.js**: `getServerSideProps`, `getStaticProps`
- **Angular**: Angular Universal
- **Svelte**: SvelteKit load functions
- **Vue**: Nuxt.js ready

## Mejores Prácticas

### 🚀 Performance
1. **Lazy Loading**: Carga diferida de componentes
2. **Tree Shaking**: Importación selectiva
3. **Bundle Splitting**: Separación de código
4. **Caching**: Estrategias de cache inteligentes

### 🔒 Seguridad
1. **Input Sanitization**: Validación y sanitización
2. **CSRF Protection**: Protección contra CSRF
3. **Rate Limiting**: Límites de velocidad
4. **Content Security Policy**: CSP headers

### ♿ Accesibilidad
1. **ARIA Labels**: Etiquetas ARIA completas
2. **Keyboard Navigation**: Navegación por teclado
3. **Screen Reader Support**: Soporte para lectores
4. **Focus Management**: Gestión de foco

### 🧪 Testing
1. **Unit Tests**: Tests unitarios completos
2. **Integration Tests**: Tests de integración
3. **E2E Tests**: Tests end-to-end
4. **Mock Utilities**: Utilidades de mock

## Migración Entre Adapters

### De Vue a Next.js
```diff
- import { useIssueFlow } from '@issueflow/vue'
+ import { useIssueFlow } from '@issueflow/nextjs'

- const { submitIssue } = useIssueFlow()
+ const { submitIssue } = useIssueFlow()
```

### De Angular a Svelte
```diff
- @Component({})
- export class MyComponent {
-   constructor(private issueFlow: IssueFlowService) {}
- }

+ <script>
+   import { getIssueFlowStore } from '@issueflow/svelte'
+   const store = getIssueFlowStore()
+ </script>
```

## Roadmap

### 🔮 Próximos Adapters
- **React Native**: Mobile support
- **Flutter**: Cross-platform mobile
- **Electron**: Desktop applications
- **Web Components**: Framework agnostic

### 🆕 Nuevas Características
- **Real-time Updates**: WebSocket integration
- **Offline Support**: PWA capabilities
- **Advanced Analytics**: Comportamiento de usuario
- **AI Integration**: Categorización automática

## Soporte y Contribución

### 📖 Documentación Específica
- [Vue Adapter Guide](./vue.md)
- [Next.js Adapter Guide](./nextjs.md) 
- [Angular Adapter Guide](./angular.md)
- [Svelte Adapter Guide](./svelte.md)

### 🤝 Contribuir
1. Fork del repositorio
2. Crear branch de feature
3. Implementar cambios con tests
4. Enviar Pull Request

### 🐛 Reportar Issues
- [GitHub Issues](https://github.com/issueflow/issueflow/issues)
- [Discord Community](https://discord.gg/issueflow)

## Licencia

Todos los adapters están bajo la licencia MIT. Ver [LICENSE](../LICENSE) para más detalles.

---

**¿Necesitas ayuda?** Consulta la documentación específica de cada adapter o únete a nuestra comunidad en Discord.