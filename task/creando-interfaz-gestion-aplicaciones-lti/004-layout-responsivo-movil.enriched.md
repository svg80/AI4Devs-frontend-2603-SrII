# [ENRIQUECIDO TDD] Añadir layout responsivo para móvil

> **Archivo original**: `004-layout-responsivo-movil.md`
> **Propósito del enriquecimiento**: Añadir plan de tests TDD (Red-Green-Refactor), expandir criterios de aceptación, documentar edge cases (orientación, zoom, tablets), mapear cada criterio a escenarios de test concretos, y verificar compatibilidad táctil con la librería DnD real del proyecto.

---

## 1. Descripción refinada

Una vez que el tablero kanban funcional con drag & drop está operativo (tarea `003`), este ticket adapta la interfaz para que sea completamente utilizable en dispositivos móviles y tablets.

### Flujo de usuario en móvil

1. **Carga inicial**: El usuario accede a `/positions/:id` desde un dispositivo con viewport < 768px.
2. **Layout vertical**: Las columnas del kanban se apilan una debajo de otra ocupando el 100% del ancho disponible.
3. **Navegación**: El título de la posición y la flecha de retroceso se muestran sin desbordamiento, con padding adecuado.
4. **Interacción táctil**: El usuario puede arrastrar tarjetas con el dedo (touch events) gracias al soporte nativo de `@hello-pangea/dnd` para dispositivos táctiles.
5. **Scroll vertical**: El usuario hace scroll vertical para ver todas las fases. No hay scroll horizontal forzado.
6. **Área táctil suficiente**: Todas las tarjetas y elementos interactivos tienen un área mínima de 44x44px.

### Alcance y límites

- **Incluye**: Media queries mobile-first, layout vertical en < 768px, touch support verification, área táctil 44x44px, ajuste de header/navegación, eliminación de scroll horizontal forzado.
- **NO incluye**: Modo acordeón para fases (se prioriza el scroll vertical simple como opción más usable), animaciones de transición entre layouts, versión tablet landscape dedicada (hereda del layout de escritorio con columnas más estrechas), PWA o soporte offline.
- **NO incluye**: Test en dispositivos físicos reales (solo emulación en Chrome DevTools y tests automatizados de layout).

### Consideraciones importantes

- **Enfoque mobile-first**: Los estilos base (sin media query) son para móvil. Las media queries `min-width` añaden el layout horizontal para desktop.
- **Touch support**: `@hello-pangea/dnd` (instalado en tarea `003`) soporta eventos táctiles de forma nativa. No es necesario un backend táctil adicional como con `react-dnd`. Sin embargo, hay que verificar que las columnas/tarjetas no tengan `touch-action: none` que pueda interferir con el scroll nativo del navegador.
- **Bootstrap Grid**: Usar las utilidades responsive de Bootstrap 5.3 ya disponible en el proyecto (`d-flex flex-column flex-md-row`, `col-12 col-md-4`, etc.) para el cambio de layout.
- **Overflow**: El contenedor principal `.kanban-board` cambia de `overflow-x: auto` (desktop, scroll horizontal entre columnas) a `overflow-y: auto` (móvil, scroll vertical entre columnas).

---

## 2. Plan de tests TDD (Red-Green-Refactor)

### 2.1 Stack de testing

- **Framework**: Jest (vía `react-scripts test`, configurado en `jest.config.js`)
- **Librería**: `@testing-library/react` + `@testing-library/jest-dom` (ya instalados)
- **Simulación de viewport**: Para tests de layout responsivo, usar `window.resizeTo(width, height)` o mockear `window.innerWidth`. Alternativa: usar `jest-dom` para verificar clases CSS condicionales.
- **Touch events**: Para tests de interacción táctil, `@testing-library/user-event` con `pointer({ pointerType: 'touch' })`.
- **Drag & drop en táctil**: `@hello-pangea/dnd` proporciona su propia simulación de arrastre para tests; verificar que los touch events están habilitados.

### 2.2 Ciclo Red-Green-Refactor

Cada test se escribe **antes** del código de implementación:

1. 🔴 **Red** → escribir el test que describe el comportamiento deseado (falla porque el código no existe)
2. 🟢 **Green** → escribir el código mínimo para que pase
3. 🔵 **Refactor** → limpiar y optimizar manteniendo los tests en verde

### 2.3 Tests de layout responsivo (CSS / clases condicionales)

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T1 | En viewport < 768px, el contenedor `.kanban-board` tiene clase/flex `flex-column` (columnas apiladas) | 🔴🟢🔵 | Layout |
| T2 | En viewport ≥ 768px, el contenedor `.kanban-board` tiene clase/flex `flex-row` (columnas en horizontal) | 🔴🟢🔵 | Layout |
| T3 | En viewport < 768px, cada columna ocupa el 100% del ancho del contenedor (clase `w-100` o `col-12`) | 🔴🟢🔵 | Layout |
| T4 | En viewport ≥ 768px, cada columna tiene un ancho mínimo de 280px con `flex-shrink: 0` | 🔴🟢🔵 | Layout |
| T5 | En viewport < 768px, el header (título + back button) tiene padding mínimo de 12px a los lados | 🔴🟢🔵 | Header |
| T6 | En viewport < 768px, el título de la posición no se desborda (texto truncado con `text-truncate` si es muy largo) | 🔴🟢🔵 | Header |
| T7 | El contenedor principal **nunca** tiene `overflow-x: hidden` en móvil (debe permitir scroll vertical) | 🔴🟢🔵 | Scroll |
| T8 | No hay scroll horizontal forzado en ningún viewport (el `overflow-x` está en `auto` y el contenido no excede el viewport) | 🔴🟢🔵 | Scroll |
| T9 | En viewport < 768px, las tarjetas tienen `min-height: 44px` o padding que garantice área táctil ≥ 44x44px | 🔴🟢🔵 | Touch target |
| T10 | Los elementos interactivos (botón de retroceso, tarjetas draggables) tienen área táctil mínima de 44x44px | 🔴🟢🔵 | Touch target |
| T11 | En viewport entre 768px y 991px (tablet vertical), las columnas se muestran en horizontal con un ancho adaptativo (ej: 2 columnas por fila con `col-md-6`) | 🔴🟢🔵 | Tablet |

### 2.4 Tests de interacción táctil (Touch + Drag & Drop)

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T12 | El drag & drop funciona con eventos táctiles (touch start → touch move → touch end) — el `onDragEnd` se dispara correctamente | 🔴🟢🔵 | Touch DnD |
| T13 | Al arrastrar una tarjeta con el dedo, la columna destino se resalta visualmente (misma clase `kanban-column--drag-over` que en mouse) | 🔴🟢🔵 | Touch DnD |
| T14 | El scroll vertical de la página no se bloquea mientras se arrastra una tarjeta en modo táctil (`touch-action: auto` en columnas, no `touch-action: none`) | 🔴🟢🔵 | Touch DnD |
| T15 | Si el usuario hace scroll mientras arrastra, el drag context se mantiene correctamente | 🔴🟢🔵 | Touch DnD |
| T16 | En dispositivo táctil, al soltar la tarjeta fuera de una columna destino válida, la tarjeta vuelve a su posición original | 🔴🟢🔵 | Touch DnD |

### 2.5 Tests de integración: KanbanBoard responsivo

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T17 | El KanbanBoard se renderiza sin scroll horizontal en viewport de 375px (iPhone SE) | 🔴🟢🔵 | Integración |
| T18 | El KanbanBoard se renderiza sin scroll horizontal en viewport de 390px (iPhone 12/13/14) | 🔴🟢🔵 | Integración |
| T19 | El KanbanBoard se renderiza sin scroll horizontal en viewport de 430px (iPhone 15 Pro Max) | 🔴🟢🔵 | Integración |
| T20 | El KanbanBoard se renderiza sin scroll horizontal en viewport de 768px (iPad Mini vertical) | 🔴🟢🔵 | Integración |
| T21 | El KanbanBoard se renderiza sin scroll horizontal en viewport de 1024px (iPad horizontal) | 🔴🟢🔵 | Integración |
| T22 | En viewport < 768px, el mensaje "No hay candidatos en esta fase" se muestra correctamente sin romper el layout | 🔴🟢🔵 | Empty state |

### 2.6 Tests de accesibilidad y usabilidad móvil

| # | Test | Ciclo | Tipo |
|---|---|---|---|
| T23 | Todos los elementos interactivos tienen un `aria-label` descriptivo (lectores de pantalla en móvil) | 🔴🟢🔵 | A11y |
| T24 | El botón de retroceso tiene `aria-label` y un tamaño táctil ≥ 44x44px | 🔴🟢🔵 | A11y |
| T25 | El área de drop de cada columna es lo suficientemente grande para ser tocada con el dedo en móvil (verificado visualmente, sin test automatizado — se marca en DoD como verificación manual) | — | A11y (manual) |

### Resumen de tests

| Fase | Tests | Archivo |
|---|---|---|
| Layout responsivo CSS/clases | T1–T11 | `KanbanBoard.test.tsx` |
| Interacción táctil DnD | T12–T16 | `KanbanBoard.test.tsx` o `useDragAndDrop.test.ts` |
| Integración viewports | T17–T22 | `KanbanBoard.test.tsx` |
| Accesibilidad móvil | T23–T25 | `KanbanBoard.test.tsx` |
| **Total** | **25 tests** | |

---

## 3. Criterios de aceptación expandidos

Los criterios del ticket original se expanden en checkboxes concretos y verificables, con referencia a los tests que los cubren.

### CA1: Columnas en vertical en móvil (< 768px)

- [ ] El contenedor `.kanban-board` aplica `flex-column` en viewport < 768px (T1)
- [ ] Cada columna ocupa `width: 100%` del contenedor padre (T3)
- [ ] Las columnas se renderizan una debajo de otra sin solapamiento (T1)
- [ ] El orden de las columnas respeta `orderIndex` (T1)

### CA2: Columnas en horizontal en desktop (≥ 768px)

- [ ] El contenedor `.kanban-board` aplica `flex-row` con `flex-wrap: nowrap` en viewport ≥ 768px (T2)
- [ ] Cada columna tiene `min-width: 280px` y `flex-shrink: 0` (T4)
- [ ] Si hay más columnas de las que caben en el viewport, aparece scroll horizontal (T4)
- [ ] En tablet (768px–991px), las columnas se adaptan al ancho disponible con responsive grid (T11)

### CA3: Área táctil mínima de 44x44px

- [ ] Las tarjetas (`CandidateCard`) tienen `min-height: 44px` y altura suficiente para que el área táctil total sea ≥ 44x44px (T9)
- [ ] El botón de retroceso tiene `min-width: 44px` y `min-height: 44px` (T10)
- [ ] Cualquier otro elemento interactivo (botones, enlaces) cumple con el estándar WCAG 2.1 Target Size (T10)
- [ ] No hay elementos interactivos superpuestos o demasiado cercanos que puedan causar toques accidentales (verificación manual)

### CA4: Título y navegación visibles correctamente en móvil

- [ ] El título de la posición no se desborda horizontalmente en viewports pequeños (usa `text-truncate` si es necesario) (T6)
- [ ] El header tiene `padding-left: 12px` y `padding-right: 12px` (o equivalente) en viewport < 768px (T5)
- [ ] La flecha de retroceso está alineada verticalmente con el título (T5)
- [ ] El header no tiene un alto excesivo (> 80px) en móvil (verificación manual)

### CA5: Drag & drop funciona en táctil

- [ ] `@hello-pangea/dnd` (ya instalado en 003) soporta eventos táctiles: el `onDragEnd` se ejecuta tras gestos touch (T12)
- [ ] El resaltado visual de columna (`kanban-column--drag-over`) funciona en interacciones táctiles (T13)
- [ ] El scroll vertical de la página no se bloquea durante el arrastre táctil (T14)
- [ ] Si el usuario mueve el dedo fuera de la columna destino, la tarjeta vuelve a su lugar (T16)

### CA6: Sin scroll horizontal forzado en ningún viewport

- [ ] En viewport de 375px (iPhone SE), no hay scroll horizontal (T17)
- [ ] En viewport de 390px (iPhone 12/13/14), no hay scroll horizontal (T18)
- [ ] En viewport de 430px (iPhone 15 Pro Max), no hay scroll horizontal (T19)
- [ ] En viewport de 768px (iPad Mini), no hay scroll horizontal (T20)
- [ ] En viewport de 1024px (iPad horizontal), no hay scroll horizontal (T21)
- [ ] El contenedor principal no tiene `overflow: hidden` que pueda romper el layout responsivo (T7)

### CA7: Enfoque mobile-first

- [ ] Los estilos base (sin `@media`) definen el layout móvil (T1, T3)
- [ ] Las media queries usan `min-width` (mobile-first) no `max-width` (desktop-first) (T1, T2)
- [ ] No hay estilos desktop que se apliquen por defecto y luego se sobrescriban para móvil (revisión de código)

---

## 4. Notas de implementación

### 4.1 Archivos a modificar/crear

```
frontend/src/
├── components/
│   ├── KanbanBoard.tsx                       # [MODIFICAR] Añadir clases responsive, wrapper container
│   ├── KanbanColumn.tsx                      # [MODIFICAR] Ajustar ancho en móvil, touch-action
│   └── CandidateCard.tsx                     # [MODIFICAR] Ajustar touch target mínimo 44px
├── pages/
│   └── PositionPage.tsx                      # [MODIFICAR] Ajustar header para móvil (padding, truncate)
├── styles/
│   └── kanban-responsive.css                 # [CREAR] Estilos específicos responsive (o añadir a App.css)
└── __tests__/
    └── KanbanBoard.test.tsx                  # [MODIFICAR desde 003] Añadir tests responsivos y táctiles
```

### 4.2 Estrategia de layout con Bootstrap 5

Bootstrap 5.3 ya está disponible. Aprovechar sus clases responsive:

**KanbanBoard.tsx** — Layout principal:
```tsx
// Desktop: columnas en fila horizontal con scroll
// Móvil: columnas apiladas verticalmente
<div className="kanban-board d-flex flex-column flex-md-row gap-3 pb-3 overflow-auto">
  {interviewSteps.map(step => (
    <KanbanColumn key={step.id} step={step} ... />
  ))}
</div>
```

**KanbanColumn.tsx** — Ancho de columna:
```tsx
// Desktop: ancho fijo mínimo con flex-shrink-0
// Móvil: 100% del ancho
<div
  ref={provided.innerRef}
  {...provided.droppableProps}
  className={`
    kanban-column
    w-100                 /* móvil: ocupa todo el ancho */
    flex-shrink-0         /* desktop: no se encoge */
    ${snapshot.isDraggingOver ? 'kanban-column--drag-over' : ''}
  `}
  style={{ minWidth: '280px' }}  /* desktop: ancho mínimo */
>
```

**CandidateCard.tsx** — Touch target:
```tsx
<article
  className="candidate-card card shadow-sm mb-2 py-3 px-3"
  style={{ minHeight: '44px' }}
  ...
>
```

**Header de PositionPage.tsx** — Responsive:
```tsx
<div className="d-flex align-items-center gap-2 px-3 px-md-4 py-3">
  <Link
    to="/positions"
    className="btn btn-outline-secondary flex-shrink-0 d-flex align-items-center justify-content-center"
    style={{ minWidth: '44px', minHeight: '44px' }}
    aria-label="Volver al listado de posiciones"
  >
    ←
  </Link>
  <h1 className="h4 mb-0 text-truncate">{positionName}</h1>
</div>
```

### 4.3 Media queries específicas (fallback si no se usa Bootstrap)

Si se prefiere CSS personalizado en lugar de clases Bootstrap:

```css
/* kanban-responsive.css — Mobile-first */

/* Base: móvil (< 768px) */
.kanban-board {
  display: flex;
  flex-direction: column;    /* apilado vertical */
  gap: 1rem;
  overflow-y: auto;          /* scroll vertical */
  overflow-x: hidden;        /* sin scroll horizontal */
  padding-bottom: 1rem;
}

.kanban-column {
  width: 100%;               /* ocupa todo el ancho */
  min-width: unset;
  flex-shrink: 1;
  touch-action: auto;        /* no bloquear scroll nativo */
}

.candidate-card {
  min-height: 44px;          /* touch target mínimo */
}

/* Desktop (≥ 768px) */
@media (min-width: 768px) {
  .kanban-board {
    flex-direction: row;     /* layout horizontal */
    overflow-x: auto;        /* scroll horizontal entre columnas */
    overflow-y: hidden;
  }

  .kanban-column {
    width: auto;
    min-width: 280px;
    flex-shrink: 0;          /* no encoger */
  }
}

/* Tablet vertical (768px - 991px) — opcional: 2 columnas */
@media (min-width: 768px) and (max-width: 991px) {
  .kanban-board {
    flex-wrap: wrap;
  }
  .kanban-column {
    flex: 0 0 calc(50% - 0.5rem); /* 2 columnas por fila */
  }
}
```

### 4.4 Soporte táctil con @hello-pangea/dnd

`@hello-pangea/dnd` (instalado en tarea `003`) **soporta eventos táctiles de forma nativa**. No se requiere configuración adicional. Sin embargo, hay que tener en cuenta:

1. **touch-action**: El contenedor de cada columna NO debe tener `touch-action: none`. Esto es importante porque el scroll vertical de la página puede bloquearse si se aplica `touch-action: none` en área donde se hace drag.
   - ❌ `style={{ touchAction: 'none' }}` — BLOQUEA el scroll
   - ✅ `touch-action: auto` (por defecto) — permite scroll

2. **Configuración del DragDropContext**: No es necesaria ninguna prop especial. `@hello-pangea/dnd` detecta automáticamente el tipo de interacción (mouse vs touch) y usa los eventos correspondientes.

3. **Umbral de activación táctil**: Por defecto, `@hello-pangea/dnd` requiere que el dedo se mueva ~5px antes de iniciar el arrastre (para distinguir entre tap y drag). Si se desea cambiar, usar la prop `dragHandleUsageInstructions` o controlar con `DragDropContext` > `sensors`.

4. **Verificación manual en emulación táctil**: Probar con Chrome DevTools en modo dispositivo táctil:
   - Arrastrar tarjeta con el cursor (simula touch) → debe funcionar
   - Hacer scroll vertical con dos dedos (simulación) → no debe interferir con el drag activo
   - Tap (toque sin arrastre) → no debe disparar onDragEnd

### 4.5 Mecanismo de test para viewports

Para simular diferentes viewports en tests:

```typescript
// Helper para tests responsivos
function setViewport(width: number, height: number = 800) {
  // @ts-ignore
  window.innerWidth = width;
  // @ts-ignore
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
}

// Uso en test
describe('responsive layout', () => {
  afterEach(() => {
    setViewport(1024, 768); // reset a desktop
  });

  it('stacks columns vertically on mobile', () => {
    setViewport(375, 667); // iPhone SE
    render(<KanbanBoard ... />);
    const board = screen.getByTestId('kanban-board');
    expect(board).toHaveClass('flex-column');
    expect(board).not.toHaveClass('flex-md-row'); // la clase md no se aplica
  });

  it('shows columns horizontally on desktop', () => {
    setViewport(1280, 800);
    render(<KanbanBoard ... />);
    const board = screen.getByTestId('kanban-board');
    expect(board).toHaveClass('flex-md-row');
  });
});
```

### 4.6 Simulación táctil en tests para drag & drop

Para probar el drag & drop táctil sin depender del navegador real:

```typescript
// Test de drag táctil con @hello-pangea/dnd
import { fireEvent } from '@testing-library/react';

// @hello-pangea/dnd proporciona el helper `makeDroppable` y `makeDraggable`
// pero para pruebas de integración se puede usar el DragDropContext real
// y simular eventos táctiles

it('handles touch drag and drop', () => {
  const onDragEnd = jest.fn();
  render(
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="column1">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <Draggable draggableId="1" index={0}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  data-testid="candidate-card-1"
                >
                  Jane Smith
                </div>
              )}
            </Draggable>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );

  // Simular touch start en la tarjeta
  const card = screen.getByTestId('candidate-card-1');
  fireEvent.touchStart(card, {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  // ... continuar con touch move y touch end
});
```

**Nota**: Para tests más robustos de drag & drop, considerar usar la librería `@hello-pangea/dnd-test-utils` o el helper `fireEvent.drag` de testing-library. Si resulta demasiado complejo simular el DnD táctil completo, priorizar los tests unitarios del handler `onDragEnd` (T12) y los tests de layout responsivo (T1–T11) que son más estables.

### 4.7 Patrones a seguir

- **Mobile-first**: Estilos base = móvil. Media queries `min-width` para desktop.
- **Bootstrap responsive utilities**: Usar `d-flex flex-column flex-md-row`, `w-100`, `flex-shrink-0` en lugar de CSS custom siempre que sea posible.
- **`touch-action: auto`**: No poner `touch-action: none` en contenedores con droppable para no bloquear el scroll nativo.
- **`text-truncate`**: Usar la clase de Bootstrap para títulos largos en móvil.
- **Separación de responsabilidades**: Los tests de layout van en `KanbanBoard.test.tsx`, los tests de interacción táctil pueden ir en `useDragAndDrop.test.ts` o en el mismo archivo.
- **Verificación visual**: Para el área táctil de 44x44px y la ausencia de scroll horizontal, complementar tests automatizados con verificación manual en Chrome DevTools (dispositivos específicos).

### 4.8 Accesibilidad móvil

- **Target size WCAG 2.1**: Todos los objetivos táctiles deben medir al menos 44x44px. Esto aplica a:
  - Botón de retroceso (`←`)
  - Tarjetas de candidatos (arrastrables)
  - Botón de reintentar en estado de error
  - Cualquier otro enlace o botón en la página
- **Contraste**: No cambiar, el contraste de colores se mantiene igual que en desktop.
- **Lectores de pantalla en móvil**: Asegurar que `aria-label` y `role` están presentes en los elementos interactivos (mismos que en desktop — verificado en 003).
- **Zoom**: El layout no debe romperse con zoom al 200% (verificar manualmente).

---

## 5. Edge cases y estados de error

| Escenario | Comportamiento esperado | Test |
|---|---|---|
| **Cambio de orientación**: El usuario gira el dispositivo de vertical a horizontal | El layout se reajusta dinámicamente vía media queries (no requiere recarga) | T20, T21 |
| **Zoom al 200%**: El usuario usa accesibilidad con zoom | El layout se mantiene funcional (posible scroll horizontal inevitable con zoom alto, pero sin solapamiento) | Verificación manual |
| **Tablet en landscape (1024px)**: El viewport es ≥ 768px | Se aplica layout horizontal de escritorio con columnas más estrechas | T21 |
| **Tablet en vertical (768px)**: El viewport es exactamente 768px | Comportamiento de transición: las columnas pueden mostrarse en dos filas de 2 columnas cada una (según implementación) o en una sola fila horizontal | T11 |
| **iPhone SE (375px)**: El viewport más pequeño soportado | Layout vertical, tarjetas con touch target ≥ 44px, sin scroll horizontal | T17 |
| **Pantalla grande (1920px+)**: Escritorio amplio | Columnas horizontales con scroll si es necesario. El kanban no se expande más allá de su contenido | Verificación manual |
| **Barra de direcciones del navegador móvil**: El viewport cambia de tamaño al hacer scroll (la barra se oculta/muestra) | El layout responsivo debe reaccionar al cambio de viewport dinámico (CSS media queries ya lo manejan) | — |
| **Teclado virtual abierto**: El usuario interactúa con el kanban mientras el teclado está visible | El layout no debe re-flow de forma catastrófica. Las columnas deben seguir siendo accesibles. | Verificación manual |
| **Drag & drop con un solo dedo**: Estándar en móviles | `@hello-pangea/dnd` maneja touch con un solo dedo por defecto | T12, T13 |
| **Drag & drop mientras se hace scroll con dos dedos**: El usuario intenta hacer scroll con dos dedos mientras arrastra con uno | El navegador puede cancelar el touch start. El DnD debe abortar gracefulmente (no dejar estado inconsistente) | T14, T15 |
| **Tap largo sin arrastre**: El usuario mantiene el dedo en una tarjeta sin moverlo | No debe iniciar el arrastre. `@hello-pangea/dnd` requiere un movimiento mínimo de ~5px | — (comportamiento de librería) |
| **Múltiples toques simultáneos**: El usuario toca dos tarjetas a la vez | Solo la primera tarjeta tocada inicia el arrastre. El segundo toque es ignorado por `@hello-pangea/dnd` | — (comportamiento de librería) |
| **Redimensionamiento de ventana en desktop**: El usuario arrastra el borde del navegador y el viewport cruza el breakpoint de 768px | El layout se reajusta dinámicamente. Si el usuario está arrastrando una tarjeta, el drag context se mantiene. | Verificación manual |
| **Overflow en tarjeta con nombre muy largo**: `fullName` excede el ancho de la tarjeta en móvil | El texto debe truncarse con `text-truncate` o `text-overflow: ellipsis` | T6 |
| **Flecha de retroceso demasiado pequeña**: Sin estilos específicos, el `←` es solo un carácter | Aplicar `min-width: 44px` y `min-height: 44px`. | T10 |
| **Columnas que exceden la altura del viewport en móvil**: Muchas tarjetas en una columna | Scroll vertical normal de la página. Cada columna crece según su contenido, el scroll del viewport permite ver todo | T7 |

### Edge cases de accesibilidad

| Escenario | Comportamiento esperado |
|---|---|
| **Navegación por teclado en móvil**: Teclado Bluetooth externo | Debe funcionar igual que en desktop (los eventos de teclado no cambian) |
| **Reducción de movimiento (`prefers-reduced-motion: reduce`)** | Las transiciones CSS (como `transition: box-shadow 0.2s ease` del resaltado) deben respetar esta preferencia. Añadir `@media (prefers-reduced-motion: reduce) { .kanban-column { transition: none; } }` |
| **Letra grande (font-size aumentado al 200%)**: Ajuste de accesibilidad del navegador | Las tarjetas y columnas deben expandirse para acomodar texto más grande sin romper el layout. Evitar alturas fijas. |

---

## 6. Escenarios de test detallados

Para cada criterio de aceptación (CA), se definen los tests correspondientes.

### CA1: Columnas en vertical en móvil (< 768px)

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T1 | Layout | Viewport 375px → kanban-board tiene `flex-column` (columnas apiladas) | `expect(board).toHaveClass('flex-column')` |
| T3 | Layout | Viewport 375px → cada columna tiene `w-100` | `expect(column).toHaveClass('w-100')` |

### CA2: Columnas en horizontal en desktop (≥ 768px)

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T2 | Layout | Viewport 1024px → kanban-board tiene `flex-md-row` | `expect(board).toHaveClass('flex-md-row')` |
| T4 | Layout | Viewport 1024px → cada columna tiene `min-width: 280px` | `expect(column).toHaveStyle('min-width: 280px')` |
| T11 | Layout | Viewport 810px → tablet vertical, multi-columna responsivo | Verificar que se aplica `flex-wrap` o `col-md-6` |

### CA3: Área táctil mínima 44x44px

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T9 | Layout | CandidateCard tiene `min-height: 44px` | `expect(card).toHaveStyle('min-height: 44px')` |
| T10 | Layout | BackButton tiene `min-width: 44px` y `min-height: 44px` | `expect(backBtn).toHaveStyle('min-width: 44px')` y `expect(backBtn).toHaveStyle('min-height: 44px')` |

### CA4: Título y navegación visibles en móvil

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T5 | Layout | Header tiene padding en los lados en viewport < 768px | `expect(header).toHaveClass('px-3')` o estilo equivalente |
| T6 | Layout | Título largo no se desborda en viewport pequeño | `expect(title).toHaveClass('text-truncate')` o verificar que `scrollWidth <= clientWidth` |

### CA5: Drag & drop táctil

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T12 | Touch DnD | Simular touch start → touch move → touch end → `onDragEnd` se ejecuta con resultado correcto | `expect(onDragEnd).toHaveBeenCalled()` con el `DropResult` esperado |
| T13 | Touch DnD | Columna destino se resalta con interacción táctil | Verificar clase `kanban-column--drag-over` tras simular drag sobre la columna |
| T14 | Touch DnD | Scroll de página no se bloquea durante drag táctil (no hay `touch-action: none`) | `expect(column).not.toHaveStyle('touch-action: none')` |

### CA6: Sin scroll horizontal forzado

| Test ID | Tipo | Descripción | Código mínimo esperado |
|---|---|---|---|
| T17 | Integración | Viewport 375px → scroll horizontal no existe | `expect(board.scrollWidth).toBeLessThanOrEqual(board.clientWidth)` o verificar que no hay desbordamiento |
| T18 | Integración | Viewport 390px → sin scroll horizontal | Ídem T17 |
| T19 | Integración | Viewport 430px → sin scroll horizontal | Ídem T17 |
| T20 | Integración | Viewport 768px → sin scroll horizontal | Ídem T17 |
| T21 | Integración | Viewport 1024px → sin scroll horizontal | Ídem T17 |
| T7 | Layout | Contenedor no tiene `overflow: hidden` | `expect(board.parentElement).not.toHaveStyle('overflow: hidden')` |

### CA7: Enfoque mobile-first

| Test ID | Tipo | Descripción |
|---|---|---|
| T1, T3 | Layout | Estilos base definen layout móvil (no se necesita media query para que funcione en móvil) |
| — | Code review | Verificar que no hay `@media (max-width: ...)` para estilos base, solo `@media (min-width: ...)` para desktop |

**Mapeo completo CA ↔ Tests:**

| CA | Tests asociados | Tipo |
|---|---|---|
| CA1 — Columnas verticales en móvil | T1, T3 | Layout |
| CA2 — Columnas horizontales en desktop | T2, T4, T11 | Layout |
| CA3 — Área táctil 44x44px | T9, T10 | Layout |
| CA4 — Título y navegación | T5, T6 | Header |
| CA5 — Drag & drop táctil | T12, T13, T14, T15, T16 | Touch DnD |
| CA6 — Sin scroll horizontal | T7, T8, T17, T18, T19, T20, T21 | Scroll |
| CA7 — Mobile-first | T1, T2, T3 (implicitamente todos) | Principio |

---

## 7. Dependencias no documentadas

| Dependencia | Afecta a | Nota |
|---|---|---|
| **`@hello-pangea/dnd` debe estar instalado y funcional** | Este ticket | Se instaló en la tarea `003`. Si no se instaló o se usó otra librería, el soporte táctil puede no funcionar. Verificar antes de empezar. |
| **Los componentes KanbanBoard, KanbanColumn, CandidateCard deben existir** | Este ticket | Creados en tareas `001`, `002`, `003`. Si su estructura es muy diferente a la esperada, ajustar las clases CSS responsivas. |
| **El estado `updatingIds` y el optimistic update deben funcionar** | Este ticket | Si el drag & drop de `003` tiene bugs, el layout responsivo no será testeable en su totalidad. |
| **No hay `overflow: hidden` en contenedores padres** | Este ticket | Si `PositionPage` o un layout superior tiene `overflow: hidden`, romperá el scroll vertical en móvil. Verificar en `App.css`, `index.css` y estilos de layout global. |
| **`touch-action` no debe estar seteado a `none` globalmente** | Este ticket | Si algún CSS global pone `touch-action: none` (a veces se usa para prevenir zoom no deseado), bloqueará el scroll mientras se arrastra. |
| **Este ticket** | — | No bloquea a ningún otro ticket del lote (es el último). |

### ⚠️ Riesgo potencial: `touch-action` en contenedores Bootstrap

Bootstrap no aplica `touch-action: none` por defecto, pero algunos componentes como `Carousel` o `Modal` pueden hacerlo. Verificar que ningún contenedor ancestro del kanban tenga esta propiedad. Especial atención a:
- `Modal` si el kanban se renderiza dentro de uno
- `Offcanvas` similar
- Estilos globales de la app (`index.css`, `App.css`)

### ⚠️ Compatibilidad táctil de `@hello-pangea/dnd`

Confirmar que la versión instalada de `@hello-pangea/dnd` soporta touch. A partir de la versión `1.0.0`, el soporte táctil es completo. Si se usó `react-beautiful-dnd` en lugar de `@hello-pangea/dnd`, **no hay soporte táctil nativo** y será necesario implementar una solución alternativa (como `react-dnd` con `TouchBackend` o un wrapper de eventos táctiles).

> **Decisión para este ticket**: Asumimos que `@hello-pangea/dnd` está instalado (>= 1.0.0) y que el soporte táctil funciona sin configuración adicional. Si no es así, este ticket debe incluir la configuración táctil.

---

## 8. Verificación INVEST

| Criterio | Cumple | Nota |
|---|---|---|
| **I**ndependent | ⚠️ Parcial | Depende de `003-implementar-arrastre-y-actualizacion.md` (el kanband debe tener DnD funcional para verificar touch support). También depende de que `@hello-pangea/dnd` tenga soporte táctil. |
| **N**egotiable | ✅ | La elección de usar Bootstrap responsive utilities vs CSS custom, si se implementa modo acordeón o scroll vertical simple, y el breakpoint exacto (768px vs 576px de Bootstrap `sm`) son discutibles. |
| **V**aluable | ✅ | Sin este ticket, el kanban es inutilizable en móvil, que es el principal dispositivo de acceso para reclutadores en terreno. |
| **E**stimable | ✅ | ~1-1.5 días (CSS responsive + touch verification + tests + ajustes de layout). |
| **S**mall | ✅ | Esfuerzo S (original). Los cambios son mayormente CSS y ajustes de clases. El soporte táctil es nativo de la librería. **No requiere división adicional.** |
| **T**estable | ✅ | 25 tests definidos cubriendo: layout responsivo (11 tests), interacción táctil (5 tests), integración viewports (6 tests), accesibilidad (3 tests). Todos los criterios de aceptación tienen test(s) asociados. |

### ¿Supera el límite de 2 días? — Evaluación

| Componente | Tiempo estimado |
|---|---|
| Clases responsive en KanbanBoard (Bootstrap utilities) | 0.5h |
| Ajuste de CandidateCard (min-height 44px) | 0.25h |
| Ajuste de KanbanColumn (touch-action, ancho) | 0.5h |
| Ajuste de header en PositionPage (padding, truncate) | 0.5h |
| CSS adicional (kanban-responsive.css) | 0.5h |
| Verificación touch support (@hello-pangea/dnd) | 0.5h |
| Tests de layout responsivo (T1–T11) | 2h |
| Tests de interacción táctil (T12–T16) | 1.5h |
| Tests de integración viewports (T17–T22) | 1h |
| Pruebas manuales (emulación dispositivos) | 1h |
| Ajustes post-pruebas | 0.5h |
| **Total** | **~8.75h (~1.1 días)** |

✅ **Dentro del límite de 2 días.**

---

## 9. Resumen de archivos a crear/modificar

| Archivo | Acción | Propósito |
|---|---|---|
| `frontend/src/components/KanbanBoard.tsx` | MODIFICAR | Añadir clases `d-flex flex-column flex-md-row gap-3`, wrapper responsivo |
| `frontend/src/components/KanbanColumn.tsx` | MODIFICAR | Añadir `w-100`, `flex-shrink-0`, `min-width: 280px`, verificar `touch-action` |
| `frontend/src/components/CandidateCard.tsx` | MODIFICAR | Añadir `min-height: 44px`, `py-3` para touch target |
| `frontend/src/pages/PositionPage.tsx` | MODIFICAR | Ajustar header con padding responsive y `text-truncate` en el título |
| `frontend/src/styles/kanban-responsive.css` | CREAR (opcional) | Estilos CSS para responsive si no se usan solo clases Bootstrap |
| `frontend/src/App.css` | MODIFICAR (o añadir import) | Añadir estilos responsive si se opta por CSS personalizado |
| `frontend/src/__tests__/KanbanBoard.test.tsx` | MODIFICAR (desde 003) | Añadir tests de layout responsivo (T1–T11), touch DnD (T12–T16), viewports (T17–T22) |

---

## 10. Cambios respecto al original

| Aspecto | Original | Enriquecido |
|---|---|---|
| **Tests** | Mencionados genéricamente en DoD | Plan TDD completo con **25 tests**, IDs, clasificados por tipo (layout, touch, integración, a11y) |
| **Criterios de aceptación** | 7 checkboxes genéricos | 7 CA expandidos en ~35 checkboxes concretos con referencias a tests |
| **Breakpoints** | Solo menciona 768px | Añadidos breakpoints específicos para tablets (768–991px), iPads (1024px), y viewports de dispositivos reales (iPhone SE 375px, iPhone 12 390px, iPhone 15 Pro Max 430px) |
| **Touch support** | "Si la librería lo soporta, verificar; si no, añadir" | Confirmado que `@hello-pangea/dnd` soporta touch nativamente; documentada la verificación de `touch-action` y el comportamiento con scroll simultáneo |
| **Edge cases** | No documentados | ~25 edge cases documentados: orientación, zoom, teclado virtual, reducción de movimiento, tablets, scroll con dos dedos, nombres muy largos |
| **Estructura de archivos** | Solo mención genérica a "CSS y media queries" | Árbol completo de 7 archivos a crear/modificar con nombres y cambios concretos |
| **Estrategia CSS** | "Bootstrap o CSS nativo" | Estrategia dual documentada: (1) Bootstrap responsive utilities como opción primaria, (2) CSS custom como fallback, con ejemplos de código para ambas |
| **Enfoque mobile-first** | Mencionado brevemente | Especificado: estilos base = móvil, media queries `min-width` para desktop. Verificado con tests. |
| **Accesibilidad** | "Área táctil 44x44px" | Expandido con WCAG 2.1 Target Size, `prefers-reduced-motion`, zoom al 200%, lectores de pantalla en móvil |
| **Touch-action** | No mencionado | Documentado el riesgo de `touch-action: none` bloqueando scroll nativo, con tests específicos (T14) |
| **Simulación de tests de viewport** | No mencionado | Helper `setViewport()` con ejemplo de código para simular diferentes tamaños de pantalla en tests |
| **Dependencias** | Solo cross-ticket (003) | Añadidas dependencias de `touch-action`, `@hello-pangea/dnd`, estilos globales (`overflow: hidden`) |
| **Verificación INVEST** | No incluida | Tabla INVEST con cumplimiento verificado + estimación detallada de tiempo |

---

## 11. Notas adicionales

### 11.1 Decisión de diseño: ¿scroll vertical simple o acordeón de fases?

El ticket original sugiere dos opciones: "una sola columna con scroll, o acordeón de fases". Se recomienda **scroll vertical simple** por las siguientes razones:

| Opción | Ventajas | Desventajas |
|---|---|---|
| **Scroll vertical simple** (elegida) | Implementación trivial (solo CSS), todas las fases visibles a la vez, no requiere lógica de estado adicional | Puede haber mucho scroll si hay muchas fases |
| **Acordeón de fases** | Menos scroll, más contenido visible inicialmente | Requiere estado de acordeón, lógica de colapso/expansión, los usuarios pueden no ver todas las fases fácilmente, más complejo de testear |

**Decisión**: Scroll vertical simple. Si en el futuro se detecta que hay demasiadas fases (>6), se puede considerar un acordeón o un carrusel vertical.

### 11.2 Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| `@hello-pangea/dnd` no soporta touch (versión incorrecta) | **Alto** — el drag & drop táctil no funciona | Verificar versión (`>= 1.0.0`) antes de empezar. Si es `react-beautiful-dnd`, migrar a `@hello-pangea/dnd` o implementar touch backend alternativo. |
| Estilos globales con `overflow: hidden` o `touch-action: none` | **Alto** — el layout responsivo se rompe | Buscar en todo el CSS del proyecto antes de implementar. Hacer test T7 (overflow) desde el inicio. |
| Bootstrap `flex-md-row` no funciona como se espera en todos los navegadores | **Bajo** — layout inconsistente | Verificar en Safari iOS (el navegador más restrictivo). Bootstrap es compatible con todos los navegadores modernos. |
| El texto truncado (`text-truncate`) oculta información importante del título | **Bajo** — UX reducida | El título completo se puede ver girando el dispositivo a horizontal o haciendo tap (si se implementa tooltip). Aceptable para MVP. |

### 11.3 Suposiciones

- `@hello-pangea/dnd` >= 1.0.0 está instalado y tiene soporte táctil completo.
- El layout del header (título + back button) usa Bootstrap y es fácilmente modificable.
- No hay contenedores padres con `overflow: hidden` que afecten al kanban.
- Los candidatos con nombres muy largos deben truncarse, no romper el layout.
- Los tests de layout se ejecutan en JSDOM (que no simula CSS real) — por eso se verifican clases CSS en lugar de estilos computados.
- Para verificación real de scroll horizontal y layout pixel-perfect, se necesita prueba manual en navegador.

### 11.4 Estrategia de pruebas manuales (emulación de dispositivos)

Además de los tests automatizados, verificar manualmente en Chrome DevTools:

1. **iPhone SE (375×667)**: Abrir la página, verificar layout vertical, touch target, scroll, drag táctil.
2. **iPhone 12/13/14 (390×844)**: Ídem.
3. **iPhone 15 Pro Max (430×932)**: Ídem.
4. **iPad Mini (768×1024)**: Verificar transición a layout horizontal o 2 columnas.
5. **iPad Pro (1024×1366)**: Verificar layout horizontal completo.
6. **Desktop (1920×1080)**: Verificar que el layout desktop no se ha roto.
7. **Rotación**: Abrir en móvil, girar el dispositivo (o emular rotación), verificar que el layout se reajusta.
8. **Zoom 200%**: Verificar que el layout no se rompe.
9. **Drag & drop táctil**: Arrastrar una tarjeta con el dedo (emulado) a otra columna. Debe funcionar.
10. **Scroll + drag**: Hacer scroll hacia abajo, luego arrastrar una tarjeta. El scroll debe funcionar y el drag debe completarse.
