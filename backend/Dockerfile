FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN mkdir -p dist/config && cp src/config/schema.sql dist/config/schema.sql

EXPOSE 5000

CMD ["npm", "run", "start"]