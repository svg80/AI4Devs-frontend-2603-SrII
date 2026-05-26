# Implementar arrastre de tarjetas y actualización de fase

## Epic
creando_interfaz_gestion_aplicaciones_LTI.md

## Descripción
Permitir arrastrar (drag & drop) las tarjetas de candidatos entre columnas del kanban. Al soltar una tarjeta en una columna diferente, ejecutar PUT /candidates/:id/stage con el nuevo `currentInterviewStep` correspondiente a la columna destino. Mostrar feedback visual de éxito o error.

## Criterios de aceptación
- [ ] Las tarjetas de candidatos son arrastrables con el mouse.
- [ ] Al arrastrar una tarjeta sobre una columna, esta se resalta visualmente indicando el destino.
- [ ] Al soltar la tarjeta en una columna diferente, se ejecuta PUT /candidates/:id/stage con `applicationId` y `currentInterviewStep` (el id del paso destino).
- [ ] Mientras se procesa la petición, la tarjeta muestra un estado de carga (spinner inline o degradado).
- [ ] Si la petición es exitosa, la tarjeta se mueve a la columna destino y se muestra un toast/notificación de éxito.
- [ ] Si la petición falla, la tarjeta vuelve a su columna original y se muestra un mensaje de error.
- [ ] El arrastre funciona con la librería de drag & drop que ya use el proyecto; si no hay ninguna, elegir `@hello-pangea/dnd` (fork mantenido de react-beautiful-dnd).
- [ ] La experiencia es fluida: sin saltos visuales, transiciones suaves.
- [ ] Accesibilidad: soporte de arrastre con teclado (opcional para MVP, documentado como mejora futura).

## Notas técnicas
- Verificar el contrato exacto de PUT /candidates/:id/stage en `backend/api-spec.yaml`.
  - El payload espera `applicationId: string` y `currentInterviewStep: string` (ver epic).
- Implementar con optimismo: mover la tarjeta inmediatamente en la UI y revertir si la API falla.
- El estado de los candidatos debe actualizarse en el estado global o local después del PUT exitoso.
- Si el proyecto ya usa una librería de drag & drop, usarla. Si no, instalar `@hello-pangea/dnd`.
- El resaltado de columna destino debe ser CSS sin afectar el layout (box-shadow o outline).

## Dependencias
- Bloqueada por: 002-renderizar-tarjetas-de-candidatos.md (necesita las tarjetas renderizadas)
- Bloquea a: 004-layout-responsivo-movil.md

## Prioridad
Must have

## Esfuerzo estimado
M — Integración de drag & drop, petición PUT, manejo de errores con rollback, feedback visual.

## Definition of Done
- [ ] El código compila y pasa el linter
- [ ] Tests escritos y pasando
- [ ] Verificado manualmente en navegador/cliente API
- [ ] Aprobado por peer review
