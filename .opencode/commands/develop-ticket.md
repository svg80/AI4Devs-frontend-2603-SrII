---
description: Develops a ticket/subtask via the frontend-dev agent and generates a PR description in task/pr_description.md.
agent: frontend-dev
---

Eres un agente de desarrollo frontend. Tu tarea es implementar un ticket y generar una descripción de PR lista para revisión.

## Flujo de trabajo

1. **Lee el ticket entrante** — El ticket se pasa como `$ARGUMENTS` (o `$1`). Si no se proporciona una ruta, lista el contenido de `task/` y pregunta al usuario qué ticket desarrollar.

2. **Carga el contexto del proyecto** — Antes de desarrollar, lee:
   - `.opencode/rules/` — todas las reglas del proyecto (lenguaje, epic LTI, documentación Swagger).
   - `AGENTS.md` — convenciones del repo y comandos disponibles.
   - Componentes existentes en `frontend/src/` — entiende los patrones actuales.

3. **Desarrolla el ticket** — Implementa la solución siguiendo los criterios de aceptación del ticket. Para implementación frontend, carga el skill `frontend-senior` vía la herramienta `skill` y delega todo el trabajo. Asegura que:
   - Todos los criterios de aceptación se cumplen.
   - Los tests están escritos y pasan.
   - Lint y typecheck pasan (`cd frontend && npm run lint && npx tsc --noEmit`).
   - La funcionalidad existente no se rompe.

4. **Genera la descripción del PR** — Después del desarrollo, escribe o actualiza `task/pr_description.md` con la siguiente estructura:

   ```markdown
   # PR: <Título del Ticket>

   ## Resumen
   <descripción de un párrafo de lo implementado y por qué>

   ## Cambios
   | Archivo | Descripción |
   |---|---|
   | `<ruta>` | <qué cambió y por qué> |
   | `<ruta>` | <qué cambió y por qué> |

   ## Criterios de aceptación
   - [ ] <criterio 1> — <cómo se cumplió o evidencia>
   - [ ] <criterio 2> — <cómo se cumplió o evidencia>

   ## Testing
   - <framework de tests usado>
   - <aspectos destacados de cobertura>
   - <cómo ejecutar los tests>

   ## Notas para revisores
   <cualquier cosa a la que los revisores deben prestar atención>
   ```

5. **Preserva descripciones de PR existentes** — Si `task/pr_description.md` ya existe y el nuevo ticket es una adición a un PR en curso, añade los nuevos cambios al archivo existente en lugar de sobrescribirlo.

6. **Verificación final** — Antes de terminar:
   - Confirma que todos los criterios de aceptación están cubiertos en el código y reflejados en la descripción del PR.
   - Ejecuta lint y typecheck una última vez.
   - Asegura que `task/pr_description.md` existe y está correctamente formateado.

## Formato de respuesta

- Entrega un resumen de lo implementado, los archivos modificados y la ubicación de la PR description.
- Si encuentras problemas (tests fallando, lint errors, criterios no cubiertos), notifícalo antes de dar la tarea por terminada.
