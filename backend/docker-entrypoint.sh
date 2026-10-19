#!/bin/sh
set -e

echo "==> SGST Backend Entrypoint <=="

echo "==> Aplicando migrações do Prisma..."
npx prisma migrate deploy

echo "==> Carregando dados de referência de forma idempotente..."
npx tsx prisma/seedReferenceData.ts

echo "==> Iniciando o servidor..."
exec "$@"
