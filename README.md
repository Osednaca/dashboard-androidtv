<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Inicialización de producción en EasyPanel

Con `APP_ENV=production` y las variables `DB_*` configuradas, ejecuta en la consola del dashboard:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan signage:admin
```

El seed de producción prepara roles, permisos, layouts y ajustes básicos sin Faker, cuentas demo ni contenido ficticio. Se puede repetir; conserva usuarios, contraseñas y ajustes existentes. El comando `signage:admin` pide nombre, correo nuevo y una contraseña de al menos 12 caracteres (entrada oculta y confirmación). Crea un superadministrador activo; rechaza correos existentes sin modificarlos. No introduzcas la contraseña como argumento del comando.

Si ya ejecutaste el seeder anterior antes del fallo de Faker, pudo haber creado las cuentas demo `admin@signagetv.co`, `operaciones@signagetv.co`, `campanas@signagetv.co` y `soporte@signagetv.co`. Entra con tu administrador propio, revisa Usuarios y suspende esas cuentas de demostración. Este cambio no elimina usuarios existentes ni borra la base de datos.

Los datos demo solo se cargan con `APP_ENV=local` o `testing` y requieren las dependencias de desarrollo. Después de preparar producción, crea un negocio y una ubicación desde el dashboard y asigna el código que muestra tu TV.

## Instant Play para negocios

Disponible en `/business/quick-play`: reutiliza el envío, historial y seguimiento del administrador con el contexto del negocio. Solo permite archivos listos de su biblioteca y pantallas/ubicaciones propias. La selección «Todas las pantallas» se limita al negocio activo; cambiar de negocio también cambia el historial. Ver requiere `business.devices.view`; enviar requiere además `business.playlists.manage`. Los roles de negocio existentes ya tienen estos permisos.

Para desplegar esta modificación:

```powershell
php artisan migrate --force
npm ci
npm run build
```

La migración `2026_09_12_220000_add_business_id_to_quick_plays_table` añade la propiedad del envío sin modificar el historial administrativo existente. En negocios el seguimiento consulta el estado cada seis segundos y se detiene al completar o fallar la entrega.
