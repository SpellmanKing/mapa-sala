FROM node:20-alpine

WORKDIR /app

# Copia apenas package.json primeiro (melhora cache)
COPY package.json ./

RUN npm install

# Copia o restante
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm","run","start"]

