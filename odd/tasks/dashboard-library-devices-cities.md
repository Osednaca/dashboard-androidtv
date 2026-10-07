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
- Conteo authored acumulado: 684 (T1 205, T3 172, T2 307). Mirror: Engram local observation #1, topic odd/dashboard-library-devices-cities/tasks (MCP stdio, cloud autosync desactivado).

## Tareas

- [x] T1 — Menús de biblioteca visibles y accesibles en desktop, teclado y touch. Ruta delegated: library_fixes, dos bibliotecas/componentes, writer trigger 2+ archivos no triviales. Checks observados: SSR accesibilidad 1/1, suite frontend 38/38 antes retirar una prueba redundante, typecheck y build exit0 (2m51s). Interacción integrada de navegador pendiente. Commit 4930b80c5ed7aad04dd4a7859a3cbd25ed105faa, 205 líneas authored; RDD disabled/unmanaged.
- [x] T2 — Selección múltiple en biblioteca y navegación a formulario nuevo prellenado. Ruta delegated: library_fixes, library/controllers/formularios, writer y preparation triggers. PHPUnit regresiones 22 tests/307 assertions; frontend enfocado 14/14, suite integrada 41/41, typecheck/Pint/build final aprobados. Browser business y admin: video luego imagen prellenados en orden (18s/10s), sin guardar/publicar automáticamente. Commit d61ac26bbf154336264b32b121b023daa7a64e99, 307 líneas authored; RDD disabled/unmanaged.
- [x] T3 — Eliminar pantallas en admin con confirmación, autorización y limpieza coherente. Ruta delegated: device_delete, UI/controller/relaciones, writer y mapping triggers. Checks: PHPUnit 4/34 y regresiones 25/201, Pint, typecheck y build aprobados; navegador local verificó opción, confirmación y cancelación conservando pantalla. Commit bb1fae49846ea09c8b431a37edc5567416537e86, 172 líneas authored; RDD disabled/unmanaged.
- [x] T4 — Ciudades administradas con varios negocios y segmentación sobre todas sus pantallas. Ruta delegated: cities_fixes, modelo/pivot/migración/admin/campañas/resolver; mapping/writer/preparation triggers. Checks: 46 tests/453 assertions integración, 11/142 tras ajustes iniciales, 33/338 tras regresión conteo; suite final completa 258/2572. Pint/typecheck/frontend41/build final aprobados. Browser creó/editó ciudad con dos negocios; campaña por ID mostró 2 pantallas, 2 negocios, 1 ciudad. Commit se registrará tras creación.

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
- T3: eliminación en listado/detalle con devices.manage, revoca códigos de activación en transacción. PHPUnit borrado 4 tests/34 assertions y regresiones activación/comandos 25/201 aprobadas, Pint/diff --check aprobados. Typecheck parent exit0; build T1 incluyó UI T3, render en localhost:8138 confirmado. Browser: menú -> confirmación -> Cancelar preserva ambos dispositivos; borrado efectivo probado en PHPUnit, UI final integrada pendiente. RDD disabled/unmanaged.
- T1 browser: menú admin visible sin hover y abre Previsualizar/Eliminar en fixture local; business abre Previsualizar/Renombrar/Eliminar en mobile. Desktop 1280x900: Enter abre menú y enfoca primera opción; Escape cierra. Interacción con diseño estrecho y escritorio aprobada.
- T2: selección ordenada entre páginas/filtros, límites alineados 100 business/30 admin, validación de permisos/propiedad/readiness y carga explícita fuera del límite del listado. Browser localhost:8138 confirmó ambos formularios prellenados con video/imagen, no publicación automática. Corrupción de dos labels CP1252 detectada en UI y corregida UTF-8; nuevo build final exit0 (26.11s). Warning HLS >500kB existente. Diff --check aprobado; rollback conserva menú T1.
- Verificación final backend: suite completa 258 tests/2572 assertions, 0 errores/fallos/omitidas/warnings (48.917s), tras corregir contador de ciudades que mezclaba catálogo y sucursales. JUnit storage/logs/dashboard-corrections-full-phpunit.xml (ignorado). Pint final 12 PHP T4 pendientes aprobado. T4 regression RED 3 ciudades versus 1 observado, GREEN 33 tests/338 assertions; fallback para negocios sin catálogo conservado.
- T4: City/pivot aditivos, backfill preserva sucursales/IDs y actualiza counts/manifiestos. Admin CRUD con múltiples negocios; campañas por IDs estables, legacy conservado y tombstones bloquean fallback. Cambio de membresía/estado/borrado invalida pantallas previas+nuevas, rename legacy unívoco preservado. Browser creó ciudad, reabrió edición con ambos checks seleccionados y preview final mostró 2 pantallas/2 negocios/1 ciudad. Corrección contador observada RED y GREEN. La unidad incluye modelo, migración, CRUD, resolución y pruebas juntas; supera la heurística de ~400 líneas para conservar comportamiento coherente, sin recortar pruebas ni comprimir código.
- Pruebas pendientes fuera de alcance local: despliegue/migración sobre base de aplicación y reproducción en TV físicas. No operaciones remotas ni publicaciones realizadas; fixture SQLite/session/media aislados en localhost:8138. Warning build HLS >500kB preexistente; ningún check funcional final falló ni quedó omitido. RDD disabled/unmanaged.
- Próximo paso: commit T4, cerrar fixture y registrar evidencias finales.

## Límites de rollback y slices

- T1: revertir sólo menú de biblioteca y su prueba.
- T2: revertir preselección/navegación y validación asociada, conservando menú.
- T3: revertir operación de borrado y UI asociada.
- T4: revertir catálogo/segmentación de ciudades; cualquier rollback de migración real requiere evaluación posterior de datos, no está autorizado aquí.
- PR/slices: sin PR creados. T1: 555ae73..4930b80 (205 líneas authored). T3: 4930b80..bb1fae4 (172 líneas authored). T2: bb1fae4..d61ac26 (307 líneas authored); T4 se registrará tras verificación.
