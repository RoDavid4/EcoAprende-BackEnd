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
- `totalXp` (Integer, Default: 0): Puntos de experiencia globales.
- `level` (Integer, Default: 1): Nivel calculado según el progreso.
- `currentStreak` (Integer, Default: 0): Días consecutivos de actividad.
- `lastActivityDate` (DateOnly, Nullable): Última vez que realizó una acción puntuable.
- `lessonsCompleted` (Integer, Default: 0): Contador de lecciones.
- `quizzesPassed` (Integer, Default: 0): Contador de evaluaciones aprobadas.
- `missionsApproved` (Integer, Default: 0): Contador de misiones completadas.
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

#### `ClassroomModule` (Modulo `classrooms` - Tabla Intermedia)
- `id` (UUIDV4, Primary Key)
- `classroomId` (UUID, Foreign Key, asocia con `Classroom`)
- `moduleId` (UUID, Foreign Key, asocia con `Module`)
- `assignedAt` (Date, Default: NOW)
- `isVisible` (Boolean, Default: true): Controla la visibilidad del módulo para los alumnos inscritos en el aula.
- Presenta un índice único compuesto en `['classroomId', 'moduleId']` para prevenir duplicaciones de asignación. Modela la relación N:M entre `Classroom` y `Module`.

#### `Course` (Modulo `courses`)
- `id` (UUIDV4, Primary Key)
- `title` (String, Not Null)
- `description` (Text, Nullable)
- `imageUrl` (String, Nullable)
- `status` (Enum: 'DRAFT', 'PUBLISHED' - Default: 'DRAFT')
- `createdById` (UUID, Foreign Key, asocia con `User`)
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `Module` (Modulo `courses`)
- `id` (UUIDV4, Primary Key)
- `courseId` (UUID, Foreign Key, asocia con `Course`)
- `title` (String, Not Null)
- `description` (Text, Nullable)
- `order` (Integer, Not Null): Define el orden del módulo. Posee un índice único compuesto (`[courseId, order]`) para evitar colisiones. Si se omite en la creación, se auto-calcula el siguiente orden disponible.
- `status` (Enum: 'DRAFT', 'PUBLISHED' - Default: 'DRAFT')
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `Lesson` (Modulo `courses`)
- `id` (UUIDV4, Primary Key)
- `moduleId` (UUID, Foreign Key, asocia con `Module`)
- `title` (String, Not Null)
- `contentType` (Enum: 'TEXT', 'VIDEO', 'MULTIMEDIA' - Not Null)
- `content` (Text, Nullable)
- `mediaUrl` (String, Nullable)
- `order` (Integer, Not Null): Define el orden de la lección. Posee un índice único compuesto (`[moduleId, order]`). Auto-calculable en caso de omitirse.
- `durationMinutes` (Integer, Nullable)
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `LessonProgress` (Modulo `courses` - Tabla intermedia de progreso)
- `id` (UUIDV4, Primary Key)
- `userId` (UUID, Foreign Key, asocia con `User`)
- `lessonId` (UUID, Foreign Key, asocia con `Lesson`)
- `isCompleted` (Boolean, Default: false)
- `completedAt` (Date, Nullable)
- Presenta un índice único compuesto en `['userId', 'lessonId']` para implementar control de idempotencia y prevenir la duplicación de recompensas.

#### `StudentProgress` (Modulo `courses` - Progreso Consolidado)
- `id` (UUIDV4, Primary Key)
- `userId` (UUID, Foreign Key, asocia con `User`)
- `courseId` (UUID, Foreign Key, asocia con `Course`)
- `completedLessonsCount` (Integer, Default: 0)
- `totalLessonsCount` (Integer, Default: 0)
- `completedQuizzesCount` (Integer, Default: 0)
- `totalQuizzesCount` (Integer, Default: 0)
- `percentage` (Float, Default: 0.00): Promedio global de aprendizaje del curso.
- `isCompleted` (Boolean, Default: false)
- `lastAccessedAt` (Date, Nullable)
- `completedAt` (Date, Nullable)

#### `Quiz` (Modulo `quizzes`)
- `id` (UUIDV4, Primary Key)
- `moduleId` (UUID, Foreign Key, asocia con `Module`)
- `title` (String, Not Null)
- `description` (Text, Nullable)
- `passingScore` (Integer, Default: 70): Porcentaje mínimo para aprobar.
- `maxAttempts` (Integer, Default: 3): Número máximo de intentos permitidos.
- `timeLimitMinutes` (Integer, Nullable): Tiempo límite para completar la evaluación.
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `Question` (Modulo `quizzes`)
- `id` (UUIDV4, Primary Key)
- `quizId` (UUID, Foreign Key, asocia con `Quiz`)
- `statement` (Text, Not Null): Enunciado de la pregunta.
- `explanation` (Text, Nullable): Explicación pedagógica tras responder.
- `order` (Integer, Not Null): Define la secuencia dentro de la evaluación.
- `points` (Integer, Default: 10): Ponderación o valor de la pregunta.
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `Option` (Modulo `quizzes`)
- `id` (UUIDV4, Primary Key)
- `questionId` (UUID, Foreign Key, asocia con `Question`)
- `text` (Text, Not Null): Texto de la opción de respuesta.
- `isCorrect` (Boolean, Not Null): Define si esta opción es la respuesta correcta.
- `order` (Integer, Nullable)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `QuizAttempt` (Modulo `quizzes`)
- `id` (UUIDV4, Primary Key)
- `quizId` (UUID, Foreign Key, asocia con `Quiz`)
- `userId` (UUID, Foreign Key, asocia con `User`)
- `score` (Float, Not Null): Calificación obtenida en escala de 0 a 100.
- `pointsObtained` (Integer, Not Null): Suma de puntos logrados por respuestas correctas.
- `totalPoints` (Integer, Not Null): Suma total de puntos posibles de la evaluación.
- `isPassed` (Boolean, Not Null): Determina si `score` >= `passingScore`.
- `attemptNumber` (Integer, Not Null): Número cronológico de intento para el alumno en este quiz.
- `answers` (JSONB, Not Null): Registro inmutable y detallado de respuestas que incluye aciertos, errores, puntos otorgados y opciones seleccionadas.
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `Mission` (Modulo `missions`)
- `id` (UUIDV4, Primary Key)
- `title` (String, Not Null)
- `description` (Text, Not Null): Consigna de la misión.
- `type` (Enum: 'DIGITAL', 'PRACTICAL' - Not Null)
- `pointsReward` (Integer, Default: 50): XP que otorgará al completarse.
- `instructions` (Text, Nullable): Guía paso a paso.
- `imageUrl` (String, Nullable)
- `moduleId` (UUID, Foreign Key, asocia con `Module`, Nullable)
- `createdById` (UUID, Foreign Key, asocia con `User`, Not Null)
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `MissionSubmission` (Modulo `missions`)
- `id` (UUIDV4, Primary Key)
- `missionId` (UUID, Foreign Key, asocia con `Mission`)
- `userId` (UUID, Foreign Key, asocia con `User`): Estudiante que entrega.
- `status` (Enum: 'PENDING', 'APPROVED', 'REJECTED' - Default: 'PENDING')
- `evidenceText` (Text, Nullable)
- `evidenceUrl` (String, Nullable)
- `feedback` (Text, Nullable): Comentario del docente al corregir.
- `reviewedById` (UUID, Foreign Key, asocia con `User`, Nullable): Docente que revisó.
- `reviewedAt` (Date, Nullable)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `Badge` (Modulo `gamification`)
- `id` (UUIDV4, Primary Key)
- `code` (String, Unique, Not Null): Identificador inmutable (ej: 'WELCOME', 'STREAK_3').
- `name` (String, Not Null)
- `description` (Text, Not Null)
- `iconUrl` (String, Not Null): Almacena la URL externa o el identificador del ícono SVG del catálogo interno (ej: 'sparkles', 'leaf').
- `xpValue` (Integer, Default: 50): Experiencia que otorga.
- `category` (Enum: 'ECOLOGY', 'ACADEMIC', 'COMMUNITY', 'STREAK', 'SPECIAL' - Default: 'ECOLOGY')
- `triggerEvent` (Enum: 'STREAK', 'TOTAL_XP', 'LESSONS_COMPLETED', 'QUIZZES_PASSED', 'MISSIONS_APPROVED', 'MANUAL' - Default: 'MANUAL')
- `triggerValue` (Integer, Default: 0)
- `isActive` (Boolean - Default: true)
- Timestamps de auditoria (`createdAt`, `updatedAt`)

#### `UserBadge` (Modulo `gamification`)
- `id` (UUIDV4, Primary Key)
- `userId` (UUID, Foreign Key, asocia con `User`)
- `badgeId` (UUID, Foreign Key, asocia con `Badge`)
- `awardedAt` (Date, Default: NOW)
- Presenta un índice único compuesto en `['userId', 'badgeId']` para evitar insignias duplicadas.

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

#### `AuditLog` (Modulo `audit-logs`)
- `id` (UUIDV4, Primary Key)
- `userId` (UUID, Foreign Key, Nullable, asocia con `User`): Autor de la acción (puede ser anónimo/sistema).
- `action` (String, Not Null): Constante identificadora (ej: 'USER_ROLE_UPDATED', 'USER_STATUS_UPDATED').
- `resource` (String, Not Null): Nombre del recurso afectado (ej: 'users', 'courses').
- `resourceId` (String, Nullable): ID del recurso afectado.
- `payload` (JSONB, Nullable): Información auxiliar de la mutación.
- `ipAddress` (String, Nullable): Dirección de red de origen.
- `userAgent` (String, Nullable): Identificador del cliente.
- `createdAt` (Date): Timestamp inmutable de registro.

## Administración y Auditoría (ECOA-72)

El sistema incorpora un entorno blindado para tareas administrativas exclusivas de los usuarios con el rol `ADMIN`, dividido en dos grandes módulos globales.

### Auditoría Continua (`AuditLogsModule`)
- **Trazabilidad Integral**: La entidad `AuditLog` captura de forma inmutable todas las operaciones críticas y de alto riesgo dentro de la plataforma (cambios de estado, alteraciones de permisos, etc.). 
- **Inyección Transversal**: El módulo está decorado como `@Global()`, exponiendo el `AuditLogsService` para que cualquier parte del sistema registre eventos mediante `.logAction()`, el cual formatea, sanitiza y atrapa asíncronamente el origen de la operación.
- **Captura Precisa de Identidad de Red**: Al registrar operaciones a través de los controladores, se extrae el identificador del software (`User-Agent`) y la IP real del cliente resolviendo prioritariamente las cabeceras inversas (`x-forwarded-for`) antes de caer al socket TCP.
- **Auditoría Protegida (`GET /admin/audit-logs`)**: Endpoint de consulta administrativa para cruzar logs. La respuesta pre-carga al usuario autor (Eager Loading) pero intercepta y excluye mediante `attributes: { exclude: [...] }` cualquier dato sensible como contraseñas y tokens.

### Panel de Administración (`AdminModule`)
Provee las siguientes capacidades estratégicas centralizadas en el `AdminController` (`GET`, `PATCH`):
- **Gestión Avanzada de Usuarios**: Permite obtener la nómina paginada y fuertemente filtrada (búsqueda iLike por nombre y correo, por estado o rol).
- **Mutación de Estado y Rol**: A través de `PATCH /admin/users/:id/status` y `PATCH /admin/users/:id/role`. 
  - *Prevención de Deadlock*: La lógica contiene un candado semántico que impide a un administrador darse de baja a sí mismo y quedar bloqueado fuera del sistema.
  - *Heurística Adaptativa*: La modificación de roles es resiliente e identifica el objetivo analizando con prelación una amplia gama de llaves en el payload JSON (`roleId`, `role`, `name`, `roleName`), previniendo caídas bruscas ante clientes no estandarizados. 
  - Toda alteración exitosa despacha asíncronamente una firma a la tabla `audit_logs`.
- **Inteligencia y Estadísticas Globales (`GET /admin/stats/overview`)**: Compila las métricas cardinales de la plataforma al vuelo mediante Nullish Coalescing y división anti-Zero. Expone:
  - Distribución de usuarios totales, activos e inactivos separados por rol de sistema.
  - Volúmen de currícula segregado (total de cursos vs publicados, módulos, lecciones, evaluaciones creadas).
  - Volúmen institucional (número de aulas y proyecciones de densidad demográfica/alumnos).
  - Tracción gamificada histórica (XP despachado, medallas de catálogo entregadas a estudiantes, lecciones y quizzes completados globalmente).

## Capa Transversal y Helpers Comunes (ECOA-75)

Para centralizar lógicas repetitivas y garantizar la uniformidad en los contratos HTTP a lo largo de los distintos dominios de la API, el backend aloja estructuras agnósticas en `src/common/`.

### Paginación Unificada (`src/common/pagination/`)
- **`PaginationDto`**: DTO base del que extienden los controladores para inyectar automáticamente la validación, tipado numérico e instanciación de los parámetros `page` (default 1) y `limit` (default 10).
- **Consistencia de Respuestas**: Toda devolución paginada delega la construcción en la función de utilidad `createPaginatedResponse<T>` devolviendo obligatoriamente el formato `{ data, total, page, limit, totalPages }`, lo que encapsula a la API y garantiza una interfaz inquebrantable (`PaginatedResponse<T>`) frente a los requerimientos del frontend.

### Filtrado y Búsqueda Segura (`src/common/utils/search.helper.ts`)
- **`buildSearchFilter`**: Centraliza el armado del árbol binario de consultas `Op.iLike` (búsqueda case-insensitive) protegiendo al ORM contra inputs maliciosos o valores indefinidos, al aplicar `trim()` nativamente.
- **Herencia DTO**: Módulos que requieren filtros compuestos (como `GetUsersFilterDto` en el AdminModule o `LeaderboardQueryDto` en Gamificación) implementan herencia de clases desde `PaginationDto` utilizando `@Transform` para resolver el parseo seguro de booleanos que viajan por Query Params (evitando las vulnerabilidades de falsos verdaderos sobre strings).

### Automatización de Auditoría
- **Inyección por Metadatos**: En lugar de ensuciar los servicios de dominio con registros de auditoría, las firmas controladoras sensibles pueden ser expuestas al `@AuditLogEntry({ action, resource })`.
- **`AuditLogInterceptor`**: Intercepta de forma exitosa y genérica estas peticiones, extrayendo silenciosamente las cabeceras proxy, resolviendo direcciones IP y disparando asíncronamente el volcado en base de datos (`tap(...)` vía RxJS) asegurando que el overhead del logger no impacte negativamente los tiempos de respuesta transaccionales.

## Autoconfiguracion y Siembra de Datos (Zero-Config y Mock Data)

Para garantizar un entorno agil sin configuraciones manuales, el backend implementa un modulo de siembra inicial (`SeederModule` y `SeederService`) utilizando el ciclo de vida `OnModuleInit` de NestJS. 

Al arrancar el contenedor, el sistema ejecuta automaticamente una estrategia idempotente (`findOrCreate`) para poblar la base de datos con los roles base (`ADMIN`, `TEACHER`, `STUDENT`). Adicionalmente, el seeder inyecta 4 insignias fundacionales del motor de gamificación (`WELCOME`, `FIRST_LESSON`, `STREAK_3`, `ECO_HERO`) utilizando dinámicamente los íconos del catálogo interno.

### Entorno Simulado (`npm run seed`)
Para facilitar las pruebas intensivas durante el desarrollo y para los equipos de QA/Frontend, se provee adicionalmente un script de inicialización robusto en `src/database/seeds/seed.ts`. 
Este comando es capaz de limpiar la base de datos de manera relacional segura y repoblarla completamente, inyectando un **Cheat Sheet** de usuarios listos para ser consumidos (1 Admin, 2 Profesores y 6 Estudiantes con métricas variadas), poblando Cursos, Módulos, Lecciones, Quizzes resueltos (con `Option.bulkCreate`), Misiones (con entregas en estado `PENDING`, `APPROVED` y `REJECTED` listas para evaluación docente), Aulas y progresiones de gamificación (con puntajes asimétricos para validar el Leaderboard). Ver el `README.md` para la lista completa de credenciales.

## Autenticacion y Seguridad

El sistema implementa una capa robusta de seguridad gestionada por el modulo `auth` (AuthModule).

### Estrategia de Seguridad
- **Hashing**: Las contraseñas de los usuarios se encriptan utilizando `bcrypt` con un salt de 10 rondas antes de persistirse en la base de datos.
- **Autenticacion (JWT)**: Se implementa mediante `JwtStrategy` y `JwtAuthGuard` (basado en `passport-jwt`). La autenticacion se mantiene emitiendo tokens firmados de forma asincrona, con un payload que incluye identificadores inofensivos (`id`, `email`, `role`).
- **Autorizacion Basada en Roles (RBAC)**: Se utiliza un decorador personalizado `@Roles()` acoplado a un `RolesGuard`. Este guard emplea `Reflector` para contrastar los roles requeridos por el endpoint contra el rol mapeado en el token del usuario.
- **Validacion Estricta**: La aplicacion activa un `ValidationPipe` global en la etapa de bootstrap (`main.ts`). Esta tuberia depura los payloads (whitelist), rechaza campos no autorizados (forbidNonWhitelisted) y transforma los datos automaticamente basandose en los Data Transfer Objects (DTOs) definidos mediante `class-validator`. Además, se utiliza `@nestjs/mapped-types` (`PartialType`) para inferir automáticamente los esquemas opcionales en los DTOs de actualización (`PATCH`).
- **Resiliencia JWT**: En `JwtStrategy`, el payload no solo se decodifica, sino que se cruza con la base de datos (`UsersService.getProfile`) para garantizar que el usuario exista y siga activo (`isActive: true`), previniendo así el acceso con tokens huérfanos.

### Manejo de Errores (Filtro Global)

Para evitar respuestas genéricas de Error 500 ante excepciones no controladas de la base de datos, el backend registra un interceptor global (`SequelizeExceptionFilter`). Este filtro captura transgresiones referenciales de PostgreSQL a través de Sequelize (como `SequelizeForeignKeyConstraintError` o `SequelizeUniqueConstraintError`) y los muta a respuestas HTTP semánticas (`400 Bad Request` o `409 Conflict`), informando de forma amigable si una entidad referenciada no existe o si hubo colisiones en llaves únicas (ej. al repetir el valor `order` en módulos y lecciones).

### Mapa Completo de Endpoints

A continuación se detalla la radiografía actualizada de los endpoints expuestos, incluyendo métodos HTTP, roles, guards y formato de consulta. Todos los endpoints (excepto Auth público) utilizan `@UseGuards(JwtAuthGuard)`.

#### 1. Módulo Admin (`/admin`) - `@Roles('ADMIN')`
- **`GET /admin/audit-logs`**: Retorna el registro de auditoría. Permite query params: `page`, `limit`, `userId`, `action`, `resource`.
- **`GET /admin/users`**: Listado de usuarios. Query params: `page`, `limit`, `search` (nombre/email), `role`, `isActive`.
- **`PATCH /admin/users/:id/status`**: Activa/desactiva un usuario.
- **`PATCH /admin/users/:id/role`**: Cambia el rol de un usuario.
- **`GET /admin/stats/overview`**: Estadísticas globales (usuarios activos, cursos, etc).

#### 2. Módulo Auth (`/auth`)
- **`POST /auth/register`**: Público. Crea un nuevo usuario.
- **`POST /auth/login`**: Público. Autenticación y generación de JWT.
- **`POST /auth/forgot-password`**: Público. Genera token de reseteo.
- **`POST /auth/reset-password`**: Público. Consume token de reseteo.
- **`GET /auth/admin-test`**: `@Roles('ADMIN')`. Verifica privilegios de administrador.

#### 3. Módulo Users (`/users`)
- **`GET /users/profile`**: Autenticado. Devuelve el perfil actual.
- **`PATCH /users/profile`**: Autenticado. Actualiza datos básicos.
- **`POST /users/change-password`**: Autenticado. Cambia la contraseña.

#### 4. Módulo Classrooms (`/classrooms`)
- **`POST /classrooms`**: `@Roles('TEACHER', 'ADMIN')`. Crea un aula.
- **`POST /classrooms/join`**: `@Roles('STUDENT', 'ADMIN')`. Estudiante se une con código.
- **`GET /classrooms`**: `@Roles('TEACHER', 'ADMIN', 'STUDENT')`. Query `includeInactive`.
- **`GET /classrooms/:id`**: `@Roles('TEACHER', 'ADMIN')`. Detalle completo.
- **`GET /classrooms/:id/metrics`**: `@Roles('TEACHER', 'ADMIN')`. Progreso agrupado del aula.
- **`PATCH /classrooms/:id`** y **`DELETE /classrooms/:id`**: `@Roles('TEACHER', 'ADMIN')`.
- **`GET /classrooms/:id/students`** y **`DELETE /classrooms/:id/students/:studentId`**: `@Roles('TEACHER', 'ADMIN')`. Gestión de nómina.
- **`POST /classrooms/:id/modules`**, **`PATCH /classrooms/:id/modules/:moduleId`**, **`DELETE /classrooms/:id/modules/:moduleId`**: `@Roles('TEACHER', 'ADMIN')`.
- **`GET /classrooms/:id/modules`**: `@Roles('TEACHER', 'ADMIN', 'STUDENT')`. Módulos asignados.

#### 5. Módulo Contenido (`/courses`, `/modules`, `/lessons`)
- **`POST`**, **`PATCH :id`**, **`DELETE :id`** (en `/courses`, `/modules`, `/lessons`): `@Roles('TEACHER', 'ADMIN')`. Mutaciones de jerarquía.
- **`GET /courses`**, **`GET /modules`**, **`GET /lessons`**: `@Roles('TEACHER', 'ADMIN', 'STUDENT')`.
- **`GET /courses/:id`**, **`GET /lessons/:id`**: `@Roles('TEACHER', 'ADMIN', 'STUDENT')`. Query `includeInactive` (solo docentes).
- **`GET /modules/:id`**: `@Roles('TEACHER', 'ADMIN', 'STUDENT')`.  Retorna el módulo con sus lecciones (incluye flag boolean `isCompleted` y timestamp `completedAt` basado en `LessonProgress` del alumno autenticado) y sus evaluaciones (quizzes incluyen metadata y estadísticas de intentos del usuario: `isPassed`, `highestScore`, `attemptsCount`, sin exponer jamás el flag `isCorrect` de las opciones).
- **`GET /courses/progress/me`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`. Progreso global.
- **`GET /courses/progress/:studentId`**: `@Roles('TEACHER', 'ADMIN')`.
- **`POST /lessons/:id/complete`**: `@Roles('STUDENT')`. Marca lección completada e impacta Gamificación.

#### 6. Módulo Evaluaciones (`/quizzes`)
- **`POST /quizzes`**, **`PATCH /quizzes/:id`**, **`DELETE /quizzes/:id`**: `@Roles('TEACHER', 'ADMIN')`.
- **`GET /quizzes`**, **`GET /quizzes/:id`**: `@Roles('TEACHER', 'ADMIN', 'STUDENT')`. Anti-trampas automático para `STUDENT`.
- **`POST /quizzes/:id/submit`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`. Resolución segura en backend.
- **`GET /quizzes/:id/my-attempts`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`.

#### 7. Módulo Misiones (`/missions`)
- **`POST /missions`**, **`PATCH /missions/:id`**, **`DELETE /missions/:id`**: `@Roles('TEACHER', 'ADMIN')`.
- **`GET /missions`**, **`GET /missions/:id`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`.
- **`POST /missions/:id/submit`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`. Entrega de evidencia.
- **`GET /missions/submissions/my-submissions`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`. Bandeja personal.
- **`GET /missions/:id/submissions`**: `@Roles('TEACHER', 'ADMIN')`. Mesa de corrección docente.
- **`PATCH /missions/submissions/:submissionId/review`**: `@Roles('TEACHER', 'ADMIN')`. Feedback y aprobación.

#### 8. Módulo Gamificación (`/gamification`)
- **`GET /gamification/profile`**, **`GET /gamification/badges`**, **`GET /gamification/badges/icons`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`.
- **`GET /gamification/leaderboard`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`. Ranking global. Admite `page`, `limit`, `timeframe`.
- **`GET /gamification/leaderboard/classroom/:classroomId`**: `@Roles('STUDENT', 'TEACHER', 'ADMIN')`. Ranking áulico.
- **`POST /gamification/badges`**: `@Roles('ADMIN')`.

## Configuración y Entorno

El backend está diseñado para ser configurable mediante variables de entorno (almacenadas en `.env` y documentadas en `.env.example`).

- **CORS (Cross-Origin Resource Sharing)**: La aplicación habilita peticiones originadas desde clientes externos web (como Angular o React). En el archivo principal `src/main.ts`, la configuración extrae dinámicamente el origen permitido utilizando la variable de entorno `FRONTEND_URL`. Si esta variable no está definida, hace un *fallback* seguro a `http://localhost:4200` para entornos locales de desarrollo.

## Herramientas de Pruebas

El repositorio incluye una coleccion exportada en `docs/insomnia/ecoaprende-api.insomnia.json` con la configuracion pre-armada de los endpoints de la API. Esta coleccion refleja el flujo integrado de roles, las llamadas para recuperacion de contraseña, la gestión del perfil de usuario, el cambio de contraseña autenticado, el CRUD completo para la gestión de Aulas (Classrooms), las Métricas Agregadas por Aula (`GET /classrooms/:id/metrics`), el mecanismo de inscripción de estudiantes a las aulas, la administración de la nómina de alumnos (listado y remoción), la jerarquía completa del CRUD de Contenido (Cursos, Módulos y Lecciones con sus respectivas validaciones, estados de publicación y obtención de árboles completos), la gestión transaccional de Evaluaciones (Quizzes, Preguntas, Opciones) junto con sus validaciones anti-trampas, la resolución automática de evaluaciones con historial inmutable de intentos (QuizAttempt), el circuito íntegro del ciclo de Misiones (creación, entrega de evidencias y proceso de revisión con firma de auditoría), la mecánica central de Gamificación (XP, insignias dinámicas generadas por el motor de reglas con su nuevo catálogo de íconos temáticos, rachas y rankings de estudiantes a nivel global o filtrados dinámicamente por aulas y periodos temporales), la interconexión mediante la asignación dinámica de Módulos en Aulas, y por último un sólido panel de Administración con auditoría continua (`AuditLogs`), mutación de roles/estados de usuario, estadísticas globales, y endpoints refactorizados con los nuevos helpers de paginación y filtrado unificado. Todo esto permitiendo facilitar pruebas manuales inmediatas.

## Despliegue y Orquestacion

La aplicacion esta contenida mediante Docker.
- `Dockerfile`: Define el entorno de ejecucion de la aplicacion NodeJS.
- `docker-compose.yml`: Orquesta el contenedor de la aplicacion y la base de datos localmente, automatizando el proceso de aprovisionamiento de dependencias mediante un volumen virtual (`node_modules`).
