FROM node:20-alpine

WORKDIR /app

# Copia arquivos do backend
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

WORKDIR /app/backend
RUN npm install
RUN npx prisma generate

WORKDIR /app
COPY backend ./backend/

WORKDIR /app/backend
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]


