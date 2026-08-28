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
| **TEACHER** | Profe EcoAprende | `profesora.garcia@ecoaprende.com` | `Teacher123!` | Creación de aulas, asignación de cursos y módulos |
| **TEACHER** | Profe EcoAprende | `profesor.martinez@ecoaprende.com` | `Teacher123!` | Creación de aulas, asignación de cursos y módulos |
| **STUDENT** | Student 1 a 3 | `student1@student.com` | `Student123!` | Usuarios avanzados: Nivel 5+, 600+ XP, Streak 10+, medalla ECO_HERO, progreso avanzado |
| **STUDENT** | Student 4 a 10 | `student4@student.com` | `Student123!` | Usuarios intermedios: Nivel 2, 150+ XP, Streak 3+, progreso intermedio |
| **STUDENT** | Student 11 a 15| `student11@student.com`| `Student123!` | Usuarios nuevos (0 XP, Nivel 1) para pruebas iniciales, sin lecciones ni misiones completadas |

*(Nota: En total el seeder genera 15 estudiantes para validar correctamente las características de paginación `page=1, limit=10` de la plataforma).*

### Contenido y Cursos

Se han sembrado cursos para simular escenarios reales de paginación y navegación:
- **"Diplomatura Integral en Sustentabilidad Urbana"**: Curso intensivo que contiene **15 módulos**.
- El **Módulo 1** de esta Diplomatura contiene a su vez **15 lecciones** completas y ordenadas correlativamente, útil para validar cargas grandes de contenido.

### Misiones y Entregas (Missions & Submissions)

El script siembra un entorno de misiones listo para validación docente:

- **4 Misiones Prácticas:**
  1. "Compostaje Domiciliario en Acción" (80 XP)
  2. "Eco-Botellas / Punto Limpio" (50 XP)
  3. "Auditoría de Consumo Eléctrico Familiar" (60 XP)
  4. "Plantación de Especie Nativa o Huerta Urbana" (100 XP)

- **3 Entregas de Muestra (Submissions):**
  - **APPROVED:** Alumno `Student 3` (reemplaza a Carlos López) en Misión 1 (con feedback del docente).
  - **PENDING:** Alumno `Student 1` (reemplaza a Juan Pérez) en Misión 2 (evidencia subida, lista para corrección docente en demo).
  - **REJECTED:** Alumno `Student 2` (reemplaza a Ana Gómez) en Misión 3 (con observaciones para reenvío).
  - *La Misión 4 se encuentra disponible sin entregas para probar envíos en vivo.*

## Variables de entorno

El sistema utiliza las siguientes variables para su configuracion basica (se proveen valores por defecto a nivel de `docker-compose.yml` para desarrollo):

- `DB_HOST`: Host de la base de datos (`database` en entorno Docker).
- `DB_PORT`: Puerto de PostgreSQL (por defecto `5432`).
- `DB_USER`: Usuario de la base de datos.
- `DB_PASSWORD`: Contrasena de la base de datos.
- `DB_NAME`: Nombre de la base de datos (`ecoaprende_db`).
- `NODE_ENV`: Entorno de ejecucion (ej. `development` o `production`).
