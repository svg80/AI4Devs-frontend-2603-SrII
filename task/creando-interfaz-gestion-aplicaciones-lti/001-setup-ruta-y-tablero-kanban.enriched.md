# [ENRIQUECIDO TDD] Configurar ruta, servicios API y renderizar tablero kanban

> **Archivo original**: `001-setup-ruta-y-tablero-kanban.md`
> **Propósito del enriquecimiento**: Añadir plan de tests TDD (Red-Green-Refactor), expandir criterios de aceptación, documentar edge cases y mapear cada criterio a escenarios de test concretos.

---

## 1. Descripción refinada

Configurar la infraestructura base de la página de detalle de posición (`/positions/:id`):

1. **Registrar la ruta** en el router de React Router para que `/positions/:id` cargue el componente `PositionPage`.
2. **Crear el módulo `api.ts`** en `frontend/src/services/` con funciones tipadas que consuman los 3 endpoints del backend, usando `axios` (ya presente en el proyecto).
3. **Definir interfaces TypeScript** para todas las respuestas de los 3 endpoints, ubicadas en `frontend/src/types/` (siguiendo el patrón de separación de tipos).
4. **Implementar el tablero kanban (`PositionPage`)** que:
   - Obtiene las fases del proceso vía `GET /position/:id/interviewflow` (notar: el backend expone el endpoint como `/position/:id/interviewflow`, no `/positions/:id/interviewFlow` — ver [Notas técnicas](#3-notas-de-implementación)).
   - Renderiza una columna por cada fase, con el nombre de la fase como encabezado.
   - Muestra el título de la posición en la parte superior.
   - Incluye una flecha de retroceso (`←`) que navega a `/positions`.
   - Maneja estados de **carga** (skeleton/spinner), **error** (mensaje + reintentar) y **vacío** (sin fases definidas).

### Edge cases identificados
- **ID de posición inválido**: ruta `positions/abc` — debe manejarse como string, el backend responderá 404.
- **interviewFlow vacío** (`interviewSteps: []`): el board se renderiza sin columnas, mostrando un mensaje informativo.
- **Error de red**: timeout, servidor caído, CORS — mostrar error con opción de reintentar.
- **Navegación directa**: el usuario accede por URL directamente (no desde el listado) — debe funcionar igual.
- **Recarga (F5)**: no debe perderse el estado de la posición (se vuelve a cargar desde la API).
- **Múltiples peticiones simultáneas**: si el usuario navega rápido entre posiciones, cancelar peticiones anteriores (o ignorar respuestas fuera de orden).

---

## 2. Plan de tests TDD (Red-Green-Refactor)

### 2.1 Stack de testing
- **Framework**: Jest (incluido con react-scripts 5, configurable vía `jest.config.js`).
- **Librería de testing**: `@testing-library/react` + `@testing-library/jest-dom`.
- **Mocks HTTP**: `msw` (Mock Service Worker) — recomendado para interceptar peticiones reales sin acoplar a implementación. Alternativa: `axios-mock-adapter` si no se quiere instalar dependencias nuevas.
- **Módulo auxiliar**: `jest.mock('axios')` para las pruebas de `api.ts`.

### 2.2 Ciclo Red-Green-Refactor

Cada test se escribe **antes** del código de implementación, siguiendo:

1. 🔴 **Red** → escribir el test que describe el comportamiento deseado (falla porque el código no existe).
2. 🟢 **Green** → escribir el código mínimo para que el test pase.
3. 🔵 **Refactor** → limpiar y optimizar manteniendo los tests en verde.

A continuación se listan todos los tests agrupados por funcionalidad (ver [sección 5](#5-escenarios-de-test) para el detalle de cada uno).

### 2.3 Fase 1 — Tipos e interfaces (sin tests directos, verificados por compilación)

| Archivo | Contenido |
|---|---|
| `frontend/src/types/position.ts` | `InterviewStep`, `InterviewFlowResponse`, `CandidateResponse`, `StageUpdatePayload`, `StageUpdateResponse` |

### 2.4 Fase 2 — Módulo API (`api.test.ts`)

| # | Test | Ciclo |
|---|---|---|
| T1 | `getInterviewFlow` llama a `GET /position/{id}/interviewflow` | 🔴🟢🔵 |
| T2 | `getInterviewFlow` retorna datos tipados correctamente en éxito | 🔴🟢🔵 |
| T3 | `getInterviewFlow` lanza error cuando la respuesta es 404 | 🔴🟢🔵 |
| T4 | `getInterviewFlow` lanza error cuando hay fallo de red | 🔴🟢🔵 |
| T5 | `getCandidates` llama a `GET /position/{id}/candidates` | 🔴🟢🔵 |
| T6 | `getCandidates` retorna array vacío cuando no hay candidatos | 🔴🟢🔵 |
| T7 | `getCandidates` lanza error cuando la respuesta es 500 | 🔴🟢🔵 |
| T8 | `updateCandidateStage` envía `PUT /candidates/{id}` con payload correcto | 🔴🟢🔵 |
| T9 | `updateCandidateStage` retorna la respuesta de éxito tipada | 🔴🟢🔵 |
| T10 | `updateCandidateStage` lanza error con 400 (payload inválido) | 🔴🟢🔵 |

### 2.5 Fase 3 — Ruta y componente PositionPage (`PositionPage.test.tsx`)

| # | Test | Ciclo |
|---|---|---|
| T11 | La ruta `/positions/1` renderiza `PositionPage` | 🔴🟢🔵 |
| T12 | `PositionPage` muestra spinner mientras carga interviewFlow | 🔴🟢🔵 |
| T13 | `PositionPage` renderiza columnas por cada fase al cargar | 🔴🟢🔵 |
| T14 | `PositionPage` muestra el título de la posición en el encabezado | 🔴🟢🔵 |
| T15 | `PositionPage` tiene una flecha `←` que navega a `/positions` | 🔴🟢🔵 |
| T16 | `PositionPage` muestra mensaje de error y botón reintentar si falla API | 🔴🟢🔵 |
| T17 | Al hacer clic en reintentar, se vuelve a llamar a la API | 🔴🟢🔵 |
| T18 | `PositionPage` muestra las columnas ordenadas por `orderIndex` | 🔴🟢🔵 |
| T19 | `PositionPage` muestra mensaje "No hay fases definidas" si `interviewSteps` está vacío | 🔴🟢🔵 |
| T20 | `PositionPage` funciona con navegación directa (sin estado previo) | 🔴🟢🔵 |

---

## 3. Notas de implementación

### 3.1 Archivos a modificar/crear

```
frontend/src/
├── App.tsx                        # [MODIFICAR] Añadir Route para /positions/:id
├── services/
│   ├── candidateService.js        # [EXISTENTE] Mantener, migrar progresivamente
│   └── api.ts                     # [CREAR] Módulo API tipado con axios
├── types/
│   └── position.ts                # [CREAR] Interfaces TypeScript
├── pages/
│   └── PositionPage.tsx           # [CREAR] Componente principal del kanban
├── components/                    # (los componentes del board pueden ir aquí)
│   └── KanbanBoard.tsx            # [CREAR] Tablero de columnas
│   └── KanbanColumn.tsx           # [CREAR] Columna individual del kanban
│   └── BackButton.tsx             # [CREAR] Botón de retroceso reutilizable
└── __tests__/
    ├── api.test.ts                # [CREAR] Tests del módulo API
    └── PositionPage.test.tsx      # [CREAR] Tests del componente + ruta
```

### 3.2 Contrato de API real (⚠️ atento al mismatch)

La epic documenta `GET /positions/:id/interviewFlow`, pero el backend real monta las rutas en `/position` (sin `s`) y usa minúsculas en `interviewflow`:

| Endpoint documentado | Endpoint real en backend |
|---|---|
| `GET /positions/:id/interviewFlow` | `GET /position/:id/interviewflow` |
| `GET /positions/:id/candidates` | `GET /position/:id/candidates` |
| `PUT /candidates/:id/stage` | `PUT /candidates/:id` (con `applicationId` y `currentInterviewStep` en body) |

**Decisión**: el módulo `api.ts` debe apuntar a los endpoints reales del backend (`/position/...`). Usar una constante `API_BASE_URL = 'http://localhost:3010'` (coincide con la usada en `candidateService.js`).

### 3.3 Interfaces TypeScript

```typescript
// frontend/src/types/position.ts

export interface InterviewStep {
  id: number;
  interviewFlowId: number;
  interviewTypeId: number;
  name: string;
  orderIndex: number;
}

export interface InterviewFlow {
  id: number;
  description: string;
  interviewSteps: InterviewStep[];
}

export interface InterviewFlowResponse {
  positionName: string;
  interviewFlow: InterviewFlow;
}

export interface CandidateResponse {
  fullName: string;
  currentInterviewStep: string;
  averageScore: number;
}

export interface StageUpdatePayload {
  applicationId: number;
  currentInterviewStep: number;
}

export interface ApplicationData {
  id: number;
  positionId: number;
  candidateId: number;
  applicationDate: string;
  currentInterviewStep: number;
  notes: string | null;
  interviews: Array<{
    interviewDate: string;
    interviewStep: string;
    score: number | null;
  }>;
}

export interface StageUpdateResponse {
  message: string;
  data: ApplicationData;
}
```

### 3.4 Enfoque de implementación

1. **Tipos primero**: crear `types/position.ts` y verificar que compila.
2. **Módulo API** (`services/api.ts`):
   - Usar `axios.create({ baseURL: 'http://localhost:3010' })` para tener una instancia compartida.
   - Exportar funciones `getInterviewFlow(id)`, `getCandidates(id)`, `updateCandidateStage(candidateId, payload)`.
   - Cada función es `async` y retorna el tipo correspondiente.
3. **Routing** (`App.tsx`):
   - Envolver la app con `<BrowserRouter>` (si no lo está ya).
   - Añadir `<Route path="/positions/:id" element={<PositionPage />} />`.
   - Añadir `<Route path="/positions" element={<Positions />} />` si no existe.
4. **Componentes**:
   - `PositionPage`: contenedor smart que orquesta la carga de datos y maneja estados (loading/error/success).
   - `KanbanBoard`: recibe `positionName`, `interviewSteps`, y el estado actual. Renderiza el header con back button y las columnas.
   - `KanbanColumn`: columna individual con el nombre de la fase como título.
   - `BackButton`: componente con `<Link to="/positions" aria-label="Volver al listado de posiciones">←</Link>`.
5. **Estilos**: usar Bootstrap (`Container`, `Row`, `Col`, `Spinner`, `Alert`, `Button`) y algo de CSS personalizado mínimo para el layout kanban (flexbox horizontal para columnas).

### 3.5 Patrones a seguir

- **Container/Presentational**: `PositionPage` es el contenedor con estado; `KanbanBoard`, `KanbanColumn` son presentacionales.
- **Custom hook** (opcional, si el estado crece): `usePosition(positionId)` que encapsule la lógica de fetching.
- **Manejo de errores**: try/catch en las funciones API, propagar el error como valor (no lanzar en el hook). Usar un tipo discriminated union para los estados:
  ```typescript
  type LoadingState = { status: 'loading' }
    | { status: 'error'; error: string }
    | { status: 'success'; data: InterviewFlowResponse };
  ```

---

## 4. Edge cases y estados de error

| Escenario | Comportamiento esperado | Cubierto por test |
|---|---|---|
| ID de posición no numérico (`/positions/abc`) | La ruta se renderiza, el backend devuelve 404 | T3 |
| `interviewSteps` vacío (`[]`) | Mostrar "No hay fases definidas para este proceso" | T19 |
| Error de red (servidor caído) | Mostrar `Alert variant="danger"` con mensaje + botón "Reintentar" | T16, T17 |
| Timeout de petición | Igual que error de red (el catch de axios lo captura) | T16 |
| Carga simultánea de datos | Mostrar `Spinner` de Bootstrap mientras se resuelve la petición | T12 |
| Error 500 del backend | Mostrar mensaje de error con código de estado si está disponible | T7, T16 |
| Posición sin nombre (positionName vacío) | Renderizar el encabezado igualmente (no fallar) | — (edge case menor) |
| Navegación directa vs. desde listado | Ambas deben funcionar — la ruta no depende de estado externo | T20 |
| Recarga de página (F5) | La petición se dispara de nuevo en el mount del componente | T20 |
| Ruta `/positions/` sin ID | React Router no hará match con `:id` obligatorio, redirigir a 404 o listado | — (fuera de alcance de este ticket) |

---

## 5. Escenarios de test

Para cada criterio de aceptación del original, se definen los tests correspondientes (happy path, validación, error, estado vacío).

### CA1: Ruta `/positions/:id` existe y carga PositionPage

| Test ID | Tipo | Descripción |
|---|---|---|
| T11 | Happy path | Renderizar `PositionPage` al navegar a `/positions/1` |
| T11b | Validación | Renderizar `PositionPage` al navegar a `/positions/abc` (el parámetro es string, el error se maneja en la API) |

### CA2: Módulo `api.ts` con funciones tipadas para 3 endpoints

| Test ID | Tipo | Descripción |
|---|---|---|
| T1 | Happy path | `getInterviewFlow(1)` → llama a `GET /position/1/interviewflow` |
| T5 | Happy path | `getCandidates(1)` → llama a `GET /position/1/candidates` |
| T8 | Happy path | `updateCandidateStage(1, {applicationId: 1, currentInterviewStep: 2})` → llama a `PUT /candidates/1` con payload correcto |
| T2, T6, T9 | Happy path | Cada función retorna datos en el formato esperado |
| T3, T7, T10 | Error | Cada función lanza/thrown error manejable cuando la API responde con error |

### CA3: Interfaces TypeScript cubren todas las respuestas

| Verificación | Tipo | Descripción |
|---|---|---|
| — | Compile-time | `tsc` compila sin errores al importar los tipos en `api.ts` y `PositionPage.tsx` |
| — | Contrato | Las interfaces coinciden con `backend/api-spec.yaml` y con la epic |

### CA4: Al cargar se ejecuta GET interviewFlow y se muestran columnas

| Test ID | Tipo | Descripción |
|---|---|---|
| T13 | Happy path | 3 fases → 3 columnas renderizadas con sus nombres |
| T18 | Orden | Columnas ordenadas por `orderIndex` ascendente |
| T19 | Vacío | Sin fases → mensaje "No hay fases definidas" |

### CA5: Título de la posición en la parte superior

| Test ID | Tipo | Descripción |
|---|---|---|
| T14 | Happy path | El texto del título (`positionName`) aparece en un `h1` o `h2` dentro del componente |

### CA6: Flecha de retroceso a `/positions`

| Test ID | Tipo | Descripción |
|---|---|---|
| T15 | Happy path | Existe un link con `aria-label="Volver al listado de posiciones"` y su `href` es `/positions` |
| T15b | Interacción | Al hacer clic, la URL cambia a `/positions` |

### CA7: Estado de carga (spinner/skeleton)

| Test ID | Tipo | Descripción |
|---|---|---|
| T12 | Happy path | Mientras la petición está pendiente, se renderiza un `Spinner` de Bootstrap o un `role="status"` con texto "Cargando..." |

### CA8: Estado de error con mensaje y reintento

| Test ID | Tipo | Descripción |
|---|---|---|
| T16 | Error | Si la API falla, se muestra un `Alert variant="danger"` con un mensaje de error y un botón "Reintentar" |
| T17 | Interacción | Al hacer clic en "Reintentar", se vuelve a invocar `getInterviewFlow` |

### CA9: Sigue patrones existentes (Bootstrap, React Router, estructura)

| Verificación | Tipo | Descripción |
|---|---|---|
| — | Code review | Uso de `react-bootstrap` (no CSS raw excepto layout kanban), `react-router-dom` para navegación, estructura de carpetas consistente |

---

## 6. Dependencias no documentadas

| Dependencia | Afecta a | Nota |
|---|---|---|
| **React Router debe estar configurado en `App.tsx`** | Este ticket | Actualmente `App.tsx` no tiene `BrowserRouter` ni rutas. Asumimos que se configura en este ticket. Si hay otro ticket de "setup inicial de router", debería bloquear a este. |
| **Backend debe estar corriendo** | Tests de integración | Para las pruebas manuales y tests de API, el backend debe responder en `localhost:3010`. Considerar añadir un mock de MSW para tests unitarios. |
| **Componente `Positions` (listado)** | Este ticket (back button) | El botón de retroceso navega a `/positions`, que debe existir. Si `Positions.tsx` se renderiza en `/positions`, está cubierto. |

---

## 7. Cambios respecto al original

| Aspecto | Original | Enriquecido |
|---|---|---|
| **Tests** | Mencionados genéricamente en DoD | Plan TDD completo con 20 escenarios, Red-Green-Refactor, IDs de test |
| **Criterios de aceptación** | 9 checkboxes genéricos | 9 CA expandidos con escenarios específicos (happy path, error, vacío, interacción) |
| **Endpoint real** | Usa la ruta documentada `/positions/:id/interviewFlow` | Nota explícita del mismatch con el backend real (`/position/:id/interviewflow`) |
| **Edge cases** | No documentados | 10 edge cases documentados con comportamiento esperado |
| **Estructura de archivos** | Solo menciona `api.ts` y `PositionPage` | Árbol completo de archivos a crear/modificar con naming concreto |
| **Tipos** | Menciona nombres de interfaces | Definiciones TypeScript completas y verificadas contra `api-spec.yaml` |
| **Patrón de componentes** | No especificado | Container/Presentational + custom hook opcional + discriminated union para estados |
| **Dependencias** | Solo cross-tickets | Añadidas dependencias de infraestructura (Router, backend) |

---

## 8. Verificación INVEST

| Criterio | Cumple | Nota |
|---|---|---|
| **I**ndependent | ✅ | No depende de otros tickets del lote (es el primero). Depende de infraestructura base (Router) que se configura aquí mismo. |
| **N**egotiable | ✅ | La elección de MSW vs axios-mock-adapter para tests, y la estructura del hook de estado son discutibles. |
| **V**aluable | ✅ | Sin esta tarea, ninguna otra del kanban funciona. El tablero vacío ya entrega valor informativo (ver las fases del proceso). |
| **E**stimable | ✅ | ~1 día de trabajo (configuración + tipos + API + renderizado básico + tests). |
| **S**mall | ✅ | Esfuerzo S (original) — se mantiene dentro del límite de 1-2 días. |
| **T**estable | ✅ | Cada criterio tiene test(es) asociados, incluidos estados de carga, error y vacío. |

---

## 9. Resumen de archivos a crear

| Archivo | Propósito |
|---|---|
| `frontend/src/types/position.ts` | Interfaces TypeScript |
| `frontend/src/services/api.ts` | Módulo API con axios |
| `frontend/src/pages/PositionPage.tsx` | Página contenedora del kanban |
| `frontend/src/components/KanbanBoard.tsx` | Tablero con header y columnas |
| `frontend/src/components/KanbanColumn.tsx` | Columna individual |
| `frontend/src/components/BackButton.tsx` | Botón de retroceso reutilizable |
| `frontend/src/__tests__/api.test.ts` | Tests del módulo API |
| `frontend/src/__tests__/PositionPage.test.tsx` | Tests del componente PositionPage |
