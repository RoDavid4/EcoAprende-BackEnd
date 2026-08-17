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
- **Validacion Estricta**: La aplicacion activa un `ValidationPipe` global en la etapa de bootstrap (`main.ts`). Esta tuberia depura los payloads (whitelist), rechaza campos no autorizados (forbidNonWhitelisted) y transforma los datos automaticamente basandose en los Data Transfer Objects (DTOs) definidos mediante `class-validator`. Además, se utiliza `@nestjs/mapped-types` (`PartialType`) para inferir automáticamente los esquemas opcionales en los DTOs de actualización (`PATCH`).
- **Resiliencia JWT**: En `JwtStrategy`, el payload no solo se decodifica, sino que se cruza con la base de datos (`UsersService.getProfile`) para garantizar que el usuario exista y siga activo (`isActive: true`), previniendo así el acceso con tokens huérfanos.

### Manejo de Errores (Filtro Global)

Para evitar respuestas genéricas de Error 500 ante excepciones no controladas de la base de datos, el backend registra un interceptor global (`SequelizeExceptionFilter`). Este filtro captura transgresiones referenciales de PostgreSQL a través de Sequelize (como `SequelizeForeignKeyConstraintError` o `SequelizeUniqueConstraintError`) y los muta a respuestas HTTP semánticas (`400 Bad Request` o `409 Conflict`), informando de forma amigable si una entidad referenciada no existe o si hubo colisiones en llaves únicas (ej. al repetir el valor `order` en módulos y lecciones).

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
  - **Seguridad (`PATCH` / `DELETE`)**: Solo el profesor creador o un usuario con rol `ADMIN` pueden editar o eliminar el aula. Si un docente intenta modificar un aula ajena, se devuelve `403 Forbidden`.
  - **Edición y Reactivación (`PATCH`)**: Se permite actualizar nombre, descripción y el estado `isActive` (útil para reactivar aulas previamente desactivadas). Las consultas buscan por `id` de forma agnóstica al estado.
  - **Desactivación Lógica (`DELETE`)**: Establece `isActive: false` manteniendo el registro histórico en base de datos.

- **Gestión de Nómina de Estudiantes (`GET /classrooms/:id/students`, `DELETE /classrooms/:id/students/:studentId`)**
  - **Listado (`GET`)**: Retorna la lista de alumnos inscriptos en un aula específica, restringido al profesor creador de la misma o a un administrador.
  - **Desvinculación (`DELETE`)**: Permite la desvinculación/remoción de un estudiante del aula mediante la eliminación de su registro en la tabla `ClassroomStudent`.
  - **Validaciones de Seguridad**: Exige la misma validación de autoría o rol `ADMIN` (retornando `403 Forbidden` ante un intento de gestión ajeno) y verifica que el estudiante efectivamente esté inscrito antes de removerlo (retornando `404 Not Found` si no pertenece a dicha aula).

- **Gestión de Módulos en Aulas (`POST /classrooms/:id/modules`, `GET`, `PATCH`, `DELETE`)**
  - **Asignación (`POST`)**: Permite al docente (o ADMIN) vincular un módulo a su aula. Se valida la existencia del módulo y se protege contra duplicaciones de asignación mediante el control de colisión y el filtro de base de datos.
  - **Listado (`GET`)**: Los usuarios `STUDENT` que están inscriptos en el aula consultada solo reciben los módulos asignados que se encuentren activos y tengan el flag `isVisible: true`. Los docentes y administradores visualizan la nómina completa.
  - **Alternar Visibilidad (`PATCH`)**: Acepta el flag `isVisible` para ocultar o mostrar contenido temporalmente a los alumnos de un aula específica sin tener que desvincular el módulo entero.
  - **Desvinculación (`DELETE`)**: Elimina el registro pivot en `ClassroomModule`, cortando la relación entre el aula y el módulo.

### Endpoints (Content: Courses, Modules, Lessons, Quizzes)

Estos endpoints son provistos por `CoursesModule` y `QuizzesModule` para gestionar la estructura jerárquica de contenidos del sistema educativo y sus evaluaciones correspondientes.

- **Jerarquía de Lectura (`GET /courses`, `GET /modules`, `GET /lessons`)**
  - **Accesibilidad Dinámica**: Los usuarios con rol `STUDENT` únicamente reciben contenidos con `isActive: true` y `status: 'PUBLISHED'`. Los roles `TEACHER` y `ADMIN` reciben la nómina completa incluyendo los borradores (`DRAFT`).
  - **Anidación y Ordenamiento**: Al consultar un curso por ID, el endpoint anida automáticamente el árbol de módulos activos (y publicados, si el lector es alumno) ordenados de forma ascendente por su propiedad `order`. De igual manera, al consultar un módulo, se anexan sus lecciones respetando su respectivo `order ASC`.

- **Mutación de Contenido (`POST`, `PATCH`, `DELETE`)**
  - **Seguridad y Creación**: Acciones estrictamente limitadas a roles `TEACHER` y `ADMIN`. Al crear un curso, el sistema inyecta automáticamente el ID del creador (`createdById`) extraído del payload del JWT de forma segura.
  - **Validaciones Anti-Colisiones**: La lógica de negocio (`ModulesService` y `LessonsService`) revisa preventivamente la posible colisión de índices de orden y puede auto-calcular de forma determinista el consecutivo libre (mediante `max() + 1`) garantizando consistencia en las listas de reproducción multimedia.

- **Gestión de Evaluaciones (`POST /quizzes`, `GET`, `PATCH`, `DELETE`)**
  - **Creación Transaccional y Validaciones**: La creación de evaluaciones permite enviar payloads anidados (`Quiz` con array de `questions` y array de `options`). La capa de servicios envuelve la creación en una transacción (`sequelize.transaction`). Adicionalmente, validaciones DTO y reglas de negocio garantizan que cada pregunta disponga de al menos 2 opciones y obligatoriamente contenga al menos una opción correcta (`isCorrect: true`).
  - **Consultas con Prevención de Trampas (`GET /quizzes/:id`)**: Si el usuario que efectúa la consulta posee el rol `STUDENT`, el backend aplica una política de seguridad que excluye dinámicamente el atributo `isCorrect` de todas las opciones en la respuesta. Esto imposibilita el fraude mediante inspección de tráfico de red.
  - **Restricciones RBAC**: La mutación de evaluaciones (creación, edición, eliminación) es un privilegio exclusivo para usuarios con roles `TEACHER` o `ADMIN`.

- **Resolución de Evaluaciones (`POST /quizzes/:id/submit`, `GET /quizzes/:id/my-attempts`)**
  - **Calificación Automática en Servidor**: Al enviar el payload del examen (`SubmitQuizDto`), el backend ignora cualquier puntaje sugerido por el cliente. La evaluación se realiza recuperando desde la base de datos las opciones marcadas con `isCorrect: true`, comparándolas contra las seleccionadas por el alumno y sumando los puntajes de manera segura y determinista. Posteriormente se calcula el porcentaje sobre `100` y se establece el flag `isPassed` comparando con el `passingScore`.
  - **Control de Reintentos**: Antes de permitir la rendición, el servicio cuenta la cantidad de registros previos del usuario en `quiz_attempts` para esa evaluación. Si el número iguala o supera el `maxAttempts` definido por el docente, la operación es rechazada con `400 Bad Request`.

### Endpoints (Missions)

Este módulo gestiona la creación de retos y misiones ambientales junto con su respectivo circuito de corrección.

- **Gestión de la Consigna (`POST /missions`, `PATCH /missions/:id`, `DELETE /missions/:id`)**
  - **Seguridad**: Acceso exclusivo para roles `TEACHER` y `ADMIN`. El backend inyecta de forma segura el ID del creador (`createdById`) desde el token JWT en el momento de la creación.

- **Circuito de Entregas y Revisión**
  - **Envío de Evidencia (`POST /missions/:id/submit`)**: Restringido a `STUDENT`. El backend valida la existencia de la misión y aplica una política anti-duplicación: si el estudiante ya posee una entrega en estado `PENDING` o `APPROVED`, la operación es rechazada con un `409 Conflict`.
  - **Bandeja del Alumno (`GET /missions/submissions/my-submissions`)**: Restringido a `STUDENT`. Retorna el historial personal de misiones entregadas para consultar sus estados y el `feedback` recibido del docente.
  - **Mesa de Revisión (`GET /missions/:id/submissions`, `PATCH /missions/submissions/:submissionId/review`)**: Restringido a `TEACHER` y `ADMIN`. Permite visualizar la nómina completa de entregas de una misión específica. Al revisar (aprobar/rechazar) una entrega, el sistema sella de manera inmutable el `reviewedById` (ID del evaluador) y el timestamp `reviewedAt`, adjuntando las observaciones pedagógicas en el campo `feedback`.

## Herramientas de Pruebas

El repositorio incluye una coleccion exportada en `docs/insomnia/ecoaprende-api.insomnia.json` con la configuracion pre-armada de los endpoints de la API. Esta coleccion refleja el flujo integrado de roles, las llamadas para recuperacion de contraseña, la gestión del perfil de usuario, el cambio de contraseña autenticado, el CRUD completo para la gestión de Aulas (Classrooms), el mecanismo de inscripción de estudiantes a las aulas, la administración de la nómina de alumnos (listado y remoción), la jerarquía completa del CRUD de Contenido (Cursos, Módulos y Lecciones con sus respectivas validaciones y estados de publicación), la gestión transaccional de Evaluaciones (Quizzes, Preguntas, Opciones) junto con sus validaciones anti-trampas, la resolución automática de evaluaciones con historial inmutable de intentos (QuizAttempt), el circuito íntegro del ciclo de Misiones (creación, entrega de evidencias y proceso de revisión con firma de auditoría), y finalmente la interconexión mediante la asignación dinámica de Módulos en Aulas, permitiendo facilitar pruebas manuales inmediatas.

## Despliegue y Orquestacion

La aplicacion esta contenida mediante Docker.
- `Dockerfile`: Define el entorno de ejecucion de la aplicacion NodeJS.
- `docker-compose.yml`: Orquesta el contenedor de la aplicacion y la base de datos localmente, automatizando el proceso de aprovisionamiento de dependencias mediante un volumen virtual (`node_modules`).
