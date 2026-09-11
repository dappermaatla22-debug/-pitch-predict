FROM node:20-slim

WORKDIR /app

COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/

WORKDIR /app/server
RUN npm install
RUN npx prisma generate

COPY server/ .
RUN npx tsc

EXPOSE 3001
CMD ["node", "dist/index.js"]
