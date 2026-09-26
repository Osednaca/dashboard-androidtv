# Alter en el dashboard web

El panel web usa el logo suministrado y la marca **Alter** en acceso, navegación de administrador y negocio, pie de página, título y favicon. La app Android conserva su identidad actual.

## Qué cambia para el negocio

- Un solo menú **Programación** mantiene el formulario unificado de contenido y horarios.
- Se retiran los accesos **Contenido** y **Reportes** del menú; no se borran archivos ni reportes ni se modifican permisos.
- Configuración deja de mostrar audio/notificaciones, marca y zona horaria. Guardar los datos de contacto conserva los valores ocultos existentes.
- Se conservan los logos y nombres propios de los negocios, la campana de notificaciones y los controles del administrador.

## Publicación posterior

1. Publicar el código y los assets compilados del dashboard mediante el procedimiento habitual, incluyendo `public/brand/alter-logo.jpg`.
2. En el contenedor del dashboard y desde `/var/www/html`, ejecutar `php artisan migrate --force` y después `php artisan config:cache` mediante el procedimiento de despliegue autorizado. El `docker/entrypoint.sh` actual prepara carpetas/permisos y el enlace de almacenamiento, pero **no** ejecuta estas dos operaciones automáticamente. No ejecutar seeders sobre producción para cambiar la marca.
3. Comprobar acceso, menú móvil/escritorio, footer y el guardado de datos de contacto de un negocio. No hace falta instalar un APK.

Esta entrega solo prepara cambios locales: no ejecuta despliegues ni migraciones en producción.

## Identidad y datos preservados

| Elemento | Comportamiento |
| --- | --- |
| `config/branding.php` | Nombre y ruta de logo públicos, compartidos con Inertia. |
| `APP_NAME` / `VITE_APP_NAME` antiguos | No deciden la marca visible. **No cambiar `APP_NAME` solo por esta entrega**: también puede determinar cookies, caché y Redis. |
| Logo | Copia exacta del JPG original, sin recortar, recolorear ni convertir. |
| `network.name` | La migración cambia únicamente `Red Signage TV Colombia` por `Red Alter Colombia`; conserva nombres personalizados y otros campos JSON. |
| Reversión | `down()` no revierte datos: no puede distinguir un nombre Alter personalizado posterior. Restaurar el nombre solo de forma explícita si se necesita. |
| Identidades técnicas | Rutas, hosts, almacenamiento local, cuentas, cookies, API y puentes Android no se renombran. |

## Verificación y límites

Regresiones PHP comprueban la marca con `APP_NAME` antiguo, la preservación de identidad técnica y la migración condicionada. Pruebas de renderizado estático React verifican logo, acceso en ambos contenedores responsive, menú colapsado y footer. El renderizado estático **no sustituye** la comprobación visual móvil/escritorio: sigue pendiente porque el inicio del servidor local fue bloqueado; no se intentó eludirlo.
