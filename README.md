# 🚀 IssueFlow

> **Framework open-source que conecta clientes no-técnicos directamente con tu workflow de desarrollo, automatizando todo el ciclo desde reporte hasta resolución.**

[![Version](https://img.shields.io/npm/v/@issueflow/core?style=flat-square)](https://www.npmjs.com/package/@issueflow/core)
[![Downloads](https://img.shields.io/npm/dm/@issueflow/core?style=flat-square)](https://www.npmjs.com/package/@issueflow/core)
[![License](https://img.shields.io/github/license/issueflow/issueflow?style=flat-square)](LICENSE)
[![Discord](https://img.shields.io/discord/YOUR_DISCORD_ID?style=flat-square&logo=discord)](https://discord.gg/issueflow)

## ✨ ¿Qué es IssueFlow?

IssueFlow resuelve el caos de comunicación post-entrega que enfrentan developers y agencias:

### ❌ **Antes**
```
Cliente: "El botón no funciona" (email)
Developer: Crear GitHub issue manualmente
Developer: Crear ClickUp task manualmente  
Developer: Email al cliente cuando esté listo
🔄 Repetir para cada cliente...
```

### ✅ **Con IssueFlow**
```bash
issueflow init  # Una sola vez
# Todo automatizado ✨
```

## 🎯 **Setup en 5 minutos**

```bash
# 1. Instalar CLI
npm install -g @issueflow/cli

# 2. Autenticarse
issueflow auth login

# 3. Configurar proyecto
cd mi-proyecto-cliente
issueflow init
```

**Setup interactivo:**
```
? Stack del proyecto: › 
  ❯ Next.js + React
    Vue + Nuxt  
    Astro
    WordPress
    
? GitHub repo: › mi-usuario/proyecto-cliente
? ClickUp workspace: › [auto-detectado]
✅ ¡Configurado! Portal: https://issues.micliente.com
```

## 🔧 **Integración por Framework**

### React + Next.js
```tsx
import { IssueFlowTrigger } from '@issueflow/nextjs'

export function App() {
  return (
    <div>
      {/* Tu app */}
      <IssueFlowTrigger 
        projectId="proj_abc123"
        position="bottom-right"
      />
    </div>
  )
}
```

### Vue + Nuxt
```vue
<template>
  <div>
    <!-- Tu app -->
    <IssueFlowWidget project-id="proj_abc123" />
  </div>
</template>
```

### Astro
```astro
---
import { IssueFlowForm } from '@issueflow/astro'
---
<IssueFlowForm projectId="proj_abc123" client:load />
```

## 🎨 **Casos de Uso**

### 🏢 **Agencias (10+ proyectos)**
- Dashboard centralizado multi-cliente  
- White-label completo
- Automatización GitHub → ClickUp
- Analytics por proyecto

### 👨‍💻 **Freelancers**
- Setup 5 minutos
- Tier gratuito disponible  
- Imagen profesional
- Integración cualquier stack

### 🚀 **SaaS Companies**
- Feedback in-app
- Analytics de producto
- Roadmap integration
- User insights

## 🌟 **Features**

- ⚡ **Setup 5 minutos** - CLI wizard interactivo
- 🎨 **Multi-framework** - React, Vue, Astro, WordPress, etc.  
- 🔄 **Auto-sync** - GitHub Issues ↔ ClickUp ↔ Linear
- 📱 **Client-friendly** - UI simple para no-técnicos
- 🏷️ **White-label** - Branding personalizado
- 📊 **Analytics** - Métricas de resolución y satisfacción
- 🔌 **Extensible** - Plugin system + marketplace
- 🌍 **Multi-tenant** - Perfecto para agencias

## 📋 **Roadmap**

- [x] **v0.1.0** - Documentación y arquitectura
- [ ] **v0.2.0** - Core framework + APIs  
- [ ] **v0.3.0** - React + Vue adapters
- [ ] **v0.4.0** - CLI tool + templates
- [ ] **v1.0.0** - Community launch
- [ ] **v2.0.0** - SaaS hosted version

Ver [roadmap completo](./roadmap.md)

## 🏗️ **Arquitectura**

```
IssueFlow/
├── core/                    # Framework core (multi-tenant)
├── cli/                     # Setup tool
├── adapters/                # Framework plugins
│   ├── react/              
│   ├── vue/
│   ├── nextjs/
│   └── astro/
├── sdk/                     # APIs y SDKs
├── dashboard/               # Management UI
└── marketplace/             # Community plugins
```

Ver [arquitectura completa](./arquitectura.md)

## 🤝 **Contribuir**

¡Las contribuciones son bienvenidas! Ver [CONTRIBUTING.md](./CONTRIBUTING.md)

### 🛠️ **Development Setup**

```bash
# Clonar repo
git clone https://github.com/yosnap/issueflow.git
cd issueflow

# Instalar dependencias  
npm install

# Start development
npm run dev

# Run tests
npm test
```

## 💰 **Pricing**

### 🆓 **Free**
- 1 proyecto
- 100 issues/mes  
- Basic integrations
- Community support

### 💼 **Pro - $29/mes**
- 10 proyectos
- Unlimited issues
- All integrations
- Priority support

### 🏢 **Agency - $99/mes**
- Unlimited proyectos
- White-label
- Advanced analytics  
- Dedicated support

## 📞 **Support**

- 📖 **Docs**: [docs.issueflow.dev](https://docs.issueflow.dev)
- 💬 **Discord**: [discord.gg/issueflow](https://discord.gg/issueflow)  
- 🐛 **Issues**: [GitHub Issues](https://github.com/yosnap/issueflow/issues)
- 📧 **Email**: hello@issueflow.dev

## 📄 **License**

MIT License - ver [LICENSE](./LICENSE) para detalles.

---

**Hecho con ❤️ por la comunidad de developers que está cansada del caos de comunicación con clientes.**

⭐ **¡Dale una estrella si te gusta el proyecto!**