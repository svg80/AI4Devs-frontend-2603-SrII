# Añadir layout responsivo para móvil

## Epic
creando_interfaz_gestion_aplicaciones_LTI.md

## Descripción
Adaptar el tablero kanban para que se visualice correctamente en dispositivos móviles. Las columnas deben apilarse verticalmente ocupando todo el ancho disponible, y las tarjetas deben tener un tamaño de touch adecuado. Ajustar el título y la navegación para pantallas pequeñas.

## Criterios de aceptación
- [ ] En viewports menores a 768px, las columnas se muestran en vertical (una debajo de otra) ocupando todo el ancho.
- [ ] En viewports mayores o iguales a 768px, las columnas se muestran en horizontal (layout kanban clásico).
- [ ] Las tarjetas tienen un área táctil mínima de 44x44px (estándar de accesibilidad táctil).
- [ ] El título de la posición y la flecha de retroceso se ven correctamente en móvil (sin desbordamiento, padding adecuado).
- [ ] El drag & drop funciona en táctil (touch events). Si la librería de DnD lo soporta nativamente, verificar; si no, añadir soporte básico.
- [ ] No hay scroll horizontal forzado en ningún viewport.
- [ ] El layout sigue el enfoque mobile-first: estilos base para móvil, media queries para desktop.

## Notas técnicas
- Usar media queries de Bootstrap (`sm` = 576px, `md` = 768px) o CSS nativo (`@media (min-width: 768px)`).
- La disposición vertical en móvil puede ser una sola columna con scroll, o acordeón de fases — priorizar una columna por fila (la opción más simple y usable).
- Si la librería de drag & drop (ej. `@hello-pangea/dnd`) no soporta táctil nativamente, considerar `react-dnd` con touch backend o envolver con eventos táctiles.
- Verificar que el contenedor principal no tenga `overflow: hidden` que rompa el layout responsivo.

## Dependencias
- Bloqueada por: 003-implementar-arrastre-y-actualizacion.md (necesita el drag & drop funcional)
- Bloquea a: —

## Prioridad
Should have

## Esfuerzo estimado
S — Los cambios son principalmente CSS y media queries. El soporte táctil depende de la librería DnD elegida, pero es ajuste menor.

## Definition of Done
- [ ] El código compila y pasa el linter
- [ ] Tests escritos y pasando
- [ ] Verificado manualmente en navegador/cliente API
- [ ] Aprobado por peer review
