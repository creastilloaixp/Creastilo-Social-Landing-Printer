FROM node:20-alpine

WORKDIR /app

COPY package.json .env* ./
RUN npm install

COPY . .

EXPOSE ${PORT:-4000}

CMD ["node", "server.js"]