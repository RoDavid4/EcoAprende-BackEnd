# EcoAprende Backend

Este repositorio contiene la API REST de EcoAprende, desarrollada con NestJS y TypeScript. 

## Requisitos previos

- Docker y Docker Compose instalados en el entorno de desarrollo.
- Node.js v20 (si se desea ejecutar de manera local sin contenedores).

## Instrucciones de ejecucion

El entorno esta configurado para iniciar la base de datos PostgreSQL y la API en contenedores de Docker, ejecutando la instalacion de dependencias de forma automatizada al levantar el servicio.

1. Construir y levantar los contenedores:
   ```bash
   docker compose up --build
   ```
2. La API estara disponible en `http://localhost:3000`.

## Scripts disponibles

Si se opera fuera de Docker, los comandos principales definidos en `package.json` son:

- `npm run start`: Inicia el servidor.
- `npm run start:dev`: Inicia el servidor en modo desarrollo (watch mode).
- `npm run build`: Compila la aplicacion para produccion en el directorio `/dist`.
- `npm run test`: Ejecuta la suite de pruebas unitarias.

## Inicialización de Datos de Prueba (Database Seeding)

Para facilitar el desarrollo y el QA, el proyecto incluye un script de siembra de base de datos (`seed`) que de forma segura e idempotente limpia el esquema y repuebla relacionalmente cursos, aulas, lecciones, quizzes, progresión (gamificación) y logs de auditoría simulados.

### ¿Cómo ejecutarlo?

**Con Docker Compose:**
```bash
docker compose exec backend npm run seed
```

**En local (sin Docker):**
```bash
npm run seed
```

*(Nota: Asegurarse de haber levantado el backend al menos una vez para que el `SeederService` inicialice correctamente los roles requeridos).*

### Credenciales de Prueba (Cheat Sheet)

El script genera las siguientes cuentas listas para utilizarse:

| Rol | Nombre | Email | Contraseña | Detalle / Uso |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Administrador | `admin@ecoaprende.com` | `Admin123!` | Métricas globales, gestión de usuarios, auditoría |
| **TEACHER** | Profe EcoAprende | `profe@ecoaprende.com` | `Teacher123!` | Creación de aulas, asignación de cursos y módulos |
| **STUDENT** | Juan Pérez | `juan.perez@student.com` | `Student123!` | 150 XP, Nivel 2, Streak 3, progreso en Aula 1 |
| **STUDENT** | Ana Gómez | `ana.gomez@student.com` | `Student123!` | 320 XP, Nivel 4, Streak 5, progreso intermedio |
| **STUDENT** | Carlos López | `carlos.lopez@student.com` | `Student123!` | 500 XP, Nivel 5, Líder en Leaderboard |
| **STUDENT** | Sofía Castro | `sofia.castro@student.com` | `Student123!` | Usuario nuevo (0 XP, Nivel 1) para pruebas iniciales |

## Variables de entorno

El sistema utiliza las siguientes variables para su configuracion basica (se proveen valores por defecto a nivel de `docker-compose.yml` para desarrollo):

- `DB_HOST`: Host de la base de datos (`database` en entorno Docker).
- `DB_PORT`: Puerto de PostgreSQL (por defecto `5432`).
- `DB_USER`: Usuario de la base de datos.
- `DB_PASSWORD`: Contrasena de la base de datos.
- `DB_NAME`: Nombre de la base de datos (`ecoaprende_db`).
- `NODE_ENV`: Entorno de ejecucion (ej. `development` o `production`).
