# Backend (modernizado)

Este diretório será o backend reescrito com **NestJS + TypeScript + Prisma**.

Estratégia:
- Manter contratos JSON compatíveis
- Manter, por um tempo, os paths legados: `/controllers/*.php`
- Gradual migration: serviços/use-cases portados primeiro, depois repositories/ORM.

