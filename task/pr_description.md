# PR: Renderizar tarjetas de candidatos en sus columnas (+ setup 001)

## Resumen

Implementa la infraestructura base de la página de detalle de posición (`/positions/:id`): registro de la ruta en React Router, módulo API tipado con axios para consumir los 3 endpoints del backend (interview flow, candidates, update stage), definición de interfaces TypeScript, e implementación del tablero kanban con `PositionPage`, `KanbanBoard`, `KanbanColumn` y `BackButton`.

Esta segunda iteración (ticket 002) añade la capa de datos de candidatos: fetching independiente tras cargar las fases, agrupamiento por `currentInterviewStep`, renderizado de tarjetas (`CandidateCard`) con nombre y puntuación formateada, manejo de estados loading/error/vacío independientes para candidatos (sin ocultar las columnas ya renderizadas), y atributos de accesibilidad y `data-*` para drag & drop futuro.

## Cambios

| Archivo | Descripción |
|---|---|
| `frontend/package.json` | Nueva dependencia `axios` para peticiones HTTP |
| `frontend/jest.config.js` | Configuración de Jest basada en react-scripts CRA |
| `frontend/src/setupTests.ts` | Setup de testing con `@testing-library/jest-dom` |
| `frontend/src/types/position.ts` | Interfaces TypeScript + añadido `{ status: 'idle' }` a `PageState<T>` para estado inicial de candidatos |
| `frontend/src/services/api.ts` | Módulo API con `getInterviewFlow`, `getCandidates`, `updateCandidateStage` usando axios |
| `frontend/src/components/BackButton.tsx` | Botón de retroceso reutilizable con link a `/positions` |
| `frontend/src/components/KanbanColumn.tsx` | **Modificado**: acepta `candidates: CandidateData[]` y `children`. Renderiza tarjetas, badge con conteo, o mensaje de columna vacía |
| `frontend/src/components/KanbanBoard.tsx` | **Modificado**: acepta estado de candidatos (loading/error/success), función `groupCandidatesByStep` exportada, skeletons durante carga, alerta de error independiente + reintentar |
| `frontend/src/components/CandidateCard.tsx` | **Nuevo**: tarjeta presentacional con `formatScore`, `data-candidate-id`, `data-testid`, `role="article"`, `tabIndex={0}`, Enter key handler, `aria-label` |
| `frontend/src/components/SkeletonCard.tsx` | **Nuevo**: placeholder de carga con Bootstrap Placeholder que replica la forma de CandidateCard |
| `frontend/src/pages/PositionPage.tsx` | **Modificado**: dos reducers independientes (flow + candidates), fetching de candidatos disparado tras éxito de fases, estados loading/error/vacío por separado |
| `frontend/src/index.tsx` | Envuelve la app con `<BrowserRouter>` |
| `frontend/src/App.tsx` | Configura rutas `/positions` y `/positions/:id` con lazy loading para PositionPage, importa Bootstrap CSS |
| `frontend/src/index.css` | Estilos kanban: layout flexbox horizontal para columnas, responsive stacking en mobile |
| `frontend/src/__tests__/api.test.ts` | 10 tests del módulo API (T1–T10): llamadas correctas, datos tipados, errores 404/500/400, fallo de red |
| `frontend/src/__tests__/PositionPage.test.tsx` | **Modificado**: 20 tests (T11–T20 + T9–T17) incluyendo integración de candidatos, columnas, loading/error/vacío, reintentar candidatos, desconocidos, badge count |
| `frontend/src/__tests__/CandidateCard.test.tsx` | **Nuevo**: 13 tests unitarios (formatScore + CandidateCard): nombre, score, null/0/decimal, fallback, accesibilidad, aria-label, Enter key |

## Criterios de aceptación

### Ticket 001 (setup)
- [x] **CA1: Ruta `/positions/:id` existe y carga PositionPage** — T11, T11b verifican renderizado con IDs numéricos y string
- [x] **CA2: Módulo `api.ts` con funciones tipadas para 3 endpoints** — T1–T10 cubren todas las funciones con datos tipados y errores
- [x] **CA3: Interfaces TypeScript cubren todas las respuestas** — Types en `position.ts` verificados por `tsc --noEmit` sin errores
- [x] **CA4: Al cargar se ejecuta GET interviewFlow y se muestran columnas** — T13 verifica 3 columnas renderizadas, T18 verifica orden por `orderIndex`, T19 verifica estado vacío
- [x] **CA5: Título de la posición en la parte superior** — T14 verifica heading con `positionName`
- [x] **CA6: Flecha de retroceso a `/positions`** — T15 verifica link con `aria-label` y `href="/positions"`
- [x] **CA7: Estado de carga (spinner)** — T12 verifica `role="status"` y texto "Cargando..."
- [x] **CA8: Estado de error con mensaje y reintento** — T16 verifica `Alert variant="danger"` y botón "Reintentar", T17 verifica que al hacer clic se reintenta la llamada
- [x] **CA9: Sigue patrones existentes** — Uso de Bootstrap (`Container`, `Spinner`, `Alert`, `Button`), React Router v6, estructura container/presentational

### Ticket 002 (candidatos)
- [x] **CA1: Fetch de candidatos tras cargar fases** — T13 verifica que `getCandidates` se llama después de que `getInterviewFlow` resuelve; T13b verifica que NO se llama si fases fallan
- [x] **CA2: Candidatos en columna correcta** — T9 verifica asignación por `currentInterviewStep`, T10 verifica múltiples en misma columna, T11 verifica descarte de fase desconocida + console.warn
- [x] **CA3: Nombre y puntuación visibles** — T1 (unitario) verifica `fullName` y `averageScore` visibles, T18/T19 verifican formato 1 decimal / entero
- [x] **CA4: Score 0 se muestra** — T3 (unitario) verifica que `averageScore: 0` se renderiza como "0"
- [x] **CA5: Columna vacía con mensaje** — T12 verifica "No hay candidatos en esta fase" con `data-testid` por columna
- [x] **CA6: Estado de carga** — T14 verifica spinner "Cargando candidatos..." mientras la petición está pending
- [x] **CA7: Error + reintentar independiente** — T15 verifica `Alert variant="danger"` + botón "Reintentar" sin ocultar columnas; T16 verifica que al hacer clic se refetchea
- [x] **CA8: Diseño Bootstrap consistente** — Tarjeta usa `Card shadow-sm mb-2` (consistente con Positions.tsx), con borde sutil y sombra
- [x] **CA9: Atributos técnicos y accesibilidad** — T6 verifica `data-candidate-id` y `data-testid`; T7 verifica `role="article"`; T8 verifica `tabIndex={0}` y Enter; T7b verifica `aria-label`

## Testing

- **Framework**: Jest 27 + @testing-library/react 13 + @testing-library/jest-dom 5 + @testing-library/user-event 13
- **Mocking**: `jest.mock('axios')` para tests de API; funciones `fetchInterviewFlow` y `fetchCandidates` inyectables para tests de componente con MemoryRouter
- **Cobertura**: 49 tests total cubriendo:
  - API module: 10 tests (3 funciones × happy path + error + edge cases)
  - PositionPage (001): 11 tests (renderizado, loading, success con columnas, header, back button, error+retry, orden, vacío, navegación directa, ID inválido)
  - PositionPage (002): 10 tests (fetch tras flow, error sin fetch, columna correcta, múltiples en misma columna, desconocido descartado, columna vacía, loading spinner, error+retry independiente, full flow, badge count)
  - CandidateCard: 13 tests (formatScore: null, undefined, 0, entero, decimal; componente: nombre+score, null score, score 0, nombre vacío, espacios, data-candidate-id, data-testid, role, tabIndex+Enter, aria-label, decimal formateado, entero formateado)
- **Ejecución**: `cd frontend && npm test` (o `npm test -- --watchAll=false`)

## Notas para revisores

- **Mismatch de API**: El backend real monta los endpoints en `/position` (sin 's') con minúsculas (`interviewflow`), no como documenta la epic (`/positions/:id/interviewFlow`). El módulo `api.ts` apunta a los endpoints reales y el `getInterviewFlow` unwrappa el envelope `{ interviewFlow: ... }` que añade el controller.
- **Estados independientes**: `PositionPage` usa dos reducers separados para interview flow y candidates. Esto permite que un error en candidates no oculte las columnas ya renderizadas (el error se muestra como `Alert` sobre las columnas, no las reemplaza).
- **groupCandidatesByStep**: Función pura exportada desde `KanbanBoard.tsx`. Inicializa todas las fases con arrays vacíos para que columnas sin candidatos muestren el mensaje de empty state. Candidatos con fase desconocida se descartan con `console.warn`.
- **formatScore**: Función pura exportada desde `CandidateCard.tsx`. Maneja `null`/`undefined` → "N/A", `0` → "0", enteros → sin decimales, decimales → 1 decimal redondeado.
- **Container/Presentational pattern**: `PositionPage` es smart container con reducers; `KanbanBoard` es container/presentational híbrido (agrupa candidatos); `KanbanColumn`, `CandidateCard`, `SkeletonCard` son presentacionales puros.
- **Discriminated union**: Se añadió `{ status: 'idle' }` a `PageState<T>` para el estado inicial de candidates (no se fetchea hasta que el flow está listo).
- **act() warnings**: Los tests muestran warnings de `act()` por los efectos asíncronos — es esperado con React 18 y no afecta la validez de las aserciones.

---

# Ticket 002.5: Extender respuesta GET /position/:id/candidates con id y applicationId

## Resumen

El endpoint `GET /position/:id/candidates` ya devolvía `id` (candidateId) y `applicationId` en el servicio backend (`positionService.ts`), pero estos campos no estaban documentados en la especificación OpenAPI ni verificados por los tests unitarios. Este ticket formaliza el contrato: actualiza la especificación OpenAPI, añade tests TDD al servicio y controlador para verificar la presencia, valores correctos y tipo numérico de estos campos, y desbloquea la dependencia del ticket 003 (drag & drop) que necesita `id` como `draggableId` y `applicationId` en el payload de `PUT /candidates/:id`.

Además, se migró la configuración de ESLint del formato legacy `.eslintrc.js` (incompatible con ESLint v9) al formato flat config (`eslint.config.mjs`) con soporte TypeScript mediante `@typescript-eslint/parser` y `@typescript-eslint/eslint-plugin`, y se corrigió `jest.config.js` para ignorar los archivos compilados en `dist/`.

## Cambios

| Archivo | Descripción |
|---|---|
| `backend/api-spec.yaml` | Añadidos `id` (type: integer) y `applicationId` (type: integer) a la respuesta 200 de `GET /position/{id}/candidates`, con descripciones y array `required` |
| `backend/src/application/services/positionService.test.ts` | Test actualizado para verificar `id` y `applicationId` en cada candidato; 2 nuevos tests: múltiples candidatos con diferentes ids, tipo numérico entero |
| `backend/src/presentation/controllers/positionController.test.ts` | Mock actualizado para incluir `id` y `applicationId` en aserciones 200; nuevo test de error 500 cuando el servicio falla |
| `backend/jest.config.js` | Añadido `testMatch: ['**/src/**/*.test.ts']` para excluir tests compilados en `dist/` |
| `backend/eslint.config.mjs` | **Nuevo**: Configuración ESLint v9 flat config con TypeScript parser, plugin y Prettier |
| `backend/package.json` | Nuevas dependencias dev: `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` |
| `backend/.eslintrc.js` | Eliminado (reemplazado por `eslint.config.mjs`) |
| `backend/eslint.config.js` | Eliminado (reemplazado por `eslint.config.mjs`) |

## Criterios de aceptación

- [x] **CA-01**: `api-spec.yaml` añade `id` (type: integer) y `applicationId` (type: integer) en la sección `properties` de la respuesta 200 de `GET /position/{id}/candidates`
- [x] **CA-02**: `api-spec.yaml` incluye descripciones para `id` ("Candidate ID used as draggableId") y `applicationId` ("Application ID used in PUT /candidates/{id} payload")
- [x] **CA-03**: `positionService.test.ts` verifica que cada elemento devuelto incluye `id` y `applicationId` con valores correctos
- [x] **CA-04**: `positionService.test.ts` verifica que `id` y `applicationId` son números enteros
- [x] **CA-05**: `positionService.test.ts` verifica el escenario de múltiples candidatos con diferentes `id` y `applicationId`
- [x] **CA-06**: `positionController.test.ts` verifica que la respuesta JSON 200 incluye `id` y `applicationId`
- [x] **CA-07**: `positionController.test.ts` verifica que el controlador responde con 500 cuando el servicio lanza un error
- [x] **CA-08**: `npm test` en `backend/` pasa sin errores (7/7 tests)
- [x] **CA-09**: `npx tsc --noEmit` en `backend/` pasa sin errores de tipo
- [x] **CA-10**: La especificación OpenAPI (`api-spec.yaml`) incluye los cambios requeridos

## Testing

- **Framework**: Jest 29 + ts-jest
- **Tests**: 7 tests total (3 en positionService, 2 en positionController, 2 pre-existentes de candidate que continúan pasando)
- **Cobertura de nuevo código**:
  - Test 1: Verifica `id` y `applicationId` presentes y con valores correctos en el happy path
  - Test 2: Verifica múltiples candidatos con diferentes `id`/`applicationId` (mapeo candidate id → `app.candidate.id` y application id → `app.id`)
  - Test 3: Verifica que `id` y `applicationId` son del tipo `number` y enteros (`Number.isInteger`)
  - Test 4 (controlador): Verifica que la respuesta 200 incluye ambos campos via `expect.objectContaining`
  - Test 5 (controlador): Verifica error 500 cuando el servicio rechaza
- **Ejecución**: `cd backend && npm test`

## Notas para revisores

- **No rompe compatibilidad**: El servicio ya devolvía `id` y `applicationId` — los tests simplemente validan el contrato existente. El controlador pasa la respuesta del servicio directamente a `res.json()`, sin transformación.
- **ESLint migration**: El proyecto tenía ESLint v9 sin configuración flat config y sin soporte TypeScript. Se creó `eslint.config.mjs` con `@typescript-eslint/parser` y `@typescript-eslint/eslint-plugin` (recomended rules). Hay ~950 errores de formato Prettier pre-existentes en todo `src/` que no forman parte del alcance de este ticket.
- **Dependencia desbloqueada**: Este ticket es bloqueante para `003-implementar-arrastre-y-actualizacion.md`, que necesita `id` como `draggableId` y `applicationId` en el payload de `PUT /candidates/:id`. Con este cambio, el frontend ya recibe ambos campos desde `GET /position/:id/candidates`.
- **Deuda técnica documentada**: El controlador trata todos los errores del servicio como 500 (incluso "Position not found" debería ser 404). No se aborda en este ticket por estar fuera de alcance.
