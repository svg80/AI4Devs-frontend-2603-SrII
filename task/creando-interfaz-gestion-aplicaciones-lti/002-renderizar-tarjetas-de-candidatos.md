# Renderizar tarjetas de candidatos en sus columnas

## Epic
creando_interfaz_gestion_aplicaciones_LTI.md

## Descripción
Obtener la lista de candidatos desde GET /positions/:id/candidates y renderizar una tarjeta por cada candidato en la columna correspondiente según su fase actual. Cada tarjeta debe mostrar el nombre completo del candidato y su puntuación media. Manejar los estados de carga, vacío y error específicos de esta llamada.

## Criterios de aceptación
- [ ] Se ejecuta GET /positions/:id/candidates al cargar la página (o después de obtener las fases).
- [ ] Cada candidato se renderiza como una tarjeta dentro de la columna de la fase que le corresponde (`currentInterviewStep`).
- [ ] La tarjeta muestra el nombre completo (`fullName`) y la puntuación media (`averageScore`).
- [ ] Si la puntuación media es 0, se muestra igualmente (el candidato aún no tiene evaluación).
- [ ] Si no hay candidatos, se muestra un mensaje "No hay candidatos en esta fase" en cada columna vacía.
- [ ] Se maneja el estado de carga con skeleton cards o spinner.
- [ ] Se maneja el estado de error con mensaje y opción de reintentar (independiente del error de fases).
- [ ] Las tarjetas tienen un diseño limpio y consistente con Bootstrap (borde, padding, sombra sutil).

## Notas técnicas
- Las tarjetas deben ser elementos HTML semánticos (`<article>` o `<div>` con `role="article"`).
- La correspondencia fase ⇄ candidato se hace por el nombre del paso (`currentInterviewStep`) contra el nombre de la fase del interviewFlow.
- `averageScore` puede ser `number` — mostrar como entero o con 1 decimal según consistencia.
- Las tarjetas deben ser accesibles por teclado (tabindex, enter para seleccionar).
- Preparar las tarjetas con `data-*` attributes o `id` que identifique al candidato para el drag & drop posterior.

## Dependencias
- Bloqueada por: 001-setup-ruta-y-tablero-kanban.md (necesita la ruta y el módulo API)
- Bloquea a: 003-implementar-arrastre-y-actualizacion.md

## Prioridad
Must have

## Esfuerzo estimado
M — Renderizado condicional por fase, estados de carga/error/vacío, diseño de tarjeta y pruebas.

## Definition of Done
- [ ] El código compila y pasa el linter
- [ ] Tests escritos y pasando
- [ ] Verificado manualmente en navegador/cliente API
- [ ] Aprobado por peer review
