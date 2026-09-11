FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .
RUN npx tsc

EXPOSE 3001
CMD ["node", "dist/index.js"]
