FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia dependências e schema prisma
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install
RUN npx prisma generate

# Copia documentação (planilhas de referência) e fontes do backend
COPY docs ./docs/
COPY backend ./

# Torna o entrypoint executável e faz o build
RUN chmod +x ./docker-entrypoint.sh && npm run build

ENV PORT=3333
EXPOSE 3333

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
