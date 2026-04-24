FROM node:20-alpine

WORKDIR /app

COPY package.json .npmrc .env* ./
RUN npm install

COPY . .

EXPOSE ${PORT:-4000}

CMD ["node", "server.js"]