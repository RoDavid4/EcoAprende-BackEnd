# Arquitectura del Backend - EcoAprende

## Vision General

El backend de EcoAprende esta construido sobre NestJS, adoptando un diseño modular y orientado a la Inversion de Control (IoC). La arquitectura esta pensada para soportar un escalamiento vertical y horizontal, dividiendo las responsabilidades del negocio en modulos altamente cohesivos.

## Estructura Modular

El codigo fuente reside en el directorio `src/modules/`. Cada modulo es responsable de un dominio de negocio especifico:

- `auth`: Gestiona la autenticacion de usuarios y la emision de tokens JWT.
- `users`: Administra la informacion y los perfiles de los usuarios del sistema.
- `courses`: Orquesta la logica de negocio relacionada con la creacion y lectura de cursos.
- `classrooms`: Gestiona la creacion de aulas virtuales, generacion de codigos de acceso y administracion de alumnos.
- `gamification`: Implementa el sistema de puntos, niveles y recompensas.
- `missions`: Define las misiones o retos asignados a los usuarios.
- `analytics`: Recopila y expone metricas de uso y progreso del sistema.

## Patrones de Diseno

1. Inyeccion de Dependencias (DI): Utilizada en toda la aplicacion para desacoplar servicios, repositorios y controladores.
2. Arquitectura en Capas: Separacion estricta entre Controladores (HTTP), Servicios (Logica de negocio) y Repositorios (Acceso a datos).
3. Decoradores: Empleados extensivamente para validaciones, configuracion de enrutamiento y documentacion de la API.

## Acceso a Datos

La capa de persistencia se apoya en PostgreSQL como motor de base de datos relacional. Se utiliza Sequelize ORM (`@nestjs/sequelize` + `sequelize-typescript`) para el mapeo objeto-relacional, la definicion de entidades y la gestion de migraciones.

### Modelo de Datos / Entidades

Actualmente, el sistema define las siguientes entidades principales:

#### `User` (Modulo `users`)
- `id` (UUIDV4, Primary Key)
- `fullName` (String, Not Null)
- `email` (String, Unique, Not Null, Format Email)
- `password` (String, Not Null)
- `roleId` (Integer, Foreign Key, asocia con la entidad `Role`)
- `isActive` (Boolean - Default: true)
- `resetPasswordToken` (String, Nullable)
- `resetPasswordExpires` (Date, Nullable)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `Classroom` (Modulo `classrooms`)
- `id` (UUIDV4, Primary Key)
- `name` (String, Not Null)
- `description` (Text, Nullable)
- `code` (String(6), Unique, Not Null): Código alfanumérico en mayúsculas generado aleatoriamente. El sistema verifica su unicidad en la BD antes de persistirlo.
- `teacherId` (UUID, Foreign Key, asocia con `User`)
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `ClassroomStudent` (Modulo `classrooms` - Tabla Intermedia)
- `id` (UUIDV4, Primary Key)
- `classroomId` (UUID, Foreign Key)
- `studentId` (UUID, Foreign Key)
- `joinedAt` (Date, Default: NOW): Fecha de inscripción del alumno al aula. Modela la relación N:M entre `User` y `Classroom`.

#### `Role` (Modulo `roles`)
- `id` (Integer, Primary Key, Auto Increment)
- `name` (String, Unique, Not Null)
- `description` (String)

#### `Permission` (Modulo `roles`)
- `id` (Integer, Primary Key, Auto Increment)
- `name` (String, Unique, Not Null)
- `description` (String)

#### `RolePermission` (Modulo `roles` - Tabla intermedia)
- `roleId` (Integer, Foreign Key)
- `permissionId` (Integer, Foreign Key)

## Autoconfiguracion y Siembra de Datos (Zero-Config)

Para garantizar un entorno agil sin configuraciones manuales, el backend implementa un modulo de siembra inicial (`SeederModule` y `SeederService`) utilizando el ciclo de vida `OnModuleInit` de NestJS. 

Al arrancar el contenedor, el sistema ejecuta automaticamente una estrategia idempotente (`findOrCreate`) para poblar la base de datos con los roles base (`ADMIN`, `TEACHER`, `STUDENT`). Adicionalmente, el seeder genera automáticamente dos usuarios de prueba predeterminados para facilitar las pruebas locales: un administrador (`admin@ecoaprende.com` / `Admin123!`) y un profesor (`profe@ecoaprende.com` / `Profe123!`). Esto evita duplicaciones en reinicios sucesivos y asegura que el sistema RBAC esté inmediatamente operativo tras ejecutar `docker compose up`.

## Autenticacion y Seguridad

El sistema implementa una capa robusta de seguridad gestionada por el modulo `auth` (AuthModule).

### Estrategia de Seguridad
- **Hashing**: Las contraseñas de los usuarios se encriptan utilizando `bcrypt` con un salt de 10 rondas antes de persistirse en la base de datos.
- **Autenticacion (JWT)**: Se implementa mediante `JwtStrategy` y `JwtAuthGuard` (basado en `passport-jwt`). La autenticacion se mantiene emitiendo tokens firmados de forma asincrona, con un payload que incluye identificadores inofensivos (`id`, `email`, `role`).
- **Autorizacion Basada en Roles (RBAC)**: Se utiliza un decorador personalizado `@Roles()` acoplado a un `RolesGuard`. Este guard emplea `Reflector` para contrastar los roles requeridos por el endpoint contra el rol mapeado en el token del usuario.
- **Validacion Estricta**: La aplicacion activa un `ValidationPipe` global en la etapa de bootstrap (`main.ts`). Esta tuberia depura los payloads (whitelist), rechaza campos no autorizados (forbidNonWhitelisted) y transforma los datos automaticamente basandose en los Data Transfer Objects (DTOs) definidos mediante `class-validator`.

### Endpoints (Auth)

- **Registro (`POST /auth/register`)**
  - **DTO (`RegisterDto`)**: Requiere `fullName` (String), `email` (String, formato email valido), y `password` (String, minimo 6 caracteres).
  - **Respuesta Esperada**: Retorna la entidad del usuario creado, omitiendo por diseño la contraseña hasheada.

- **Login (`POST /auth/login`)**
  - **DTO (`LoginDto`)**: Requiere `email` y `password`.
  - **Respuesta Esperada**: Valida credenciales y retorna un `access_token` (JWT) firmado junto con un resumen basico del perfil del usuario logueado. Retorna HTTP `200 OK` en lugar del `201 Created` por defecto (`@HttpCode(HttpStatus.OK)`).

- **Solicitud de Reseteo (`POST /auth/forgot-password`)**
  - **DTO (`ForgotPasswordDto`)**: Requiere el `email` del usuario.
  - **Comportamiento**: Genera de forma segura e idempotente un token temporal expirables (1 hora de vigencia). Por diseño, la respuesta es siempre exitosa para evitar enumeracion de usuarios validos.

- **Reseteo de Contraseña (`POST /auth/reset-password`)**
  - **DTO (`ResetPasswordDto`)**: Requiere `token` y `newPassword`.
  - **Comportamiento**: Valida la vigencia del token. Si el token es invalido, expirado o fue reutilizado, el sistema responde con `401 Unauthorized`. Si la validacion es correcta, ejecuta el re-hashing usando `bcrypt`, actualiza la contrasena y luego invalida (nullea) el token de la base de datos.

- **Prueba de Autorizacion (`GET /auth/admin-test`)**
  - **Proteccion**: Requiere token valido (`JwtAuthGuard`) y privilegios de administrador (`@Roles('ADMIN')` y `RolesGuard`).
  - **Respuesta Esperada**:
    - `200 OK`: Acceso concedido (Usuario = ADMIN).
    - `401 Unauthorized`: No se adjunta token en los headers o este es invalido.
    - `403 Forbidden`: El token es valido pero el usuario carece de permisos suficientes (ej. STUDENT o TEACHER).

### Endpoints (Users)

Estos endpoints son gestionados por el módulo `users` y están protegidos globalmente por `JwtAuthGuard`, requiriendo un Bearer Token válido en los headers.

- **Consulta de Perfil (`GET /users/profile`)**
  - **Comportamiento**: Extrae la identidad del token JWT y consulta la información del usuario autenticado junto con su rol. 
  - **Seguridad**: Excluye explícitamente datos sensibles como la contraseña (`password`), `resetPasswordToken` y `resetPasswordExpires`.
  - **Excepciones**: `401 Unauthorized` ante la falta de token o token inválido.

- **Edición de Perfil (`PATCH /users/profile`)**
  - **DTO (`UpdateProfileDto`)**: Permite la actualización de campos no sensibles, como `fullName`.
  - **Comportamiento**: Actualiza la información del usuario en la base de datos y retorna la entidad actualizada sin información sensible.
  - **Excepciones**: `401 Unauthorized` ante la falta de token.

- **Cambio de Contraseña (`POST /users/change-password`)**
  - **DTO (`ChangePasswordDto`)**: Requiere `currentPassword` y `newPassword`.
  - **Comportamiento**: Valida la identidad comprobando la `currentPassword` mediante `bcrypt.compare`. Si coincide, se aplica un hash a la `newPassword` y se actualiza en la base de datos.
  - **Respuesta Esperada**: Retorna HTTP `200 OK` (mediante `@HttpCode(HttpStatus.OK)`) indicando éxito en la actualización.
  - **Excepciones**: `401 Unauthorized` ante la falta de token o si la contraseña actual ingresada es incorrecta.

### Endpoints (Classrooms)

Estos endpoints son gestionados por el módulo `classrooms` y permiten a los profesores y administradores la gestión de las aulas virtuales.

- **Creación de Aula (`POST /classrooms`)**
  - **Autorización**: Requiere token JWT y roles `TEACHER` o `ADMIN` (`RolesGuard`).
  - **Comportamiento**: Genera automáticamente un código de 6 caracteres alfanuméricos verificando su unicidad, y asigna al usuario autenticado como el profesor (`teacherId`).

- **Inscripción a Aula (`POST /classrooms/join`)**
  - **Autorización**: Requiere token JWT y roles `STUDENT` o `ADMIN`.
  - **Comportamiento**: Recibe un código de 6 caracteres. Verifica que exista un aula activa con ese código y que el alumno no esté previamente inscrito. Registra la relación en la tabla intermedia `ClassroomStudent` y retorna los detalles del aula. Lanza `404` si no existe/está inactiva, y `409 Conflict` si ya está inscrito.

- **Listado de Aulas (`GET /classrooms`)**
  - **Comportamiento**: Retorna el listado de aulas. Soporta el query param `?includeInactive=true`. Por defecto, filtra y retorna únicamente las aulas con `isActive: true`. Si el usuario es `TEACHER`, solo ve las aulas que dicta; si es `STUDENT`, cruza con `ClassroomStudent` para ver únicamente las aulas a las que se ha unido; si es `ADMIN`, ve todas.

- **Gestión Individual (`GET /classrooms/:id`, `PATCH /classrooms/:id`, `DELETE /classrooms/:id`)**
  - **Consulta (`GET`)**: Retorna el detalle del aula. La consulta anida al profesor creador y el listado completo de estudiantes (`students`) inscritos, incluyendo la fecha de inscripción `joinedAt` proveniente de la tabla pivot.
  - **Seguridad (`PATCH` / `DELETE`)**: Solo el profesor creador o un usuario con rol `ADMIN` pueden editar o eliminar el aula.
  - **Edición y Reactivación (`PATCH`)**: Se permite actualizar nombre, descripción y el estado `isActive` (útil para reactivar aulas previamente desactivadas). Las consultas buscan por `id` de forma agnóstica al estado.
  - **Desactivación Lógica (`DELETE`)**: Establece `isActive: false` manteniendo el registro histórico en base de datos.

## Herramientas de Pruebas

El repositorio incluye una coleccion exportada en `docs/insomnia/ecoaprende-api.insomnia.json` con la configuracion pre-armada de los endpoints de la API. Esta coleccion refleja el flujo integrado de roles, las llamadas para recuperacion de contraseña, la gestión del perfil de usuario, el cambio de contraseña autenticado, el CRUD completo para la gestión de Aulas (Classrooms), y el mecanismo de inscripción de estudiantes a las aulas, permitiendo facilitar pruebas manuales inmediatas.

## Despliegue y Orquestacion

La aplicacion esta contenida mediante Docker.
- `Dockerfile`: Define el entorno de ejecucion de la aplicacion NodeJS.
- `docker-compose.yml`: Orquesta el contenedor de la aplicacion y la base de datos localmente, automatizando el proceso de aprovisionamiento de dependencias mediante un volumen virtual (`node_modules`).
