# 🤝 Contributing a IssueFlow

¡Gracias por tu interés en contribuir a IssueFlow! Esta guía te ayudará a empezar.

## 🎯 Formas de Contribuir

### 💻 Contribuciones de Código
- 🐛 **Bug fixes** - Corregir problemas existentes
- ✨ **Nuevas funcionalidades** - Implementar features del roadmap
- ⚡ **Mejoras de performance** - Optimizar código existente
- 🧪 **Tests** - Agregar o mejorar test coverage
- 📚 **Documentación** - Mejorar docs, examples, tutorials

### 🌟 Contribuciones de Comunidad
- 🐛 **Reportar bugs** - Usar issue templates
- 💡 **Sugerir funcionalidades** - Feature requests
- 💬 **Ayudar en Discord** - Responder preguntas
- 📝 **Escribir tutoriales** - Blog posts, videos
- 🎨 **Crear ejemplos** - Demos, templates
- 🔌 **Desarrollar plugins** - Community adapters

## 🚀 Setup para Desarrollo

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### 1. Fork y Clone
```bash
# Fork el repo en GitHub, luego:
git clone https://github.com/tu-usuario/issueflow.git
cd issueflow
```

### 2. Instalar Dependencias
```bash
# Instalar todas las dependencias del monorepo
npm install

# Verificar que todo funciona
npm run build
npm test
```

### 3. Development Setup
```bash
# Correr en modo development
npm run dev

# En otra terminal, correr tests en watch mode
npm run test:watch
```

### 4. Estructura del Proyecto
```
issueflow/
├── packages/
│   ├── core/              # Framework core
│   ├── cli/               # CLI tool
│   ├── react/             # React adapter
│   ├── vue/               # Vue adapter
│   ├── nextjs/            # Next.js adapter
│   ├── sdk/               # JavaScript SDK
│   └── dashboard/         # Management dashboard
├── examples/              # Example integrations
├── docs/                  # Documentation
└── .github/               # GitHub templates & workflows
```

## 📝 Development Workflow

### Branch Strategy
- **main** - Production ready code
- **develop** - Integration branch  
- **feature/your-feature** - Feature branches
- **fix/bug-description** - Bug fix branches

### 1. Crear Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-awesome-feature
```

### 2. Hacer Cambios
```bash
# Hacer tus cambios
# Seguir coding standards (ver abajo)

# Agregar tests
npm run test:watch

# Verificar que builds funcionan
npm run build
```

### 3. Commit Changes
Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Ejemplos de buenos commits:
git commit -m "feat(cli): add support for Vue 3 projects"
git commit -m "fix(react): resolve widget positioning issue" 
git commit -m "docs(readme): update installation instructions"
git commit -m "test(core): add integration tests for auth service"
```

**Tipos de commit:**
- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Formatting (no cambios de código)
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Mantenimiento

### 4. Push y Pull Request
```bash
git push origin feature/your-awesome-feature
```

Luego crear Pull Request en GitHub siguiendo el template.

## 🎨 Coding Standards

### TypeScript
- Usar TypeScript para todo el código
- Tipos explícitos donde sea necesario
- Seguir configuración ESLint/Prettier

### Code Style
```typescript
// ✅ Bueno
interface IssueFlowConfig {
  projectId: string;
  apiKey: string;
  theme?: 'light' | 'dark';
}

export class IssueFlowClient {
  private config: IssueFlowConfig;
  
  constructor(config: IssueFlowConfig) {
    this.config = config;
  }
  
  async createIssue(data: CreateIssueData): Promise<Issue> {
    // Implementation
  }
}

// ❌ Malo
export class issueFlowClient {
  config: any;
  constructor(config) {
    this.config = config;
  }
  createIssue(data) {
    // No types, no async handling
  }
}
```

### Testing
- Unit tests para toda funcionalidad nueva
- Integration tests para APIs
- E2E tests para flows críticos

```typescript
// Ejemplo de test
describe('IssueFlowClient', () => {
  it('should create issue with valid data', async () => {
    const client = new IssueFlowClient({
      projectId: 'test-project',
      apiKey: 'test-key'
    });
    
    const issue = await client.createIssue({
      title: 'Test issue',
      description: 'Test description'
    });
    
    expect(issue.id).toBeDefined();
    expect(issue.title).toBe('Test issue');
  });
});
```

### Documentation
- JSDoc para funciones públicas
- README para cada package
- Ejemplos de uso claros

```typescript
/**
 * Creates a new issue in the IssueFlow system
 * 
 * @param data - Issue data including title and description
 * @returns Promise that resolves to the created issue
 * 
 * @example
 * ```typescript
 * const issue = await client.createIssue({
 *   title: 'Bug in login form',
 *   description: 'Users cannot log in with valid credentials'
 * });
 * ```
 */
async createIssue(data: CreateIssueData): Promise<Issue> {
  // Implementation
}
```

## 🧪 Testing Guidelines

### Running Tests
```bash
# All tests
npm test

# Specific package
npm run test -- --filter=@issueflow/core

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Writing Tests
- Tests en `__tests__` folder o `.test.ts` files
- Mock external dependencies
- Test happy path y edge cases
- Coverage mínimo 80%

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Tests pasan localmente
- [ ] Build succeeds sin warnings
- [ ] Linting pasa
- [ ] Documentation actualizada
- [ ] Changelog entry agregado (si es necesario)

### PR Requirements
- **Título claro** describiendo los cambios
- **Descripción detallada** usando el template
- **Link a issue** si existe
- **Screenshots** para cambios de UI
- **Testing instructions** si es manual testing

### Review Process
1. **Automated checks** deben pasar (CI/CD)
2. **Code review** por maintainers
3. **Approval** y merge
4. **Release** (automático para patches)

## 🏷️ Release Process

### Semantic Versioning
- **Major (1.0.0)** - Breaking changes
- **Minor (0.1.0)** - New features (backward compatible)
- **Patch (0.0.1)** - Bug fixes

### Changesets
Usamos [changesets](https://github.com/changesets/changesets) para releases:

```bash
# Después de hacer cambios
npx changeset

# Seleccionar packages afectados
# Seleccionar tipo de cambio (major/minor/patch)
# Escribir descripción del cambio
```

## 🌟 Community Guidelines

### Code of Conduct
- **Ser respetuoso** con todos los contributors
- **Dar feedback constructivo** en reviews
- **Ayudar a newcomers** cuando sea posible
- **Mantener discusiones técnicas** enfocadas en el problema

### Getting Help
- 💬 **Discord** - [discord.gg/issueflow](https://discord.gg/issueflow) para chat rápido
- 🐛 **Issues** - Para bugs y feature requests
- 📧 **Email** - maintainers@issueflow.dev para temas privados

## 🎉 Recognition

### Contributors
- Todos los contributors aparecen en README
- Contributors destacados en releases
- Swag packages para contribuciones significativas
- Speaking opportunities en conferencias

### Maintainers
Contribuciones consistentes pueden llevar a:
- Commit access al repo
- Decision making en roadmap
- Representación en conferencias

---

## 💡 Ideas para Contribuir

¿No sabes por dónde empezar? Aquí hay algunas ideas:

### 🟢 Good First Issues
- Actualizar documentation typos
- Agregar unit tests faltantes  
- Implementar adapters para nuevos frameworks
- Mejorar error messages

### 🟡 Medium Issues  
- Nueva integración (Notion, Monday.com)
- CLI improvements
- Performance optimizations
- Advanced configuration options

### 🔴 Advanced Issues
- Plugin marketplace
- Real-time updates
- Advanced analytics
- Enterprise features

**¡Revisa los [issues con label "good first issue"](https://github.com/yosnap/issueflow/labels/good%20first%20issue) para empezar!**

---

¡Gracias por contribuir a IssueFlow! 🚀