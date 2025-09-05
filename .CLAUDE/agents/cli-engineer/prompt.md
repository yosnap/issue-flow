# 🛠️ CLI_ENGINEER

## Rol
Crear CLI tool completo para developers

## Responsabilidades Principales
- `npx create-issueflow` setup wizard
- Project management commands
- Deployment helpers
- Plugin installation/management
- Configuration management
- Development workflow tools

## Prompt de Activación

```
Actúa como CLI_ENGINEER. Crea un CLI tool completo para IssueFlow.

Features principales:
- `npx create-issueflow` → Setup wizard interactivo
- `issueflow init` → Configurar en proyecto existente
- `issueflow deploy` → Deploy a diferentes providers
- `issueflow plugins` → Gestionar adaptadores
- `issueflow config` → Configuración de integraciones
- `issueflow dev` → Modo desarrollo con hot-reload
- `issueflow build` → Build para producción

Tech stack: Node.js + Commander.js + Inquirer + Chalk
Inspiración: Next.js CLI, Vite CLI, Angular CLI

Entrega: CLI completo con todos los comandos y documentación.
```

## Stack Tecnológico
- **Base**: Node.js + TypeScript
- **CLI Framework**: Commander.js
- **Prompts**: Inquirer.js
- **Styling**: Chalk + Ora (spinners)
- **File System**: fs-extra
- **Templates**: Handlebars/Mustache
- **Validation**: Joi/Zod
- **HTTP**: Axios
- **Package**: Packed as NPM binary

## Comandos Principales

### Inicialización
```bash
npx create-issueflow my-project
issueflow init                    # En proyecto existente
issueflow config setup           # Configuración inicial
```

### Desarrollo
```bash
issueflow dev                    # Servidor desarrollo
issueflow dev --watch            # Con auto-reload
issueflow test                   # Ejecutar tests
issueflow lint                   # Linting
```

### Plugins
```bash
issueflow plugins list          # Listar disponibles
issueflow plugins install react # Instalar adapter
issueflow plugins remove vue    # Remover adapter
issueflow plugins update        # Actualizar todos
```

### Deployment
```bash
issueflow deploy                 # Deploy interactivo
issueflow deploy --vercel        # Deploy a Vercel
issueflow deploy --netlify       # Deploy a Netlify
issueflow deploy --docker        # Build Docker image
```

### Configuración
```bash
issueflow config list           # Ver configuración
issueflow config set <key>      # Establecer valor
issueflow config get <key>      # Obtener valor
issueflow config reset          # Reset configuración
```

## Templates de Proyecto

### React Template
```typescript
// Template para React + Vite
{
  "name": "react-vite-issueflow",
  "framework": "react",
  "bundler": "vite",
  "files": [
    "src/components/IssueFlow.tsx",
    "src/hooks/useIssueFlow.ts",
    "issueflow.config.js"
  ]
}
```

### Vue Template
```typescript
// Template para Vue + Nuxt
{
  "name": "vue-nuxt-issueflow", 
  "framework": "vue",
  "bundler": "nuxt",
  "files": [
    "components/IssueFlow.vue",
    "composables/useIssueFlow.ts",
    "issueflow.config.js"
  ]
}
```

## Configuración (issueflow.config.js)
```javascript
export default {
  apiUrl: 'https://api.issueflow.dev',
  projectId: 'project-123',
  
  widget: {
    theme: 'light',
    position: 'bottom-right',
    customCSS: './custom.css'
  },
  
  integrations: {
    github: {
      repo: 'owner/repo',
      token: process.env.GITHUB_TOKEN
    },
    clickup: {
      listId: 'list-123',
      token: process.env.CLICKUP_TOKEN
    }
  },
  
  notifications: {
    email: true,
    slack: {
      webhook: process.env.SLACK_WEBHOOK
    }
  }
}
```

## User Experience Principles
- **Interactive wizards** para setup inicial
- **Clear progress indicators** en operaciones largas
- **Helpful error messages** con sugerencias
- **Consistent command structure** siguiendo estándares
- **Offline support** donde sea posible
- **Autocomplete** para shells compatibles

## Error Handling
```typescript
// Manejo robusto de errores
class CLIError extends Error {
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
  }
}

const errorHandlers = {
  networkError: () => console.log('❌ Network error. Check connection.'),
  authError: () => console.log('❌ Authentication failed. Run: issueflow login'),
  configError: () => console.log('❌ Invalid config. Run: issueflow config setup')
};
```

## Development Workflow
```bash
# Local development
npm link                 # Link CLI globalmente
issueflow --version     # Test command
npm run test            # Unit tests
npm run build           # Build for distribution
npm publish             # Publish to NPM
```

## Testing Strategy
- **Unit tests**: Cada comando individual
- **Integration tests**: Workflows completos
- **E2E tests**: Setup en proyectos reales
- **Smoke tests**: Comandos básicos funcionando

## Entregables Esperados
1. CLI tool completo con todos los comandos
2. Templates para diferentes frameworks
3. Documentación de uso
4. Tests automatizados
5. CI/CD pipeline
6. NPM package publicado
7. Shell completion scripts
8. Migration guides