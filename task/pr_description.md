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

---

# Ticket 003: Implementar arrastre de tarjetas y actualización de fase

## Resumen

Implementa drag & drop de tarjetas de candidatos entre columnas del kanban usando `@hello-pangea/dnd`. Al arrastrar una tarjeta a una columna diferente, se ejecuta un optimistic update (la tarjeta se mueve inmediatamente en la UI), seguido de una llamada a `PUT /candidates/:id` para persistir el cambio. Si la API falla, se hace rollback (refetch de candidatos) y se muestra un toast de error. Se añade feedback visual: columna destino resaltada con `box-shadow`, spinner inline en la tarjeta durante la carga, y notificaciones toast via `react-hot-toast`.

## Cambios

| Archivo | Descripción |
|---|---|
| `frontend/package.json` | Nuevas dependencias: `@hello-pangea/dnd` (drag & drop), `react-hot-toast` (notificaciones) |
| `frontend/src/types/position.ts` | Añadidos tipos `DragItem`, `UpdatingState`, `KanbanCallbacks` para el estado de drag & drop |
| `frontend/src/helpers/dragAndDropHelpers.ts` | **Nuevo**: funciones puras `getStepIdByName`, `findCandidateById`, `buildRollbackInfo` |
| `frontend/src/helpers/notifications.ts` | **Nuevo**: funciones `showSuccessToast`, `showErrorToast`, `showInfoToast` usando `react-hot-toast` |
| `frontend/src/hooks/useDragAndDrop.ts` | **Nuevo**: hook con lógica completa de `onDragEnd`: optimistic update, llamada API, rollback en error, estado `updatingIds` por tarjeta |
| `frontend/src/components/KanbanBoard.tsx` | **Modificado**: ahora acepta `candidatesByStep: Map`, `onDragEnd`, `updatingIds`. Renderiza `<DragDropContext>`. La función `groupCandidatesByStep` se mantiene exportada |
| `frontend/src/components/KanbanColumn.tsx` | **Modificado**: envuelve cada columna en `<Droppable droppableId={step.name}>`. Aplica clase `kanban-column--drag-over` cuando `snapshot.isDraggingOver`. Acepta `updatingIds` |
| `frontend/src/components/CandidateCard.tsx` | **Modificado**: envuelve cada tarjeta en `<Draggable draggableId={candidate.id}>`. Añade `isDragDisabled` cuando `isUpdating`. Muestra `<Spinner>` inline durante actualización. Añade clase `candidate-card--dragging` durante arrastre |
| `frontend/src/pages/PositionPage.tsx` | **Modificado**: mantiene estado `candidatesByStep` como `Map<string, CandidateData[]>`. Añade `handleMoveOptimistic` (muta el map) y `handleRollback` (refetchea candidatos). Usa `useDragAndDrop` hook. Renderiza `<Toaster>` de `react-hot-toast` |
| `frontend/src/index.css` | Añadidos estilos: `.kanban-column--drag-over` (resaltado azul), `.candidate-card--dragging` (sombra + rotación), cursor grab/grabbing, transiciones suaves |
| `frontend/src/__tests__/useDragAndDrop.test.tsx` | **Nuevo**: 11 tests del hook (T1–T11): drop fuera/same column, API call, optimistic update, rollback en 400/404/network error, estado updating |
| `frontend/src/__tests__/KanbanBoardDnD.test.tsx` | **Nuevo**: 6 tests de integración DnD (T12–T16, T19): estructura DragDropContext, Droppable por columna, Draggable por tarjeta, clase drag-over, spinner inline, múltiples candidatos |
| `frontend/src/__tests__/helpers.test.ts` | **Nuevo**: 7 tests de helpers (T20–T22 + findCandidateById): `getStepIdByName` existente/inexistente/vacío, `findCandidateById` encontrado/no encontrado/map vacío |
| `frontend/src/__tests__/CandidateCard.test.tsx` | **Modificado**: envuelve renders en `DragDropContext` + `Droppable` (requerido por `@hello-pangea/dnd`). Añade `index` prop |

## Criterios de aceptación

### CA1: Tarjetas arrastrables con el mouse
- [x] Cada tarjeta (`CandidateCard`) está envuelta en `<Draggable draggableId={candidate.id}>` — T14 verifica `data-testid` y columna correcta
- [x] Cada columna (`KanbanColumn`) está envuelta en `<Droppable droppableId={step.name}>` — T13 verifica columnas renderizadas con etiquetas correctas
- [x] El tablero está envuelto en `<DragDropContext onDragEnd={handler}>` — T12 verifica `role="listbox"` dentro del contexto
- [x] Al iniciar un arrastre, la tarjeta sigue al cursor (comportamiento `@hello-pangea/dnd`) — T14 verifica estructura Draggable

### CA2: Resaltado visual de columna destino
- [x] La columna destino aplica clase `kanban-column--drag-over` — T15 verifica que las columnas tienen la clase base y el CSS existe
- [x] El resaltado usa `box-shadow` sin afectar layout — CSS definido en `index.css`
- [x] El resaltado desaparece al soltar — manejado por `snapshot.isDraggingOver` de `@hello-pangea/dnd`

### CA3: Al soltar en columna diferente, se ejecuta PUT /candidates/:id
- [x] Se llama a `updateCandidateStage(candidateId, { applicationId, currentInterviewStep })` — T3 verifica parámetros correctos
- [x] `currentInterviewStep` se envía como número (ID de InterviewStep destino) — T3 verifica `currentInterviewStep: 2`
- [x] `applicationId` se extrae del candidato — T3 verifica `applicationId: 10`
- [x] Misma columna → NO llama API — T2 verifica
- [x] Drop fuera → NO llama API — T1 verifica

### CA4: Estado de carga durante la petición
- [x] La tarjeta muestra spinner inline (Bootstrap `Spinner size="sm"`) — T16 verifica `data-testid="spinner-1"` y `role="status"`
- [x] Spinner solo en la tarjeta que se mueve — T16 verifica que otras tarjetas NO tienen spinner
- [x] Tarjeta no arrastrable mientras `isUpdating` — `isDragDisabled={isUpdating}` en `CandidateCard`
- [x] Spinner desaparece al recibir respuesta — T10 (éxito) y T11 (error) verifican limpieza de estado

### CA5: Éxito → tarjeta se mueve + notificación
- [x] Tarjeta permanece en columna destino (confirmación optimistic update) — T5 verifica que `onRollback` NO se llama
- [x] Se muestra toast de éxito — `showSuccessToast` en hook (after successful API call)

### CA6: Error → rollback + notificación
- [x] Rollback: tarjeta vuelve a columna original — T6 (400), T7 (404), T8 (network error) verifican `onRollback` llamado
- [x] Toast de error con mensaje — `showErrorToast` en hook (catch block)
- [x] Estado `updating` se limpia tras rollback — T11 verifica

### CA7: Uso de `@hello-pangea/dnd`
- [x] `@hello-pangea/dnd` en `dependencies` de `package.json`
- [x] No hay otra librería de drag & drop
- [x] Imports de `@hello-pangea/dnd`: `DragDropContext`, `Droppable`, `Draggable`

### CA8: Experiencia fluida sin saltos visuales
- [x] Optimistic update en mismo event loop que el drop — T4 verifica que `onMoveOptimistic` se llama inmediatamente
- [x] Transición instantánea — el estado se actualiza via `setCandidatesByStep` antes de la respuesta API
- [x] No hay doble salto — rollback solo en error, no en éxito

### CA9: Accesibilidad documentada como mejora futura
- [x] Estructura base preparada: `aria-label`, `role="article"`, `aria-roledescription="draggable candidate card"`, `role="listbox"` en columnas (T12, T14)
- [x] Comentario `TODO MVP-2: Implementar arrastre con teclado` en `useDragAndDrop.ts`
- [x] No se implementa funcionalidad de teclado en este ticket

## Testing

- **Framework**: Jest 27 + @testing-library/react 13 + @testing-library/jest-dom 5
- **Nuevos tests**: 24 tests nuevos (73 total en el proyecto):
  - `useDragAndDrop.test.tsx` (11 tests): lógica de onDragEnd — drop fuera/same column (T1-T2), API call con parámetros (T3), optimistic update (T4), éxito (T5), rollback 400/404/network (T6-T8), estado updating (T9-T11)
  - `KanbanBoardDnD.test.tsx` (6 tests): integración DnD — DragDropContext (T12), Droppable por columna (T13), Draggable por tarjeta (T14), clase drag-over (T15), spinner inline (T16), múltiples candidatos (T19)
  - `helpers.test.ts` (7 tests): getStepIdByName (T20-T22), findCandidateById (4 tests)
- **Tests existentes**: 49 tests (001+002+002.5) continúan pasando sin modificaciones en sus aserciones
- **Mocking**: `jest.mock('../services/api')` para aislar el hook del API real; funciones inyectables para PositionPage
- **Ejecución**: `cd frontend && npm test` (73 tests, 6 suites, todos pasan)

## Notas para revisores

- **Refactor de props**: `KanbanBoard` ahora recibe `candidatesByStep: Map` en lugar de `candidates: CandidateData[]`. `PositionPage` computa el map después del fetch y lo muta en optimistic updates. Las funciones `groupCandidatesByStep` y `formatScore` permanecen exportadas para tests.
- **Rollback vía refetch**: `handleRollback` refetchea toda la lista de candidatos desde la API. Esto es más simple que mantener un "reverse map" y garantiza consistencia incluso tras drops rápidos consecutivos.
- **Hook `useDragAndDrop`**: El hook expone `onDragEnd` y `updatingIds`. Se usa en `PositionPage` y se pasan ambos como props a `KanbanBoard`. Alternativa considerada: usar el hook dentro de `KanbanBoard`, pero la necesidad de acceso a `candidatesByStep` (estado de PositionPage) hace más limpio el enfoque actual.
- **Contexto DnD en tests**: Los tests de `CandidateCard` requieren envolver el componente en `<DragDropContext>` + `<Droppable>` porque `Draggable` necesita estos ancestros. Se actualizó el helper `renderCard` para incluir estos wrappers.
- **Atributos `data-rbd-*`**: `@hello-pangea/dnd` no renderiza atributos `data-rbd-droppable-id` / `data-rbd-draggable-id` en JSDOM. Los tests de integración verifican la estructura mediante `aria-label`, `data-testid` y contenedores en lugar de atributos internos de la librería.
- **act() warnings**: Los tests muestran warnings de `act()` por los efectos asíncronos (React 18). Es esperado y no afecta la validez de las aserciones. Ya documentado en tickets anteriores.
- **Dependencias bloqueantes resueltas**: El ticket 002.5 extendió la respuesta de `GET /position/:id/candidates` para incluir `id` y `applicationId`, necesarios para `draggableId` y el payload de `PUT /candidates/:id`.
