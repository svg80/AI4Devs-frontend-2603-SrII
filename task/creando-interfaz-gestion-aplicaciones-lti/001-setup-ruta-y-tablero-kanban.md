# Configurar ruta, servicios API y renderizar tablero kanban

## Epic
creando_interfaz_gestion_aplicaciones_LTI.md

## Descripción
Configurar la ruta `/positions/:id`, crear el módulo de servicios API con las funciones para los 3 endpoints, definir las interfaces TypeScript para todas las respuestas, e implementar la página kanban que obtiene las fases del proceso de contratación (GET /positions/:id/interviewFlow) y las renderiza como columnas. Incluir el título de la posición en la parte superior con una flecha de retroceso al listado de posiciones.

## Criterios de aceptación
- [ ] La ruta `/positions/:id` existe y carga el componente PositionPage.
- [ ] Existe un módulo `api.ts` (o similar) con funciones tipadas para los 3 endpoints.
- [ ] Las interfaces TypeScript cubren todas las respuestas de los 3 endpoints.
- [ ] Al cargar la página, se ejecuta GET /positions/:id/interviewFlow y se muestran las columnas del kanban con el nombre de cada fase.
- [ ] El título de la posición se muestra en la parte superior de la página.
- [ ] Hay una flecha de retroceso a la izquierda del título que navega a la lista de posiciones (`/positions`).
- [ ] Se maneja el estado de carga (spinner/skeleton) mientras se obtienen los datos.
- [ ] Se maneja el estado de error si la llamada a la API falla (mensaje informativo + opción de reintentar).
- [ ] Sigue los patrones existentes del proyecto (Bootstrap, React Router, estructura de carpetas).

## Notas técnicas
- La ruta debe registrarse en el router principal de la aplicación (React Router).
- El módulo API debe estar en `frontend/src/services/api.ts` o similar, siguiendo la estructura existente.
- Las interfaces TypeScript incluirán `InterviewFlowResponse`, `CandidateResponse`, y `StageUpdatePayload`/`StageUpdateResponse`.
- Usar `fetch` o `axios` según lo que ya use el proyecto.
- El botón de retroceso puede ser un `<button>` o `<Link>` de React Router con `aria-label="Volver al listado de posiciones"`.

## Dependencias
- Bloqueada por: —
- Bloquea a: 002-renderizar-tarjetas-de-candidatos.md, 003-implementar-arrastre-y-actualizacion.md, 004-layout-responsivo-movil.md

## Prioridad
Must have

## Esfuerzo estimado
S — Ruta, tipos y servicio son rápidos de configurar. El renderizado del board con columnas es principalmente JSX + CSS Bootstrap existente.

## Definition of Done
- [ ] El código compila y pasa el linter
- [ ] Tests escritos y pasando
- [ ] Verificado manualmente en navegador/cliente API
- [ ] Aprobado por peer review
