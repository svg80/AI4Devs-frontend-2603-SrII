# [ENRIQUECIDO TDD] Renderizar tarjetas de candidatos en sus columnas

> **Archivo original**: `002-renderizar-tarjetas-de-candidatos.md`
> **Propósito del enriquecimiento**: Añadir plan de tests TDD (Red-Green-Refactor), expandir criterios de aceptación, documentar edge cases, mapear cada criterio a escenarios de test concretos y alinear con los tipos/API definidos en la tarea 001.

---

## 1. Descripción refinada

Una vez que el tablero kanban con sus columnas (fases) está renderizado (tarea `001`), este ticket se encarga de:

1. **Obtener los candidatos** vía `GET /position/{id}/candidates` usando el módulo `api.ts` creado en 001.
2. **Agruparlos por fase**: cada candidato tiene un campo `currentInterviewStep` (string) que debe coincidir con el `name` de alguna `InterviewStep` del `interviewFlow`.
3. **Renderizar una tarjeta por candidato** dentro de la columna de la fase correspondiente.
4. **Mostrar en cada tarjeta**: `fullName` (texto) y `averageScore` (número, mostrar como entero o 1 decimal).
5. **Manejar estados**: carga (skeleton/spinner), vacío (columna sin candidatos), error (fallo de red/API con reintento independiente del error de fases).

### Alcance y límites

- **NO** incluye drag & drop (es la tarea `003`).
- **NO** incluye layout responsivo móvil (es la tarea `004`).
- **Sí** debe preparar las tarjetas con atributos `data-candidate-id` y `data-testid` para que el drag & drop posterior pueda identificarlas.
- Los datos de `candidates` se obtienen **después** de que el `interviewFlow` se haya cargado correctamente (dependencia de orden: primero fases, luego candidatos).

### Edge cases identificados

| Escenario | Comportamiento esperado |
|---|---|
| `currentInterviewStep` no coincide con ninguna fase | El candidato se descarta (no se renderiza) y se loguea un warning en consola |
| `averageScore` es `null` o `undefined` | Mostrar "—" o "N/A" en lugar del número |
| `averageScore` es `0` | Mostrar "0" (el candidato aún no tiene evaluación) |
| `fullName` vacío o solo espacios | Mostrar "Candidato sin nombre" como fallback |
| Lista de candidatos vacía (`[]`) | Cada columna muestra "No hay candidatos en esta fase" |
| Error en la llamada de candidatos (la de fases fue exitosa) | Mostrar alerta de error independiente + botón reintentar solo para candidatos |
| Error en ambas llamadas (fases y candidatos) | El error de fases domina (no hay columnas donde mostrar candidatos) |
| Candidato duplicado (mismo fullName en misma fase) | Se renderizan dos tarjetas iguales (el backend permite duplicados) |
| `averageScore` con muchos decimales (ej: 3.666666) | Redondear a 1 decimal (3.7) |
| Recarga de página tras cargar candidatos | Se vuelve a fetchear todo (fases + candidatos) |
| Navegación entre posiciones sin recargar | Si el componente se desmonta y monta (cambio de ruta), se fetchea de nuevo |

---

## 2. Plan de tests TDD (Red-Green-Refactor)

### 2.1 Stack de testing (hereda de 001)

- **Framework**: Jest (incluido con react-scripts 5)
- **Librería**: `@testing-library/react` + `@testing-library/jest-dom`
- **Mocks HTTP**: `axios-mock-adapter` o `jest.mock('axios')` — el que se haya elegido en 001
- **Nota**: Se asume que el módulo `api.ts` ya está testeado en 001. Para los tests de este ticket, mockearemos `api.ts` directamente (no axios) para aislar la lógica de UI.

### 2.2 Ciclo Red-Green-Refactor

```
1. 🔴 Red   → escribir test que describe el comportamiento esperado (falla)
2. 🟢 Green → escribir código mínimo para que pase
3. 🔵 Refactor → limpiar manteniendo tests en verde
```

### 2.3 Tests del componente CandidateCard

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T1 | Renderiza `fullName` y `averageScore` cuando ambos son válidos | 🔴🟢🔵 | Happy path |
| T2 | Renderiza `fullName` y muestra "N/A" cuando `averageScore` es `null` | 🔴🟢🔵 | Edge case |
| T3 | Renderiza `fullName` y muestra "0" cuando `averageScore` es `0` | 🔴🟢🔵 | Edge case |
| T4 | Renderiza "Candidato sin nombre" cuando `fullName` está vacío | 🔴🟢🔵 | Edge case |
| T5 | Renderiza "Candidato sin nombre" cuando `fullName` es solo espacios | 🔴🟢🔵 | Edge case |
| T6 | La tarjeta tiene `data-candidate-id` con el id del candidato | 🔴🟢🔵 | Atributo técnico |
| T7 | La tarjeta tiene `role="article"` (semántica HTML) | 🔴🟢🔵 | Accesibilidad |
| T8 | La tarjeta tiene `tabIndex={0}` y manejador `onKeyDown` para Enter | 🔴🟢🔵 | Accesibilidad teclado |

### 2.4 Tests de agrupamiento de candidatos por fase

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T9 | Candidato con `currentInterviewStep` "Technical Interview" se asigna a la columna "Technical Interview" | 🔴🟢🔵 | Happy path |
| T10 | Varios candidatos en la misma fase se renderizan dentro de la misma columna | 🔴🟢🔵 | Happy path |
| T11 | Candidato con `currentInterviewStep` que no coincide con ninguna fase no se renderiza | 🔴🟢🔵 | Edge case |
| T12 | Columna sin candidatos muestra "No hay candidatos en esta fase" | 🔴🟢🔵 | Estado vacío |

### 2.5 Tests de integración con KanbanBoard (flujo completo)

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T13 | `KanbanBoard` inicia fetching de candidatos inmediatamente tras cargar fases (mock de api.ts) | 🔴🟢🔵 | Integración |
| T14 | `KanbanBoard` muestra spinner de carga de candidatos mientras se fetchean | 🔴🟢🔵 | Loading state |
| T15 | `KanbanBoard` muestra error de candidatos con botón reintentar (independiente de fases) | 🔴🟢🔵 | Error state |
| T16 | Al hacer clic en reintentar de candidatos, se vuelve a llamar a `getCandidates` | 🔴🟢🔵 | Interacción |
| T17 | Flujo completo: fases cargadas OK + candidatos cargados OK → columnas con tarjetas | 🔴🟢🔵 | Happy path |
| T18 | `averageScore` con decimales (3.666) se muestra redondeado a 1 decimal (3.7) | 🔴🟢🔵 | Formato |
| T19 | `averageScore` entero (4) se muestra sin decimales ("4") | 🔴🟢🔵 | Formato |

---

## 3. Criterios de aceptación expandidos

Los criterios del ticket original se expanden en checkboxes concretos y verificables, con referencia a los tests que los cubren.

### CA1: Se ejecuta `GET /position/{id}/candidates` al cargar la página (o después de obtener las fases)

- [ ] La llamada a `getCandidates(id)` se dispara después de que `getInterviewFlow(id)` se resuelve exitosamente (T13)
- [ ] Si `getInterviewFlow` falla, NO se llama a `getCandidates` (no hay columnas donde ponerlos) (T13)
- [ ] La URL llamada es `GET /position/{id}/candidates` (T13, por mock)
- [ ] Se pasa el `id` correcto de la posición desde la ruta (T13)

### CA2: Cada candidato se renderiza como tarjeta dentro de la columna de la fase que le corresponde

- [ ] Candidato asignado a columna por coincidencia exacta de `currentInterviewStep` con `name` de `InterviewStep` (T9)
- [ ] Múltiples candidatos en misma fase aparecen en la misma columna (T10)
- [ ] Candidato sin fase coincidente se descarta y no rompe el renderizado (T11)
- [ ] Las tarjetas dentro de cada columna se renderizan en el orden del array de candidatos (T10)

### CA3: La tarjeta muestra el nombre completo (`fullName`) y la puntuación media (`averageScore`)

- [ ] `fullName` se renderiza como texto visible en la tarjeta (T1)
- [ ] `averageScore` se renderiza como texto visible en la tarjeta (T1)
- [ ] El formato de `averageScore` es entero (4 → "4") o con 1 decimal (3.666 → "3.7") (T18, T19)

### CA4: Si la puntuación media es 0, se muestra igualmente

- [ ] `averageScore: 0` se renderiza como "0" (T3)
- [ ] No se confunde con "sin evaluación" — se muestra el número (T3)

### CA5: Si no hay candidatos, se muestra "No hay candidatos en esta fase" en cada columna vacía

- [ ] Columna sin candidatos muestra el mensaje (T12)
- [ ] El mensaje se muestra UNA vez por columna vacía, no por candidato (T12)
- [ ] Si todas las columnas están vacías, todas muestran el mensaje (T12)

### CA6: Se maneja el estado de carga con skeleton cards o spinner

- [ ] Mientras se fetchean candidatos, se muestra un spinner o skeleton en el área de tarjetas (T14)
- [ ] El spinner desaparece cuando la petición se completa (T14 → T17)
- [ ] El spinner NO interfiere con el título de la posición ni con los encabezados de columna (T14)

### CA7: Se maneja el estado de error con mensaje y opción de reintentar (independiente del error de fases)

- [ ] Si la llamada de candidatos falla, se muestra un mensaje de error con `Alert variant="danger"` (T15)
- [ ] El error de candidatos NO oculta las columnas (estas ya se renderizaron con las fases) (T15)
- [ ] Hay un botón "Reintentar" que solo refetchea candidatos (T16)
- [ ] Si ambas llamadas fallan (fases + candidatos), el error de fases es el que se muestra (T13)

### CA8: Las tarjetas tienen un diseño limpio y consistente con Bootstrap

- [ ] La tarjeta usa `Card` de react-bootstrap con `className="shadow-sm mb-2"` (estilo consistente con Positions.tsx)
- [ ] Tiene borde sutil, padding y sombra (T1 visual)
- [ ] El diseño es responsivo dentro de la columna (no se desborda) (T17)

### CA9: Atributos técnicos para drag & drop posterior

- [ ] Cada tarjeta tiene `data-candidate-id` con el identificador del candidato (T6)
- [ ] Cada tarjeta tiene un `data-testid` único para testing (T6)
- [ ] Cada tarjeta es accesible por teclado (`tabIndex={0}`, `onKeyDown` para Enter) (T8)
- [ ] La tarjeta es un `<article>` o `<div>` con `role="article"` (T7)

---

## 4. Notas de implementación

### 4.1 Archivos a modificar/crear

```
frontend/src/
├── types/
│   └── position.ts                        # [YA CREADO en 001] Se usan las interfaces existentes
├── services/
│   └── api.ts                             # [YA CREADO en 001] Se usa getCandidates(id)
├── components/
│   ├── KanbanBoard.tsx                    # [MODIFICAR] Añadir fetching de candidatos y pasarlos a columnas
│   ├── KanbanColumn.tsx                   # [MODIFICAR] Aceptar candidatos y renderizar CandidateCard
│   ├── CandidateCard.tsx                  # [CREAR] Tarjeta individual de candidato
│   ├── BackButton.tsx                     # [YA CREADO en 001] Sin cambios
│   └── SkeletonCard.tsx                   # [CREAR] Esqueleto de carga para tarjetas (opcional, puede ser inline)
├── pages/
│   └── PositionPage.tsx                   # [MODIFICAR] Pasar datos de candidatos al KanbanBoard
└── __tests__/
    ├── api.test.ts                        # [YA CREADO en 001] Sin cambios
    ├── PositionPage.test.tsx              # [YA CREADO en 001] Añadir tests con candidatos mock
    ├── CandidateCard.test.tsx             # [CREAR] Tests unitarios de CandidateCard
    └── KanbanBoard.test.tsx               # [CREAR] Tests de integración del board con candidatos
```

### 4.2 Contrato de API real

Basado en `backend/src/index.ts` y `backend/api-spec.yaml`:

| Endpoint documentado (epic) | Endpoint real backend | Módulo api.ts |
|---|---|---|
| `GET /positions/:id/candidates` | `GET /position/{id}/candidates` | `getCandidates(id: number): Promise<CandidateResponse[]>` |

**Respuesta real** (confirmada en api-spec.yaml):
```json
[
  { "fullName": "Jane Smith", "currentInterviewStep": "Technical Interview", "averageScore": 4 },
  { "fullName": "Carlos García", "currentInterviewStep": "Initial Screening", "averageScore": 0 },
  { "fullName": "John Doe", "currentInterviewStep": "Manager Interview", "averageScore": 5 }
]
```

### 4.3 Interfaces TypeScript (tipos ya definidos en 001, se reutilizan)

```typescript
// Importar desde types/position.ts
import { CandidateResponse, InterviewStep } from '../types/position';
```

### 4.4 Enfoque de implementación

#### Paso 1: Componente `CandidateCard` (presentacional)
- Props: `candidate: CandidateResponse & { id?: number }`
- Renderiza `<article>` o `<Card>` con:
  - `fullName` en `Card.Title` o similar
  - `averageScore` formateado (función helper `formatScore`)
  - `data-candidate-id` y `data-testid`
  - `tabIndex={0}`, `onKeyDown` para Enter
- Función helper `formatScore(score: number | null | undefined): string`:
  - `null`/`undefined` → `"N/A"`
  - `0` → `"0"`
  - Entero (`4`) → `"4"`
  - Decimal (`3.666`) → `"3.7"` (1 decimal)

#### Paso 2: Lógica de agrupamiento (en `PositionPage` o en un hook `useCandidatesByStep`)
- Input: `candidates: CandidateResponse[]`, `interviewSteps: InterviewStep[]`
- Output: `Map<string, CandidateResponse[]>` indexado por `step.name`
- Algoritmo:
  ```typescript
  function groupCandidatesByStep(candidates: CandidateResponse[], steps: InterviewStep[]) {
    const stepNames = new Set(steps.map(s => s.name));
    const grouped = new Map<string, CandidateResponse[]>();
    
    // Inicializar todas las fases con array vacío
    steps.forEach(s => grouped.set(s.name, []));
    
    // Asignar candidatos
    candidates.forEach(c => {
      if (stepNames.has(c.currentInterviewStep)) {
        grouped.get(c.currentInterviewStep)!.push(c);
      } else {
        console.warn(`Candidato "${c.fullName}" tiene fase desconocida: "${c.currentInterviewStep}"`);
      }
    });
    
    return grouped;
  }
  ```

#### Paso 3: Integrar en `KanbanBoard` / `PositionPage`
- `PositionPage`:
  - Tras obtener `interviewFlow`, dispara `getCandidates(id)`
  - Mantiene estado `candidatesStatus`: `'idle' | 'loading' | 'success' | 'error'`
  - Pasa `candidates`, `loading`, `error`, `onRetry` a `KanbanBoard`
- `KanbanBoard`:
  - Usa `groupCandidatesByStep` para agrupar
  - En estado `loading`: muestra `Spinner` de Bootstrap o `SkeletonCard` en cada columna
  - En estado `error`: muestra `Alert` + botón reintentar dentro de un contenedor (no reemplaza las columnas)
  - En estado `success`: pasa los candidatos agrupados a cada `KanbanColumn`
- `KanbanColumn`:
  - Nueva prop `candidates: CandidateResponse[]`
  - Si `candidates.length === 0`: muestra "No hay candidatos en esta fase"
  - Si `candidates.length > 0`: mapea a `<CandidateCard>`

### 4.5 Patrones a seguir

- **Container/Presentational**: `PositionPage` y `KanbanBoard` manejan estado/lógica; `KanbanColumn` y `CandidateCard` son presentacionales puras.
- **Custom hook** (opcional): `useCandidates(positionId)` que encapsule fetching, loading y error de candidatos. Separado del hook de fases para mantener independencia.
- **Formato de score**: Una función pura `formatScore` fuera del componente (fácil de testear).
- **Estados con discriminated union** (consistente con 001):
  ```typescript
  type CandidatesState = 
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; error: string }
    | { status: 'success'; data: CandidateResponse[] };
  ```

### 4.6 Accesibilidad

- `<article>` para cada tarjeta (landmark semántico)
- `aria-label` descriptivo: `"Candidato: {fullName}, puntuación: {averageScore}"`
- `tabIndex={0}` para hacer la tarjeta focusable
- `onKeyDown`: si la tecla es Enter, disparar el mismo handler que onClick (seleccionar candidato para drag)
- Contraste suficiente: texto oscuro sobre fondo claro (Bootstrap `text-dark` por defecto)

---

## 5. Edge cases y estados de error

| Escenario | Comportamiento esperado | Test |
|---|---|---|
| `averageScore = null` | Mostrar "N/A" | T2 |
| `averageScore = undefined` | Mostrar "N/A" | T2 |
| `averageScore = 0` | Mostrar "0" | T3 |
| `averageScore = 3.666` | Mostrar "3.7" (1 decimal) | T18 |
| `averageScore = 4` | Mostrar "4" (entero, sin decimales) | T19 |
| `fullName = ""` | Mostrar "Candidato sin nombre" | T4 |
| `fullName = "   "` | Mostrar "Candidato sin nombre" | T5 |
| `currentInterviewStep` desconocido | Candidato descartado + console.warn | T11 |
| Lista de candidatos vacía (`[]`) | Todas las columnas muestran "No hay candidatos en esta fase" | T12 |
| Error de red en candidatos (fases OK) | Alert error + botón reintentar (columnas visibles) | T15, T16 |
| Error en fases (candidatos no llegan a fetchearse) | Se muestra error de fases (columna no se renderiza) | T13 |
| Timeout en GET candidates | Catch de axios → error state → reintentar | T15 |
| Error 500 en GET candidates | Mostrar mensaje con código de estado | T15 |
| Candidato con id no numérico | Se usa el id tal cual (string) para data-candidate-id | T6 |
| Múltiples candidatos misma fase | Todos se renderizan en orden | T10 |
| El usuario pulsa Enter en una tarjeta | Se ejecuta el mismo handler que onClick | T8 |
| El usuario navega con Tab entre tarjetas | Las tarjetas son focusables secuencialmente | T8 |

---

## 6. Escenarios de test detallados

Para cada criterio de aceptación (CA), se definen los tests correspondientes.

### CA1: Fetch de candidatos tras cargar fases

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T13 | Happy path | Mockear `getInterviewFlow` resuelto OK y verificar que `getCandidates` se llama con el mismo `id` | `expect(mockGetCandidates).toHaveBeenCalledWith(1)` |
| T13b | Error | Mockear `getInterviewFlow` como error y verificar que `getCandidates` NO se llama | `expect(mockGetCandidates).not.toHaveBeenCalled()` |

### CA2: Candidatos en columna correcta

| Test ID | Tipo | Descripción |
|---|---|---|
| T9 | Happy path | Candidato con `currentInterviewStep: "Technical Interview"` aparece dentro de la columna "Technical Interview" |
| T10 | Happy path | 2 candidatos en "Initial Screening" → 2 tarjetas en esa columna |
| T11 | Edge case | Candidato con `currentInterviewStep: "Nonexistent Step"` no aparece en ninguna columna |

### CA3: Nombre y puntuación visibles

| Test ID | Tipo | Descripción |
|---|---|---|
| T1 | Happy path | Tarjeta contiene texto "Jane Smith" y texto "4" |
| T18 | Formato | `averageScore: 3.666` se muestra como "3.7" |
| T19 | Formato | `averageScore: 4` se muestra como "4" (sin decimales) |

### CA4: Score 0 se muestra

| Test ID | Tipo | Descripción |
|---|---|---|
| T3 | Edge case | `averageScore: 0` → la tarjeta contiene "0" |

### CA5: Columna vacía con mensaje

| Test ID | Tipo | Descripción |
|---|---|---|
| T12 | Vacío | Columna sin candidatos muestra texto "No hay candidatos en esta fase" |
| T12b | Vacío | El mensaje usa `data-testid="empty-column-msg"` o similar |

### CA6: Estado de carga

| Test ID | Tipo | Descripción |
|---|---|---|
| T14 | Loading | Mientras `getCandidates` está pending, se renderiza `<Spinner animation="border" />` o un componente con `role="status"` y texto "Cargando candidatos..." |

### CA7: Estado de error + reintentar

| Test ID | Tipo | Descripción |
|---|---|---|
| T15 | Error | Cuando `getCandidates` rechaza, se muestra `Alert variant="danger"` con el mensaje de error y un botón "Reintentar" |
| T16 | Interacción | Al hacer clic en "Reintentar", se llama a `getCandidates` de nuevo |

### CA8: Diseño Bootstrap consistente

| Test ID | Tipo | Descripción |
|---|---|---|
| T1 (visual) | Happy path | La tarjeta es un componente `<Card>` de react-bootstrap (o tiene `className` que incluye `shadow-sm`) |

### CA9: Accesibilidad y atributos técnicos

| Test ID | Tipo | Descripción |
|---|---|---|
| T6 | Técnico | La tarjeta tiene `data-candidate-id` con el valor esperado |
| T7 | Accesibilidad | La tarjeta tiene `role="article"` |
| T8 | Accesibilidad | La tarjeta tiene `tabIndex={0}` y ejecuta handler al pulsar Enter |
| T7b | Accesibilidad | La tarjeta tiene `aria-label` descriptivo |

---

## 7. Dependencias no documentadas

| Dependencia | Afecta a | Nota |
|---|---|---|
| **`types/position.ts`** (de 001) | Este ticket | Las interfaces `CandidateResponse` e `InterviewStep` deben estar definidas. Si 001 no se completó, este ticket no puede empezar. |
| **`services/api.ts`** (de 001) | Este ticket | La función `getCandidates(id)` debe existir y estar tipada. |
| **`KanbanBoard` + `KanbanColumn`** (de 001) | Este ticket | Necesitamos los componentes base para añadirles la capa de candidatos. |
| **`PositionPage`** (de 001) | Este ticket | La página debe estar creada y funcional (ruta, fetching de fases). |
| **Hook/estado de fases** | Este ticket | El fetching de candidatos debe ocurrir DESPUÉS de que las fases se hayan cargado. Si están en el mismo componente, hay que coordinar el orden. |
| **Este ticket** | `003-implementar-arrastre-y-actualizacion.md` | Todo lo que se prepare aquí (data-candidate-id, accesibilidad) es requisito para el drag & drop. |

---

## 8. Verificación INVEST

| Criterio | Cumple | Nota |
|---|---|---|
| **I**ndependent | ✅ | Depende solo de 001 (que ya creó tipos, API, y componentes base). No depende de 003 ni 004. |
| **N**egotiable | ✅ | La implementación de `formatScore`, el uso de `useCandidates` hook vs. estado inline, y la decisión de skeleton vs. spinner son discutibles. |
| **V**aluable | ✅ | Ver candidatos en sus columnas es el núcleo del kanban. Sin esto, la interfaz solo muestra columnas vacías. |
| **E**stimable | ✅ | ~1-1.5 días (componente CandidateCard + lógica de agrupamiento + integración + tests). |
| **S**mall | ✅ | Esfuerzo M, dentro del límite de 1-2 días. No requiere dividirse. |
| **T**estable | ✅ | 19 tests definidos cubriendo happy paths, edge cases, loading, error y vacío. |

---

## 9. Resumen de archivos a crear/modificar

| Archivo | Acción | Propósito |
|---|---|---|
| `frontend/src/components/CandidateCard.tsx` | CREAR | Tarjeta individual de candidato (presentacional) |
| `frontend/src/components/SkeletonCard.tsx` | CREAR (opcional) | Esqueleto de carga para tarjetas |
| `frontend/src/components/KanbanBoard.tsx` | MODIFICAR | Añadir fetching de candidatos y estado |
| `frontend/src/components/KanbanColumn.tsx` | MODIFICAR | Aceptar y renderizar candidatos |
| `frontend/src/pages/PositionPage.tsx` | MODIFICAR | Coordinar fetching de fases → candidatos |
| `frontend/src/__tests__/CandidateCard.test.tsx` | CREAR | Tests unitarios de CandidateCard |
| `frontend/src/__tests__/KanbanBoard.test.tsx` | CREAR | Tests de integración con candidatos |

---

## 10. Cambios respecto al original

| Aspecto | Original | Enriquecido |
|---|---|---|
| **Tests** | Mencionados genéricamente en DoD | Plan TDD completo con 19 tests, IDs, clasificados por tipo y fase |
| **Criterios de aceptación** | 8 checkboxes genéricos | 9 CA expandidos con checkboxes concretos y verificables + referencia al test ID |
| **Endpoint real** | Menciona `GET /positions/:id/candidates` | Nota explícita del endpoint real: `GET /position/{id}/candidates` |
| **Edge cases** | No documentados | 15 edge cases documentados con comportamiento esperado |
| **Estructura de archivos** | Solo mención genérica a "tarjetas" | Árbol completo de archivos a crear/modificar con responsabilidades claras |
| **Agrupamiento por fase** | No especificado | Algoritmo concreto `groupCandidatesByStep` + manejo de fases desconocidas |
| **Formato de score** | "entero o con 1 decimal" | Función `formatScore` con casos definidos (null, undefined, 0, entero, decimal) |
| **Fallback de nombre** | No mencionado | "Candidato sin nombre" cuando `fullName` vacío |
| **Atributos técnicos** | Menciona `data-*` attributes | Especificación concreta: `data-candidate-id`, `data-testid`, `role="article"`, `tabIndex`, `aria-label` |
| **Dependencias** | Solo cross-tickets (001, 003) | Añadidas dependencias de tipos, API y componentes específicos de 001 |
| **Verificación INVEST** | No incluida | Tabla INVEST con cumplimiento verificado |

---

## 11. Notas adicionales

### 11.1 Coordinación con la tarea 001

- La tarea 001 crea el esqueleto del kanban (columnas, routing, API). Este ticket (002) añade la capa de datos de candidatos.
- Es importante que los tipos `CandidateResponse` exportados desde `types/position.ts` incluyan un campo `id` (numérico) para el `data-candidate-id`. Si el endpoint no devuelve `id`, el componente mapeará por índice o el backend deberá incluirlo. **Verificar esta suposición con el backend.**
- La función `getCandidates` en `api.ts` debe retornar `Promise<CandidateResponse[]>`.

### 11.2 Suposiciones

- El endpoint `GET /position/{id}/candidates` devuelve los candidatos con un campo identificador (id). Si no es así, se usará el índice del array o se asumirá que el fullName es único (no recomendado).
- Las columnas se renderizan por `orderIndex` ascendente (definido en 001). El agrupamiento debe respetar ese orden.
- No hay paginación: el endpoint devuelve todos los candidatos de una vez.
