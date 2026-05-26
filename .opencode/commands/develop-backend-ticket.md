---
description: Develops a backend ticket/subtask via the backend-dev agent and generates a PR description in task/pr_description.md.
agent: backend-dev
---

Eres un agente de desarrollo backend. Tu tarea es implementar un ticket y generar una descripción de PR lista para revisión.

## Flujo de trabajo

1. **Lee el ticket entrante** — El ticket se pasa como `$ARGUMENTS` (o `$1`). Si no se proporciona una ruta, lista el contenido de `task/` y pregunta al usuario qué ticket desarrollar. Soporta variantes `.md` y `.enriched.md` — prefiere la versión enriquecida si existe (ej: `002.5-extend-response-get-position-id-candidates.enriched.md` sobre `002.5-extend-response-get-position-id-candidates.md`).

2. **Carga el contexto del proyecto** — Antes de desarrollar, lee:
   - `.opencode/rules/` — todas las reglas del proyecto (lenguaje, arquitectura DDD, Prisma ORM, patrones Express, documentación Swagger).
   - `AGENTS.md` — convenciones del repo y comandos disponibles.
   - `backend/api-spec.yaml` — especificación OpenAPI 3.0 canónica para todos los contratos de endpoints.
   - `backend/prisma/schema.prisma` — esquema de base de datos.
   - Código existente en `backend/src/` — entiende los patrones DDD actuales (services, controllers, routes, models).

3. **Desarrolla el ticket** — Implementa la solución siguiendo los criterios de aceptación del ticket. Para implementación backend, carga el skill `backend-senior` vía la herramienta `skill` y delega todo el trabajo. Asegura que:
   - Todos los criterios de aceptación se cumplen.
   - La implementación sigue la arquitectura DDD existente (application services, domain models, infrastructure, presentation controllers, routes).
   - Los tests están escritos siguiendo TDD (Red-Green-Refactor) y pasan (`cd backend && npm test`).
   - Lint pasa (`cd backend && npx eslint src/`).
   - TypeScript compila sin errores (`cd backend && npx tsc --noEmit`).
   - `backend/api-spec.yaml` está actualizado si los shapes de respuesta cambian.
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

5. **Preserva descripciones de PR existentes** — Si `task/pr_description.md` ya existe y el nuevo ticket es una adición a un PR en curso, añade los nuevos cambios al archivo existente en lugar de sobrescribirlo. Agrega una nueva sección bajo la estructura existente (ej: nueva tabla "Cambios" y lista de "Criterios de aceptación") con separación visual clara.

6. **Verificación final** — Antes de terminar:
   - Confirma que todos los criterios de aceptación están cubiertos en el código y reflejados en la descripción del PR.
   - Ejecuta `cd backend && npm test` — todos los tests deben pasar.
   - Ejecuta `cd backend && npx eslint src/` — sin errores.
   - Ejecuta `cd backend && npx tsc --noEmit` — sin errores de tipo.
   - Asegura que `task/pr_description.md` existe, está correctamente formateado y contiene los cambios del nuevo ticket.

## Formato de respuesta

- Entrega un resumen de lo implementado, los archivos modificados y la ubicación de la PR description.
- Si encuentras problemas (tests fallando, lint errors, criterios no cubiertos, API spec desactualizada), notifícalo antes de dar la tarea por terminada.
