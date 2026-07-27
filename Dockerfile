FROM node:20-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Usamos el servidor de desarrollo por defecto para permitir hot-reload
CMD ["npm", "run", "start:dev"]
