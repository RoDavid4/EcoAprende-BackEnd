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

## Variables de entorno

El sistema utiliza las siguientes variables para su configuracion basica (se proveen valores por defecto a nivel de `docker-compose.yml` para desarrollo):

- `DATABASE_URL`: Cadena de conexion a PostgreSQL.
- `NODE_ENV`: Entorno de ejecucion (ej. `development` o `production`).
