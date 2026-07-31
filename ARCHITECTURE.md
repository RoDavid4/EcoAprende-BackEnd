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
- `role` (Enum: STUDENT, TEACHER, ADMIN - Default: STUDENT)
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

## Autenticacion y Seguridad

El sistema implementa una capa robusta de seguridad gestionada por el modulo `auth` (AuthModule).

### Estrategia de Seguridad
- **Hashing**: Las contraseñas de los usuarios se encriptan utilizando `bcrypt` con un salt de 10 rondas antes de persistirse en la base de datos.
- **JSON Web Tokens (JWT)**: La autenticacion se mantiene mediante tokens JWT firmados de forma asincrona, con un payload que incluye identificadores inofensivos (`id`, `email`, `role`).
- **Validacion Estricta**: La aplicacion activa un `ValidationPipe` global en la etapa de bootstrap (`main.ts`). Esta tuberia depura los payloads (whitelist), rechaza campos no autorizados (forbidNonWhitelisted) y transforma los datos automaticamente basandose en los Data Transfer Objects (DTOs) definidos mediante `class-validator`.

### Endpoints (Auth)

- **Registro (`POST /auth/register`)**
  - **DTO (`RegisterDto`)**: Requiere `fullName` (String), `email` (String, formato email valido), y `password` (String, minimo 6 caracteres).
  - **Respuesta Esperada**: Retorna la entidad del usuario creado, omitiendo por diseño la contraseña hasheada.

- **Login (`POST /auth/login`)**
  - **DTO (`LoginDto`)**: Requiere `email` y `password`.
  - **Respuesta Esperada**: Valida credenciales y retorna un `access_token` (JWT) firmado junto con un resumen basico del perfil del usuario logueado.

## Herramientas de Pruebas

El repositorio incluye una coleccion exportada en el directorio `docs/insomnia/` con la configuracion pre-armada de los endpoints de la API, lista para importarse y facilitar las pruebas manuales (ej. registro y generacion de tokens).

## Despliegue y Orquestacion

La aplicacion esta contenida mediante Docker.
- `Dockerfile`: Define el entorno de ejecucion de la aplicacion NodeJS.
- `docker-compose.yml`: Orquesta el contenedor de la aplicacion y la base de datos localmente, automatizando el proceso de aprovisionamiento de dependencias mediante un volumen virtual (`node_modules`).
