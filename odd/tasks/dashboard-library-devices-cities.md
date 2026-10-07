# Dashboard: biblioteca, pantallas y ciudades

## Objetivo y autorización

Solicitud explícita del usuario (2026-10-07): mostrar opciones de biblioteca, seleccionar imágenes/videos y abrir nueva programación con esos elementos, eliminar pantallas en /admin/devices y administrar ubicaciones como ciudades con varios negocios para campañas.

Repositorio: E:/programacion/dashboard-androidtv. Rama de integración local: codex/dashboard-library-devices-cities. Base: 555ae73 (rama anterior codex/alter-live-tv, limpia). Sin autorización de publicación, PR, despliegue, acceso remoto o uso de credenciales. Android fuera de alcance.

## Evidencia y enfoque

Exploración delegada explore_dashboard: Inertia/React y Laravel; biblioteca business oculta MoreVertical hasta hover, biblioteca admin carece del menú equivalente; programación business admite edit/import pero no selección de biblioteca. Ubicaciones actuales son sucursales de un negocio, usadas en activación/settings y API TV. City de segmentación es hoy texto locations.city, sin entidad/pivot.

Mantener sucursales y contratos actuales; incorporar catálogo de ciudades y asignación de múltiples negocios. /admin/locations administrará ciudades. Segmentación por ciudad alcanzará todas las pantallas de los negocios asignados. Conservar campañas legacy por sucursal y ciudad textual. Migración aditiva con backfill; no ejecutar migraciones sobre la base de aplicación.

Biblioteca business abre programación; biblioteca admin abre campaña nueva con creatividades elegidas. Ambas selecciones sólo admiten medios listos adecuados a su flujo y validación del propietario en servidor. Abrir formulario no publica automáticamente.

## Configuración, checks y entrega

- TDD: sin selector on/off en proyecto/sesión; fuente: documentos existentes dashboard-web-reliability y business-unified-scheduling y exploración actual. No afirmar TDD habilitado. Ejecutar comprobaciones funcionales/regresiones significativas, registrando RED/GREEN sólo si se observa.
- PHP: C:/xampp/php/php.exe vendor/bin/phpunit, APP_ENV=testing, DB_CONNECTION=sqlite, DB_DATABASE=:memory:, DB_URL vacío, cache/session/mail array, queue sync, broadcast null, APP_CONFIG_CACHE inexistente. Nunca resetear base real ni usar sesiones/credenciales remotas.
- Frontend: npm run typecheck; npm run build; node --test tests/Frontend/*.test.mjs. Formatter: PHP Pint en archivos modificados. Runtime: fixtures locales aislados, sin APIs productivas.
- RDD: disabled/unmanaged, gentle-ai review mode status => off (global). No iniciar revisión ni cambiar preferencia.
- Skills resueltas por catálogo: work-unit-commits, chained-pr, laravel-11-12-app-guidelines, vercel-react-best-practices.
- Estrategia: ask-on-risk, resuelta por usuario a feature-branch-chain el 2026-10-07. Mantener commits locales como límites de futuras slices; no crear PR sin autorización. Forecast ~1,700 líneas authored; heurística de ~400 por tarea, no límite de implementación. Una pasada de slicing por comportamientos; si ciudad requiere una slice mayor, conservar unidad coherente y reportar extensión.
- Conteo authored acumulado: 0. Mirror: Engram local observation #1, topic odd/dashboard-library-devices-cities/tasks (MCP stdio, cloud autosync desactivado).

## Tareas

- [x] T1 — Menús de biblioteca visibles y accesibles en desktop, teclado y touch. Ruta delegated: library_fixes, dos bibliotecas/componentes, writer trigger 2+ archivos no triviales. Checks observados: SSR accesibilidad 1/1, suite frontend 38/38 antes retirar una prueba redundante, typecheck y build exit0 (2m51s). Interacción integrada de navegador pendiente. Commit se registrará tras creación.
- [ ] T2 — Selección múltiple en biblioteca y navegación a formulario nuevo prellenado. Ruta delegated: library/controllers/formularios, writer y preparation triggers. Checks: permisos/aislamiento, orden, límites de listado, medios no listos; PHPUnit/frontend/typecheck/build y fixture. Commit pendiente.
- [ ] T3 — Eliminar pantallas en admin con confirmación, autorización y limpieza coherente. Ruta delegated: UI/controller/routes/relaciones, writer y mapping triggers. Checks: borrado permitido, permisos y relaciones; PHPUnit/typecheck/build y fixture. Commit pendiente.
- [ ] T4 — Ciudades administradas con varios negocios y segmentación sobre todas sus pantallas. Ruta delegated: modelo/pivot/migración/admin/campañas/resolver; mapping/writer/preparation triggers. Checks: backfill, cambios asignación, legacy, filtros activos, alcance de campañas y manifestos; PHPUnit/frontend/typecheck/build y fixture. Commit pendiente.

Cada task cierra con work-unit commit Conventional Commit y evidencia observada. Parent mantiene este documento y su mirror; writers leen antes de editar. No marcar tareas completas por implementación sola.

## Criterios de aceptación

1. Menú de opciones visible y operable sin hover en bibliotecas.
2. Varios medios elegidos aparecen en el nuevo formulario, en orden; no se mezclan medios de otro negocio ni se publica sin envío del formulario.
3. Admin puede eliminar una pantalla desde listado/detalle con confirmación y backend autorizado; el dispositivo eliminado deja de recibir su configuración anterior.
4. Admin crea/edita ciudad y asigna varios negocios; campaña dirigida a ella resuelve todas sus pantallas. Las sucursales y campañas existentes conservan comportamiento compatible.

## Progreso y evidencia

- Exploración completada; repositorio limpio antes de cambios. Branch creada desde 555ae73.
- Engram ejecutable local disponible (sin proyectos previos); usar MCP stdio local con cloud autosync desactivado para espejo completo bajo odd/dashboard-library-devices-cities/tasks, project dashboard-androidtv. No acceso remoto.
- T1: menú compartido siempre visible, nombre accesible del archivo y focus; admin previsualiza/elimina respetando permiso, business conserva acciones. Documentación de uso junto al cambio. Pint N/A (sin PHP), diff --check aprobado. Runtime: render real SSR aprobado; interacción browser integrada pendiente.
- T3: worker device_delete terminó implementación; PHPUnit borrado 4 tests/34 assertions y regresiones activación/comandos 25/201 aprobadas, Pint/diff --check aprobados. Typecheck/build/browser integrados pendientes; no cerrar checkbox aún.
- Próximo paso: commit T1, continuar T2 y validar T3/T4.

## Límites de rollback y slices

- T1: revertir sólo menú de biblioteca y su prueba.
- T2: revertir preselección/navegación y validación asociada, conservando menú.
- T3: revertir operación de borrado y UI asociada.
- T4: revertir catálogo/segmentación de ciudades; cualquier rollback de migración real requiere evaluación posterior de datos, no está autorizado aquí.
- PR/slices: pendientes, sin PR creados. Límites de commits se registrarán al verificar cada unidad.
