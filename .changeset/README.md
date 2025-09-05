# Changesets

Hola y bienvenido! Este folder ha sido generado automáticamente por `@changesets/cli`, una build tool que funciona con multi-package repos, o single-package repos para ayudar con versioning y publishing de código.

## ¿Qué son changesets?

Un changeset es un piece de información sobre cambios hechos en un repo. El changeset tiene:
- una descripción de los cambios
- una lista de packages que cambian
- una versión bump para cada package (siguiendo semver)

## ¿Cuándo necesito hacer un changeset?

Necesitas hacer changesets cuando has hecho cambios que deberían estar documentados en un changelog y liberados. Para IssueFlow, esto incluye:

- ✨ **Nueva funcionalidad** - Minor version bump
- 🐛 **Bug fixes** - Patch version bump  
- 💥 **Breaking changes** - Major version bump
- 📚 **Documentación** - No requiere changeset
- 🧪 **Tests internos** - No requiere changeset
- 🎨 **Code styling** - No requiere changeset

## ¿Cómo hago un changeset?

1. Ejecutar `npx changeset` en la root del repo
2. Seleccionar los packages que han cambiado
3. Seleccionar el tipo de bump apropiado
4. Escribir una descripción clara de los cambios
5. Commit el changeset file

### Ejemplo:

```bash
# Después de hacer cambios al core y CLI
npx changeset

# Seleccionar packages:
# ✅ @issueflow/core
# ✅ @issueflow/cli
# ❌ @issueflow/react (no changes)

# Seleccionar bump type:
# @issueflow/core - minor (nueva feature)
# @issueflow/cli - patch (bug fix)

# Escribir descripción:
# "Add support for custom webhooks in core, fix CLI setup bug"

# Esto crea un file en .changeset/ que commiteas
git add .changeset/
git commit -m "chore: add changeset for webhook support"
```

## ¿Cómo se publican los releases?

Los releases se manejan automáticamente:

1. **Pull Request** - Changesets crea un "Release PR" automáticamente
2. **Review** - Maintainers revisan los changes y changelog
3. **Merge** - Al hacer merge, se publican automáticamente a NPM
4. **GitHub Release** - Se crea automáticamente con changelog

## Ejemplo de workflow completo:

```bash
# 1. Desarrollar feature
git checkout -b feature/webhook-support
# ... make changes to packages/core/

# 2. Crear changeset
npx changeset
# Select core package, minor bump, describe changes

# 3. Commit y push
git add .
git commit -m "feat(core): add webhook support"
git push origin feature/webhook-support

# 4. Create PR
# GitHub PR gets created

# 5. Después del merge a main
# - Changeset bot crea "Release PR" 
# - Maintainers revisan y mergen
# - Packages se publican automáticamente
# - GitHub release se crea automáticamente
```

Esto mantiene el versioning consistente y automatiza el release process. 🚀