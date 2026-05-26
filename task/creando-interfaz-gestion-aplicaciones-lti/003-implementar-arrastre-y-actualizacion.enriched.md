# [ENRIQUECIDO TDD] Implementar arrastre de tarjetas y actualización de fase

> **Archivo original**: `003-implementar-arrastre-y-actualizacion.md`
> **Propósito del enriquecimiento**: Añadir plan de tests TDD (Red-Green-Refactor), expandir criterios de aceptación, documentar edge cases, mapear cada criterio a escenarios de test concretos y alinear con las convenciones del proyecto y el contrato real del backend.

---

## 1. Descripción refinada

Una vez que las tarjetas de candidatos se renderizan en sus columnas (tarea `002`), este ticket permite arrastrarlas entre columnas para cambiar su fase del proceso de contratación.

### Flujo completo

1. **Inicialización**: Al cargar el KanbanBoard, se obtienen los `interviewSteps` (fases) y los candidatos agrupados por fase (desde `002`).
2. **Arrastre**: El usuario agarra una tarjeta (con el mouse) y la arrastra sobre otra columna.
3. **Feedback visual durante arrastre**: La columna destino se resalta (box-shadow/outline). La tarjeta sigue al cursor.
4. **Soltar (drop)**:
   - Si la columna destino es la **misma** que la origen → no hacer nada.
   - Si la columna destino es **diferente** → ejecutar **optimistic update**: mover la tarjeta inmediatamente en la UI.
   - Mientras se procesa la petición, la tarjeta muestra un indicador de carga (spinner inline o degradado).
5. **Respuesta API** (`PUT /candidates/:id`):
   - **Éxito (200)**: confirmar el movimiento, mostrar toast de éxito ("Candidato movido a [Fase]").
   - **Error (400/404/500/network)**: **rollback**: devolver la tarjeta a su columna original, mostrar toast de error con el mensaje.
6. **Estados de carga, error y vacío**: manejar el estado `updating` por tarjeta (no bloqueante global), error con rollback visual, y columnas sin tarjetas (no debe impedir el drop).

### Alcance y límites

- **Incluye**: drag & drop con mouse, optimistic update, rollback en error, feedback visual (resaltado de columna, spinner inline, toast), integración con `PUT /candidates/:id`.
- **NO incluye**: arrastre con teclado (documentado como mejora futura), reorganización dentro de la misma columna, animaciones de reordenamiento entre tarjetas (solo movimiento entre columnas), layout responsivo móvil (es la tarea `004`).
- **NO incluye** la creación de tests de accesibilidad para teclado (fuera de MVP), pero sí la estructura base (`aria-grabbed`, `role="listbox"` etc.) para que sea más fácil añadirlos después.

### Contrato de API real (⚠️ mismatch con la epic)

La epic documenta `PUT /candidates/:id/stage`, pero el backend real expone:

| Documentado en epic | Real en backend | Módulo api.ts (desde 001) |
|---|---|---|
| `PUT /candidates/:id/stage` | `PUT /candidates/:id` | `updateCandidateStage(candidateId, payload)` |

**Payload real** (el controlador hace `parseInt` de ambos campos):
```typescript
{ applicationId: number | string, currentInterviewStep: number | string }
```

**Respuesta éxito (200)**:
```typescript
{ message: "Candidate stage updated successfully", data: ApplicationData }
```

**Respuestas error**:
- `400` → payload inválido (formato de `applicationId` o `currentInterviewStep` incorrecto)
- `404` → application no encontrada (`"Application not found"`)
- `500` → error interno del servidor

Ver notas de implementación (sección 4) para más detalle.

---

## 2. Plan de tests TDD (Red-Green-Refactor)

### 2.1 Stack de testing

- **Framework**: Jest (incluido con react-scripts 5, configurado vía `jest.config.js`)
- **Librería**: `@testing-library/react` + `@testing-library/jest-dom` (ya instalados)
- **Mocks HTTP**: Mockear `api.ts` directamente (no axios) para aislar la lógica de UI
- **Drag & Drop**: Para tests unitarios del `onDragEnd`, NO es necesario renderizar el DnD completo. Se testea el handler de forma aislada. Para tests de integración (arrastrar y soltar), `@hello-pangea/dnd` provee `DragDropContext` que puede mockearse o usarse con `fireEvent.dragStart`/`fireEvent.drop` de `@testing-library/react`.
- **Toasts**: Mockear `react-hot-toast` o la librería de notificaciones que se elija (ver notas de implementación). Alternativa: usar `jest.fn()` para la función de notificación y verificar que se llama con los argumentos correctos.

### 2.2 Ciclo Red-Green-Refactor

Cada test se escribe **antes** del código de implementación:

1. 🔴 **Red** → escribir el test que describe el comportamiento deseado (falla porque el código no existe)
2. 🟢 **Green** → escribir el código mínimo para que pase
3. 🔵 **Refactor** → limpiar y optimizar manteniendo los tests en verde

### 2.3 Tests del hook/estado `useDragAndDrop` (o la lógica equivalente)

Estos tests cubren la lógica pura del `onDragEnd` sin necesidad de renderizar el DOM.

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T1 | `onDragEnd` con destino = null (drop fuera de zona) → no llama a la API | 🔴🟢🔵 | Edge case |
| T2 | `onDragEnd` con misma columna origen y destino → no llama a la API | 🔴🟢🔵 | Edge case |
| T3 | `onDragEnd` con columna destino diferente → llama a `updateCandidateStage` con `candidateId`, `applicationId` y `currentInterviewStep` de la columna destino (como `number`) | 🔴🟢🔵 | Happy path |
| T4 | `onDragEnd` con columna destino diferente → mueve el candidato inmediatamente en el estado local (optimistic update) | 🔴🟢🔵 | Happy path |
| T5 | `updateCandidateStage` exitoso → el candidato permanece en la columna destino | 🔴🟢🔵 | Happy path |
| T6 | `updateCandidateStage` falla (400) → rollback: el candidato vuelve a su columna original | 🔴🟢🔵 | Error path |
| T7 | `updateCandidateStage` falla (404) → rollback + mensaje de error específico ("Aplicación no encontrada") | 🔴🟢🔵 | Error path |
| T8 | `updateCandidateStage` falla (network error) → rollback + mensaje de error genérico | 🔴🟢🔵 | Error path |
| T9 | Durante la petición API, la tarjeta tiene estado `updating: true` (spinner visible) | 🔴🟢🔵 | Loading state |
| T10 | Después de éxito, el estado `updating` vuelve a `false` | 🔴🟢🔵 | Loading state |
| T11 | Después de error, el estado `updating` vuelve a `false` y se ejecuta rollback | 🔴🟢🔵 | Loading state |

### 2.4 Tests de integración: KanbanBoard con DragDropContext

Renderizar el tablero completo con `@hello-pangea/dnd` y simular arrastres.

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T12 | El tablero está envuelto en un `<DragDropContext onDragEnd={...}>` | 🔴🟢🔵 | Integración |
| T13 | Cada columna es un `<Droppable droppableId={stepName}>` con `direction="vertical"` | 🔴🟢🔵 | Integración |
| T14 | Cada tarjeta es un `<Draggable draggableId={candidateId}>` con `index` correcto | 🔴🟢🔵 | Integración |
| T15 | Al arrastrar una tarjeta sobre otra columna, esta se resalta visualmente (clase CSS `kanban-column--drag-over` o similar) | 🔴🟢🔵 | Visual feedback |
| T16 | Al soltar la tarjeta en nueva columna, se muestra un spinner inline en la tarjeta movida | 🔴🟢🔵 | Loading visual |
| T17 | Al completar el movimiento con éxito, se dispara una notificación/toast de éxito | 🔴🟢🔵 | Feedback |
| T18 | Al fallar el movimiento, se dispara una notificación/toast de error | 🔴🟢🔵 | Feedback |
| T19 | Múltiples candidatos en la misma columna: arrastrar el primero, el del medio, el último → todos funcionan | 🔴🟢🔵 | Happy path |

### 2.5 Tests del helper `getStepIdByName` (mapeo nombre de fase → id numérico)

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T20 | `getStepIdByName("Technical Interview", steps)` → devuelve el `id` numérico de esa fase | 🔴🟢🔵 | Happy path |
| T21 | `getStepIdByName("Fase inexistente", steps)` → devuelve `null` o lanza error | 🔴🟢🔵 | Edge case |
| T22 | `getStepIdByName("", steps)` → devuelve `null` | 🔴🟢🔵 | Edge case |

### 2.6 Tests del helper de notificaciones

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T23 | `showSuccessToast("Candidato movido a Technical Interview")` → se llama a la función de toast con el mensaje correcto | 🔴🟢🔵 | Happy path |
| T24 | `showErrorToast("Error al mover candidato", error)` → se llama a la función de toast con el mensaje de error | 🔴🟢🔵 | Happy path |

### Resumen de tests

| Fase | Tests | Archivo |
|---|---|---|
| Lógica drag & drop (onDragEnd) | T1–T11 | `useDragAndDrop.test.ts` o `KanbanBoard.test.tsx` |
| Integración con DnD | T12–T19 | `KanbanBoard.test.tsx` |
| Helper `getStepIdByName` | T20–T22 | `helpers.test.ts` |
| Helper de notificaciones | T23–T24 | `helpers.test.ts` |
| **Total** | **24 tests** | |

---

## 3. Criterios de aceptación expandidos

Los criterios del ticket original se expanden en checkboxes concretos y verificables, con referencia a los tests que los cubren.

### CA1: Las tarjetas de candidatos son arrastrables con el mouse

- [ ] Cada tarjeta (`CandidateCard`) está envuelta en un `<Draggable draggableId={candidateId}>` (T14)
- [ ] Cada columna (`KanbanColumn`) está envuelta en un `<Droppable droppableId={stepName}>` (T13)
- [ ] El tablero está envuelto en un `<DragDropContext onDragEnd={handler}>` (T12)
- [ ] Al iniciar un arrastre, la tarjeta sigue al cursor (comportamiento por defecto de `@hello-pangea/dnd`) (T14)
- [ ] El cursor cambia a "grabbing" durante el arrastre (T14)

### CA2: Al arrastrar sobre una columna, esta se resalta visualmente

- [ ] La columna destino aplica una clase `kanban-column--drag-over` (o similar) cuando una tarjeta está sobre ella (T15)
- [ ] El resaltado usa `box-shadow` o `outline` para no afectar el layout (T15)
- [ ] El resaltado desaparece cuando la tarjeta sale de la columna o se suelta (T15)

### CA3: Al soltar en columna diferente, se ejecuta `PUT /candidates/:id`

- [ ] Se llama a `updateCandidateStage(candidateId, { applicationId, currentInterviewStep: stepId })` con el `candidateId` del candidato arrastrado (T3)
- [ ] `currentInterviewStep` se envía como número (el `id` de la `InterviewStep` destino) (T3)
- [ ] `applicationId` se extrae del candidato (o de un mapa estado global) (T3)
- [ ] Si se suelta en la misma columna, NO se llama a la API (T2)
- [ ] Si se suelta fuera de cualquier columna, NO se llama a la API (T1)

### CA4: La tarjeta muestra estado de carga durante la petición

- [ ] La tarjeta movida muestra un spinner inline (Bootstrap `Spinner` de tamaño `sm`) o un degradado/opacidad reducida (T9, T16)
- [ ] El spinner se muestra solo en la tarjeta que se está moviendo, no en todo el tablero (T9)
- [ ] La tarjeta no es arrastrable mientras está en estado `updating` (T9)
- [ ] El spinner desaparece al recibir respuesta (éxito o error) (T10, T11)

### CA5: Si la petición es exitosa, la tarjeta se mueve y se muestra notificación

- [ ] La tarjeta permanece en la columna destino (confirmación del optimistic update) (T5)
- [ ] Se muestra un toast de éxito con el mensaje: "Candidato [nombre] movido a [nombre fase]" (T17, T23)

### CA6: Si la petición falla, la tarjeta vuelve a su columna original

- [ ] La tarjeta se mueve de vuelta a la columna de origen (rollback) (T6, T7, T8)
- [ ] Se muestra un toast de error con el mensaje del servidor o un mensaje genérico (T18, T24)
- [ ] El estado `updating` se limpia después del rollback (T11)

### CA7: Se usa `@hello-pangea/dnd`

- [ ] `@hello-pangea/dnd` está en `dependencies` de `package.json` (verificar con `npm ls @hello-pangea/dnd`)
- [ ] No hay otra librería de drag & drop instalada (si la hay, se reemplaza)
- [ ] Los imports son de `@hello-pangea/dnd`: `DragDropContext`, `Droppable`, `Draggable`

### CA8: Experiencia fluida sin saltos visuales

- [ ] El optimistic update se ejecuta en el mismo event loop que el drop (sin delay artificial) (T4)
- [ ] La transición de la tarjeta a la nueva columna es instantánea (sin animación que pueda confundir) (T4)
- [ ] No hay "doble salto" (optimistic + respuesta API moviendo de nuevo) (T5)

### CA9: Accesibilidad para teclado documentada como mejora futura

- [ ] El código DEJA preparada la estructura base: `aria-grabbed`, `role="listbox"` en columnas, `role="option"` en tarjetas (según guía de `@hello-pangea/dnd`)
- [ ] Se añade un comentario en el `onDragEnd` indicando: `// TODO MVP-2: Implementar arrastre con teclado (onDragStart/onDragEnd vía teclado)`
- [ ] No se implementa la funcionalidad de teclado en este ticket

---

## 4. Notas de implementación

### 4.1 Archivos a modificar/crear

```
frontend/src/
├── package.json                              # [MODIFICAR] Añadir @hello-pangea/dnd
├── components/
│   ├── KanbanBoard.tsx                       # [MODIFICAR] Envolver en DragDropContext, añadir onDragEnd
│   ├── KanbanColumn.tsx                      # [MODIFICAR] Envolver en <Droppable>, estado isDraggingOver
│   ├── CandidateCard.tsx                     # [MODIFICAR] Envolver en <Draggable>, añadir spinner inline
│   └── ToastNotification.tsx                 # [CREAR] Componente de notificaciones (o usar librería existente)
├── hooks/
│   └── useDragAndDrop.ts                     # [CREAR] Hook con la lógica de onDragEnd, optimistic update, rollback
├── helpers/
│   └── dragAndDropHelpers.ts                 # [CREAR] Funciones puras: getStepIdByName, buildOptimisticMove, etc.
├── services/
│   └── api.ts                                # [YA CREADO en 001] updateCandidateStage(candidateId, payload) debe existir
├── types/
│   └── position.ts                           # [YA CREADO en 001] Se añade tipo UpdatingState si es necesario
└── __tests__/
    ├── useDragAndDrop.test.ts                # [CREAR] Tests del hook de drag & drop
    ├── KanbanBoard.test.tsx                  # [CREAR o MODIFICAR] Tests de integración con DnD
    └── helpers.test.ts                       # [CREAR] Tests de funciones helper
```

### 4.2 Contrato de API real

Basado en `backend/src/routes/candidateRoutes.ts` y `backend/src/presentation/controllers/candidateController.ts`:

| Aspecto | Detalle |
|---|---|
| **Endpoint** | `PUT /candidates/:id` |
| **Path param** | `id` — número entero (ID del candidato) |
| **Payload** | `{ applicationId: number|string, currentInterviewStep: number|string }` |
| **Respuesta 200** | `{ message: "Candidate stage updated successfully", data: ApplicationData }` |
| **Respuesta 400** | `{ error: "Invalid position ID format" }` o `{ error: "Invalid currentInterviewStep format" }` |
| **Respuesta 404** | `{ message: "Application not found", error: "Error: Application not found" }` |
| **Respuesta 500** | `{ message: "Error updating candidate stage", error: "Unknown error" }` |

**⚠️ Importante**: El controlador hace `parseInt` de `applicationId` y `currentInterviewStep`. Por seguridad, el frontend debe enviarlos como números (`number`), no strings. Aunque el controlador acepte strings, enviar números evita ambigüedades.

### 4.3 Interfaces TypeScript (añadir al archivo existente `types/position.ts`)

```typescript
// Añadir a frontend/src/types/position.ts

export interface DragItem {
  candidateId: number;
  applicationId: number;
  sourceStepId: number;
  sourceStepName: string;
}

export type UpdatingState = Record<number, boolean>; // candidateId → isUpdating

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  type: ToastType;
  message: string;
}
```

### 4.4 Enfoque de implementación

#### Paso 0: Instalar `@hello-pangea/dnd`

```bash
npm install @hello-pangea/dnd
```

Verificar que no haya otra librería de drag & drop en `package.json`. Si la hay (`react-beautiful-dnd`, `react-dnd`, etc.), reemplazarla por `@hello-pangea/dnd`.

#### Paso 1: Hook `useDragAndDrop`

Crear un hook personalizado que encapsule toda la lógica:

```typescript
// hooks/useDragAndDrop.ts
import { useState, useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { updateCandidateStage } from '../services/api';
import { useToast } from './useToast'; // o un estado global

interface UseDragAndDropProps {
  candidatesByStep: Map<string, CandidateWithMeta[]>;
  interviewSteps: InterviewStep[];
  onMoveOptimistic: (candidateId: number, fromStep: string, toStep: string) => void;
  onRollback: (candidateId: number, fromStep: string) => void;
}

export function useDragAndDrop({
  candidatesByStep,
  interviewSteps,
  onMoveOptimistic,
  onRollback,
}: UseDragAndDropProps) {
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Drop fuera de zona → no hacer nada
    if (!destination) return;

    // Misma columna → no hacer nada
    if (source.droppableId === destination.droppableId) return;

    const candidateId = parseInt(draggableId);
    const destinationStepId = getStepIdByName(destination.droppableId, interviewSteps);
    const candidate = findCandidateById(candidatesByStep, candidateId);

    if (!candidate || destinationStepId === null) return;

    // Optimistic update: mover inmediatamente
    setUpdatingIds(prev => new Set(prev).add(candidateId));
    onMoveOptimistic(candidateId, source.droppableId, destination.droppableId);

    try {
      await updateCandidateStage(candidateId, {
        applicationId: candidate.applicationId,
        currentInterviewStep: destinationStepId,
      });
      // Éxito: el optimistic update ya movió la tarjeta
      showSuccessToast(`Candidato movido a ${destination.droppableId}`);
    } catch (error) {
      // Error: rollback
      onRollback(candidateId, source.droppableId);
      const message = error instanceof Error ? error.message : 'Error al mover candidato';
      showErrorToast(`Error al mover candidato: ${message}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  }, [candidatesByStep, interviewSteps, onMoveOptimistic, onRollback]);

  return { onDragEnd, updatingIds };
}
```

#### Paso 3: Integrar en KanbanBoard

```typescript
// KanbanBoard.tsx (modificado)
<DragDropContext onDragEnd={onDragEnd}>
  <div className="kanban-board d-flex gap-3 overflow-auto pb-3">
    {interviewSteps.map(step => (
      <KanbanColumn
        key={step.id}
        step={step}
        candidates={candidatesByStep.get(step.name) || []}
        updatingIds={updatingIds}
      />
    ))}
  </div>
</DragDropContext>
```

#### Paso 4: Modificar KanbanColumn

```typescript
// KanbanColumn.tsx (modificado)
import { Droppable } from '@hello-pangea/dnd';

const KanbanColumn: React.FC<Props> = ({ step, candidates, updatingIds }) => (
  <Droppable droppableId={step.name} direction="vertical">
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`kanban-column ${snapshot.isDraggingOver ? 'kanban-column--drag-over' : ''}`}
      >
        <h3>{step.name}</h3>
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            index={index}
            isUpdating={updatingIds.has(candidate.id)}
          />
        ))}
        {provided.placeholder}
        {candidates.length === 0 && !snapshot.isDraggingOver && (
          <p className="text-muted small">No hay candidatos en esta fase</p>
        )}
      </div>
    )}
  </Droppable>
);
```

#### Paso 5: Modificar CandidateCard

```typescript
// CandidateCard.tsx (modificado)
import { Draggable } from '@hello-pangea/dnd';
import { Spinner } from 'react-bootstrap';

const CandidateCard: React.FC<Props> = ({ candidate, index, isUpdating }) => (
  <Draggable draggableId={String(candidate.id)} index={index} isDragDisabled={isUpdating}>
    {(provided, snapshot) => (
      <article
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`candidate-card card shadow-sm mb-2 ${snapshot.isDragging ? 'candidate-card--dragging' : ''}`}
        style={{ ...provided.draggableProps.style, opacity: isUpdating ? 0.6 : 1 }}
        data-candidate-id={candidate.id}
        data-testid={`candidate-card-${candidate.id}`}
        role="article"
        aria-label={`Candidato: ${candidate.fullName}, puntuación: ${formatScore(candidate.averageScore)}`}
      >
        <Card.Body className="d-flex justify-content-between align-items-center py-2 px-3">
          <div>
            <Card.Title className="mb-0 small">{candidate.fullName}</Card.Title>
            <small className="text-muted">{formatScore(candidate.averageScore)}</small>
          </div>
          {isUpdating && <Spinner animation="border" size="sm" className="ms-2" />}
        </Card.Body>
      </article>
    )}
  </Draggable>
);
```

### 4.5 Gestión de estado y optimist update

Existen dos enfoques para el estado. Se recomienda el **enfoque A** por simplicidad:

| Enfoque | Descripción | Ventaja |
|---|---|---|
| **A. Estado local en PositionPage** | `PositionPage` mantiene `candidatesByStep: Map<string, CandidateResponse[]>` y expone funciones `moveOptimistic` y `rollback` que mutan el Map | Simple, sin dependencias externas |
| **B. Context o store global** | Usar React Context o un store (Zustand/Redux) para el estado del kanban | Escalable si hay más interacciones |

**Enfoque A recomendado:**
```typescript
// En PositionPage
const [candidatesByStep, setCandidatesByStep] = useState<Map<string, CandidateResponse[]>>(new Map());

const handleMoveOptimistic = useCallback((candidateId: number, fromStep: string, toStep: string) => {
  setCandidatesByStep(prev => {
    const next = new Map(prev);
    const fromList = next.get(fromStep)?.filter(c => c.id !== candidateId) || [];
    const candidate = prev.get(fromStep)?.find(c => c.id === candidateId);
    const toList = next.get(toStep) || [];
    next.set(fromStep, fromList);
    if (candidate) next.set(toStep, [...toList, candidate]);
    return next;
  });
}, []);

const handleRollback = useCallback((candidateId: number, fromStep: string) => {
  // Lógica inversa: devolver el candidato de toStep a fromStep
  // Requiere guardar el "toStep" original en el momento del drop
  // Alternativa: refetchear toda la lista de candidatos (más simple, menos eficiente)
  refetchCandidates(); // <-- Enfoque simplificado
}, []);
```

### 4.6 Notificaciones (Toast)

Se recomienda usar `react-hot-toast` (ligera, ~5KB) o `react-toastify`. Alternativa: implementar un componente simple con Bootstrap `Alert` + estado.

```bash
npm install react-hot-toast
```

```typescript
// helpers/notifications.ts
import toast from 'react-hot-toast';

export const showSuccessToast = (message: string) => toast.success(message, { duration: 3000 });
export const showErrorToast = (message: string) => toast.error(message, { duration: 5000 });
```

### 4.7 CSS para resaltado de columna

Añadir en `App.css` o en `KanbanBoard.css`:

```css
.kanban-column {
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
  border-radius: 8px;
  padding: 12px;
  background-color: #f8f9fa;
  min-width: 280px;
}

.kanban-column--drag-over {
  box-shadow: 0 0 0 3px #0d6efd; /* Bootstrap primary */
  background-color: #e7f1ff;
}

.candidate-card--dragging {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: rotate(2deg);
}
```

### 4.8 Patrones a seguir

- **Optimistic UI**: Mover la tarjeta antes de la respuesta de la API. Revertir solo en caso de error.
- **Estado `updating` por tarjeta**: Usar un `Set<number>` (candidateIds) en lugar de un booleano global. Cada tarjeta consulta si su ID está en el set.
- **Función pura `getStepIdByName`**: Separar la lógica de mapeo nombre→ID del componente. Fácil de testear.
- **Handle de errores del backend**: Distinguir entre errores del servidor (400/404/500) y errores de red (timeout, servidor caído). Los primeros pueden mostrar el mensaje del backend; los segundos, un mensaje genérico "Error de conexión".
- **Rollback vía refetch**: Si el estado se vuelve inconsistente (múltiples drags rápidos), la opción más segura es refetchear toda la lista de candidatos desde la API.

### 4.9 Accesibilidad

- `@hello-pangea/dnd` proporciona `aria-grabbed`, `role="button"` y manejadores de teclado por defecto.
- Añadir `aria-roledescription="draggable candidate card"` para lectores de pantalla.
- Documentar como `TODO MVP-2: Implementar arrastre con teclado` — la estructura base ya está lista.

---

## 5. Edge cases y estados de error

| Escenario | Comportamiento esperado | Test |
|---|---|---|
| Soltar la tarjeta fuera de cualquier columna (`destination === null`) | No pasa nada, la tarjeta vuelve a su posición original | T1 |
| Soltar en la misma columna de origen | No se llama a la API, no hay movimiento | T2 |
| Soltar en columna diferente → API exitosa | Tarjeta se queda en la nueva columna + toast éxito | T3, T5, T17 |
| Soltar en columna diferente → API error 400 | Rollback + toast error | T6 |
| Soltar en columna diferente → API error 404 | Rollback + toast "Aplicación no encontrada" | T7 |
| Soltar en columna diferente → error de red (sin respuesta) | Rollback + toast "Error de conexión" | T8 |
| Arrastre rápido: dos drops consecutivos antes de que el primero termine | El segundo drop debe respetar el estado actualizado del primero. Si el primer candidato ya se movió, el segundo opera sobre el nuevo estado | T19 |
| La columna destino no existe en `interviewSteps` (droppableId inválido) | `getStepIdByName` retorna null, no se hace nada | T21 |
| Candidato sin `applicationId` | No se puede llamar a la API. Mostrar error en consola, no hacer optimistic update | — |
| La tarjeta está en estado `updating` y se intenta arrastrar de nuevo | `isDragDisabled={true}` → no se puede arrastrar | T9 |
| Columna destino vacía (sin candidatos) | Se puede soltar la tarjeta en la columna vacía sin problema | T13 |
| Columna origen se queda vacía tras mover el único candidato | La columna muestra "No hay candidatos en esta fase" | T12 (002) |
| El usuario mueve la tarjeta mientras hay un error de red persistente | Rollback + toast. El estado queda consistente. Intentos repetidos también hacen rollback | T8 |
| Múltiples candidatos en misma columna, se arrastra el que está en posición `index: 1` | El candidateId se mapea correctamente, no se usan índices para identificar | T14 |
| El candidato se arrastra muy rápido, soltando a los pocos milisegundos | El evento de drop captura el destino correctamente (comportamiento del navegador) | T19 |
| Dos candidatos con el mismo nombre en columnas diferentes | Se identifican por `id` numérico, no por nombre | T14 |
| El backend responde con un `currentInterviewStep` diferente al enviado | El optimistic update ya puso la tarjeta en la columna destino. La respuesta del backend confirma (no contradice). Si contradice, el dato del backend prevalece (pero esto no se maneja en MVP — documentar como riesgo) | — |

### Edge cases adicionales (sistema/UX)

| Escenario | Comportamiento esperado |
|---|---|
| El usuario arrastra una tarjeta y pulsa Escape | `@hello-pangea/dnd` cancela el arrastre por defecto. La tarjeta vuelve a su posición original |
| El usuario hace clic en la tarjeta sin arrastrar | No se dispara `onDragEnd`. La tarjeta permanece en su columna |
| Ventana del navegador redimensionada durante el arrastre | El DnD mantiene el contexto. La tarjeta sigue al cursor |
| El token de sesión expira entre el drag y el drop | La API responde 401/403 → error → rollback + toast "Sesión expirada" |
| El candidato es eliminado por otro usuario entre drag y drop | La API responde 404 → rollback + toast "El candidato ya no está en este proceso" |
| El usuario arrastra la tarjeta, suelta, y navega a otra página antes de que termine la petición | El componente se desmonta. La petición axios continúa pero al resolver, el setState ya no hace nada (React lo maneja con el flag de mounted) |

---

## 6. Escenarios de test detallados

Para cada criterio de aceptación (CA), se definen los tests correspondientes con su descripción detallada.

### CA1: Tarjetas arrastrables con el mouse

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T12 | Integración | El board renderiza `<DragDropContext>` | `screen.getByRole('region', { name: /kanban/i })` o verificar que `DragDropContext` se renderiza |
| T13 | Integración | Cada columna tiene un `<Droppable droppableId={step.name}>` | Verificar atributo `data-rbd-droppable-id` (interno de DnD) |
| T14 | Integración | Cada tarjeta tiene un `<Draggable draggableId={String(candidate.id)}>` | Verificar atributo `data-rbd-draggable-id` |

### CA2: Resaltado visual de columna destino

| Test ID | Tipo | Descripción |
|---|---|---|
| T15 | Integración | Simular que una tarjeta está sobre una columna (con `container.getByTestId` y drag events) y verificar que la columna tiene clase `kanban-column--drag-over` |

### CA3: Llamada a API al soltar en columna diferente

| Test ID | Tipo | Descripción |
|---|---|---|
| T1 | Unitario | `onDragEnd({ draggableId: "1", source: { droppableId: "A" }, destination: null })` → no se llama a API |
| T2 | Unitario | `onDragEnd({ draggableId: "1", source: { droppableId: "A" }, destination: { droppableId: "A" } })` → no se llama a API |
| T3 | Unitario | `onDragEnd({ draggableId: "1", source: { droppableId: "A" }, destination: { droppableId: "B" } })` → se llama a `updateCandidateStage(1, { applicationId: X, currentInterviewStep: stepBId })` |

### CA4: Estado de carga en tarjeta

| Test ID | Tipo | Descripción |
|---|---|---|
| T9 | Unitario | Al llamar a `onDragEnd` con destino diferente, el candidateId aparece en `updatingIds` |
| T16 | Integración | Renderizar una tarjeta con `isUpdating={true}` → se renderiza `<Spinner>` de Bootstrap |

### CA5: Éxito → confirmar movimiento + notificación

| Test ID | Tipo | Descripción |
|---|---|---|
| T5 | Unitario | Mockear `updateCandidateStage` para que resuelva OK → verificar que el candidato permanece en columna destino |
| T17 | Integración | Mockear API exitosa → verificar que se muestra toast de éxito |

### CA6: Error → rollback + notificación de error

| Test ID | Tipo | Descripción |
|---|---|---|
| T6 | Unitario | Mockear `updateCandidateStage` para que rechace con 400 → verificar que el candidato vuelve a columna origen |
| T7 | Unitario | Mockear `updateCandidateStage` para que rechace con 404 → verificar rollback + mensaje específico |
| T8 | Unitario | Mockear error de red → verificar rollback + mensaje genérico |
| T18 | Integración | Mockear API con error → verificar toast de error |

### CA7: Uso de `@hello-pangea/dnd`

| Test ID | Tipo | Descripción |
|---|---|---|
| — | Verificación | `package.json` contiene `@hello-pangea/dnd` (no requiere test automatizado, se verifica en code review) |

### CA8: Experiencia fluida

| Test ID | Tipo | Descripción |
|---|---|---|
| T4 | Unitario | Verificar que el optimistic update ocurre en el mismo frame que `onDragEnd` (el estado se actualiza antes de que la promesa se resuelva) |

### CA9: Accesibilidad documentada como mejora futura

| Verificación | Tipo | Descripción |
|---|---|---|
| — | Code review | Verificar que existe el comentario `TODO MVP-2` en el `onDragEnd` y que las propiedades `aria-*` están presentes |

---

## 7. Dependencias no documentadas

| Dependencia | Afecta a | Nota |
|---|---|---|
| **`@hello-pangea/dnd` debe instalarse** | Este ticket | No está en `package.json`. Instalar con `npm install @hello-pangea/dnd`. Alternativa: `react-beautiful-dnd` (el fork original, sin mantenimiento). |
| **`react-hot-toast` o similar debe instalarse** | Este ticket | Si no hay librería de toasts en el proyecto, instalar una. Alternativa: implementar toasts con Bootstrap `Alert` + estado local. |
| **Tipos `ApplicationData` en `types/position.ts`** | Este ticket | Se necesita el tipo para la respuesta de `updateCandidateStage`. Ya definido en 001 (enriched). Verificar que incluya `candidateId` y `applicationId`. |
| **`CandidateResponse` debe incluir `id` y `applicationId`** | Este ticket | El endpoint `GET /position/:id/candidates` devuelve `fullName`, `currentInterviewStep`, `averageScore`. **NO incluye `id` ni `applicationId`**. Esto es un problema: el drag necesita estos campos. |
| **⬆️ EXTENDER ENDPOINT O MAPEAR POR ÍNDICE** | Este ticket (bloqueante) | **Solución propuesta**: Modificar el endpoint `GET /position/:id/candidates` para que incluya `id` (candidateId) y `applicationId`. Alternativa: usar el índice del array como identificador (frágil). **Discutir con backend.** |
| **`KanbanColumn` debe ser `Droppable`** | Este ticket | Requiere refactor del componente KanbanColumn (creado en 001) para que use `<Droppable>` de `@hello-pangea/dnd`. |
| **`CandidateCard` debe ser `Draggable`** | Este ticket | Requiere refactor del componente CandidateCard (creado en 002) para que use `<Draggable>` de `@hello-pangea/dnd`. |
| **Estado `candidatesByStep` debe ser mutable** | Este ticket | El optimistic update requiere mutar el estado local. Si los candidatos vienen de un fetch que no se guarda en estado local mutable, hay que refactorizar. |
| **Este ticket** | `004-layout-responsivo-movil.md` | El layout responsivo debe funcionar con el DnD activo. |

### ⚠️ Bloqueante crítico: `id` y `applicationId` en los candidatos

El endpoint `GET /position/:id/candidates` (según `api-spec.yaml` y la respuesta del backend) devuelve solo:

```json
[
  { "fullName": "Jane Smith", "currentInterviewStep": "Technical Interview", "averageScore": 4 }
]
```

**NO incluye `id` ni `applicationId`**, que son necesarios para:
- `draggableId` en `<Draggable draggableId={candidate.id}>`
- `applicationId` en el payload de `PUT /candidates/:id`

**Propuesta de solución**:
1. Hablar con backend para que añadan `id` y `applicationId` a la respuesta de `GET /position/:id/candidates`.
2. Mientras tanto, usar el índice del array como `id` (con advertencia: es frágil si el orden cambia).
3. El `applicationId` podría obtenerse de otra fuente (ej: un map estado global).

> **Decisión para este ticket**: Asumimos que el endpoint será extendido para incluir `id: number` y `applicationId: number`. Si no es posible, se usará una estrategia de mapeo por `fullName` (no recomendado) o se hará un fetch adicional por candidato.

---

## 8. Verificación INVEST

| Criterio | Cumple | Nota |
|---|---|---|
| **I**ndependent | ⚠️ Parcial | Depende de 002 (tarjetas renderizadas), de que el endpoint de candidatos incluya `id` y `applicationId` (extensión del backend), y de la instalación de `@hello-pangea/dnd`. Sin estas, el ticket no puede completarse. |
| **N**egotiable | ✅ | La elección del gestor de toasts (`react-hot-toast` vs `react-toastify` vs Bootstrap Alert), la implementación del rollback (refetch vs reverse map), y el enfoque de estado (local vs Context) son discutibles. |
| **V**aluable | ✅ | El drag & drop es la interacción principal del kanban. Sin este ticket, el kanban es solo de consulta. |
| **E**stimable | ✅ | ~1.5-2 días (instalación DnD + hook onDragEnd + optimistic update + rollback + toasts + tests + refactor de CandidateCard/KanbanColumn). |
| **S**mall | ✅ | Esfuerzo M (original). Se mantiene dentro del límite de 2 días. **No requiere división adicional.** |
| **T**estable | ✅ | 24 tests definidos cubriendo: lógica de onDragEnd (11 tests), integración DnD (8 tests), helpers (3 tests), notificaciones (2 tests). Todos los criterios de aceptación tienen test(s) asociados. |

### ¿Supera el límite de 2 días? — Evaluación

| Componente | Tiempo estimado |
|---|---|
| Instalación y configuración de `@hello-pangea/dnd` | 0.5h |
| Creación del hook `useDragAndDrop` con lógica de optimistic update | 2h |
| Refactor de `CandidateCard` para ser `<Draggable>` | 1h |
| Refactor de `KanbanColumn` para ser `<Droppable>` | 0.5h |
| Refactor de `KanbanBoard` para integrar `<DragDropContext>` | 0.5h |
| Implementación de toasts (instalación + componente) | 1h |
| CSS para resaltado y transiciones | 0.5h |
| Tests (24 tests) | 3h |
| Pruebas manuales y debugging | 1h |
| **Total** | **~10h (1.25 días)** |

✅ **Dentro del límite de 2 días.**

---

## 9. Resumen de archivos a crear/modificar

| Archivo | Acción | Propósito |
|---|---|---|
| `frontend/package.json` | MODIFICAR | Añadir `@hello-pangea/dnd` y `react-hot-toast` a dependencies |
| `frontend/src/hooks/useDragAndDrop.ts` | CREAR | Hook con lógica de onDragEnd, optimistic update, rollback |
| `frontend/src/helpers/dragAndDropHelpers.ts` | CREAR | Funciones `getStepIdByName`, `findCandidateById` |
| `frontend/src/helpers/notifications.ts` | CREAR (o usar directamente) | Funciones `showSuccessToast`, `showErrorToast` |
| `frontend/src/components/KanbanBoard.tsx` | MODIFICAR | Envolver en `<DragDropContext>`, pasar `onDragEnd` |
| `frontend/src/components/KanbanColumn.tsx` | MODIFICAR | Envolver contenido en `<Droppable>`, estado `isDraggingOver` |
| `frontend/src/components/CandidateCard.tsx` | MODIFICAR | Envolver en `<Draggable>`, añadir `isDragDisabled`, spinner, estado dragging |
| `frontend/src/types/position.ts` | MODIFICAR | Añadir `DragItem`, `UpdatingState`, `ToastType` (opcional) |
| `frontend/src/App.css` | MODIFICAR | Añadir `.kanban-column--drag-over`, `.candidate-card--dragging` |
| `frontend/src/__tests__/useDragAndDrop.test.ts` | CREAR | Tests del hook (T1–T11) |
| `frontend/src/__tests__/KanbanBoard.test.tsx` | CREAR (o MODIFICAR desde 002) | Tests de integración DnD (T12–T19) |
| `frontend/src/__tests__/helpers.test.ts` | CREAR | Tests de helpers (T20–T24) |

---

## 10. Cambios respecto al original

| Aspecto | Original | Enriquecido |
|---|---|---|
| **Tests** | Mencionados genéricamente en DoD | Plan TDD completo con **24 tests**, IDs, clasificados por tipo (unitario/integración) y fase |
| **Criterios de aceptación** | 9 checkboxes genéricos | 9 CA expandidos en ~50 checkboxes concretos con referencia al test ID |
| **Endpoint real** | Usa `PUT /candidates/:id/stage` (epic) | Corregido a `PUT /candidates/:id` (backend real) |
| **Payload API** | Menciona `applicationId: string`, `currentInterviewStep: string` | Corregido: el controlador hace `parseInt` de ambos; se recomienda enviar como `number` |
| **Edge cases** | No documentados | 20 edge cases documentados con comportamiento esperado |
| **Estructura de archivos** | Solo mención genérica a "drag & drop" | Árbol completo de archivos a crear/modificar con 12 archivos identificados |
| **Librería DnD** | Sugiere `@hello-pangea/dnd` | Confirmado como dependencia a instalar, con ejemplos de uso concretos |
| **Optimistic update** | Mencionado brevemente | Algoritmo completo con código de ejemplo: `handleMoveOptimistic`, `handleRollback`, estado `updatingIds` |
| **Rollback** | "revertir si la API falla" | Dos estrategias documentadas: rollback manual vs refetch completo |
| **Notificaciones** | "toast/notificación" | Librería recomendada (`react-hot-toast`), ejemplos de implementación, tipos de mensajes |
| **Accesibilidad** | "opcional para MVP" | Documentado como mejora futura, con estructura base preparada (aria attributes, comentario TODO) |
| **Dependencias** | Solo cross-tickets (002, 004) | Añadidas dependencias de librerías, y **bloqueante crítico**: endpoint de candidatos no incluye `id`/`applicationId` |
| **Verificación INVEST** | No incluida | Tabla INVEST con cumplimiento verificado + estimación detallada de tiempo |
| **Resaltado visual** | "CSS sin afectar layout" | Especificación concreta: `box-shadow: 0 0 0 3px #0d6efd`, transición 0.2s, clases CSS definidas |

---

## 11. Notas adicionales

### 11.1 ⚠️ Bloqueante: endpoint GET /position/:id/candidates no incluye id ni applicationId

Este es el punto más crítico. Sin `id` y `applicationId` en cada candidato, no se puede:
- Identificar la tarjeta arrastrada (`draggableId`)
- Construir el payload de `PUT /candidates/:id` (necesita `applicationId`)

**Acción requerida**: Coordinar con el equipo de backend para extender la respuesta de `GET /position/:id/candidates` e incluir:
```json
{
  "id": 1,
  "applicationId": 1,
  "fullName": "Jane Smith",
  "currentInterviewStep": "Technical Interview",
  "averageScore": 4
}
```

Si esto no es posible, **alternativa de contingencia**:
- Usar el índice del array como `draggableId` (NO recomendado: el orden puede cambiar)
- Hacer una llamada adicional a `GET /positions/:id/applications` si existe
- Pasar el `id` como prop adicional desde PositionPage si se obtiene por otro medio

### 11.2 Suposiciones

- El endpoint de candidatos será extendido para incluir `id` y `applicationId` (sección 11.1).
- `updateCandidateStage` ya existe en `api.ts` con la firma correcta (creado en 001).
- Los `interviewSteps` tienen `id` numérico que se usa como `currentInterviewStep` en el payload.
- No hay librería de drag & drop preexistente (se instalará `@hello-pangea/dnd`).
- No hay librería de toasts preexistente (se instalará `react-hot-toast`).
- El estado del kanban (candidatos por columna) es manejado localmente en `PositionPage` o `KanbanBoard`.

### 11.3 Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El endpoint de candidatos no incluye `id`/`applicationId` | **Alto** — el ticket no puede completarse | Hablar con backend antes de empezar. Tener plan de contingencia (mapeo por índice). |
| `@hello-pangea/dnd` tiene breaking changes con React 18 | **Medio** — errores de compilación | Verificar compatibilidad en la documentación. Alternativa: `react-beautiful-dnd` (versión estable). |
| Múltiples drops rápidos causan estado inconsistente | **Medio** — la tarjeta puede aparecer en dos columnas | Deshabilitar drag en tarjetas con `isUpdating=true`. Usar refetch como respaldo. |
| El rollback no restaura el orden original si habían ocurrido otros movimientos | **Bajo** — el orden dentro de la columna no es crítico para MVP | El rollback devuelve el candidato a la columna, no a la posición exacta. Acceptable para MVP. |

### 11.4 Estrategia de pruebas manuales

Además de los tests automatizados, verificar manualmente:

1. Arrastrar cada tarjeta a cada columna posible → todas deben funcionar
2. Arrastrar muy rápido entre dos columnas → el estado debe ser consistente
3. Desconectar el servidor y arrastrar → debe mostrar error + rollback
4. Iniciar un arrastre y pulsar Escape → la tarjeta vuelve
5. Arrastrar a la misma columna → no debe pasar nada
6. Recargar la página → el estado viene del servidor (los cambios persisten)
