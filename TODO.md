# TODO — Modernização completa (Reescrita total do projeto) (PHP → NestJS/TS/Prisma + React)


## Backend (NestJS + TypeScript + Prisma)
- [ ] Criar projeto NestJS (ou reestruturar no repo atual) mantendo o contrato JSON atual.
- [ ] Definir `main.ts`, configuração CORS e middleware (limites body, etc.).
- [ ] Criar schema Prisma a partir de `sgst_bd.sql` (models + índices essenciais).
- [ ] Implementar camada **Controllers → Services/UseCases → Repositories**.
- [ ] Migrar endpoint(s) existentes mantendo paths compatíveis:
  - [ ] POST `/controllers/alocar_turma.php`
  - [ ] POST `/controllers/calcular_cronograma.php`
  - [ ] GET/POST `/controllers/gerenciar_cursos.php`
  - [ ] GET/POST `/controllers/gerenciar_instrutores.php`
  - [ ] GET/POST `/controllers/gerenciar_sala.php`
  - [ ] GET/POST `/controllers/gerenciar_feriado.php`
  - [ ] GET/POST `/controllers/gerenciar_turma.php`
- [ ] Implementar Error Handling global (status code correto + payload padronizado).
- [ ] Implementar validação de entrada com `zod`/DTOs (ex.: `cursoId`, `totalAlunos`, `turno`, `diasSemana`, `dataInicio`).
- [ ] Integrar cache Redis quando aplicável (ex.: cronograma/salas).
- [ ] Adicionar testes unitários para regras (cronograma, melhor alocação, disponibilidade).
- [ ] Adicionar testes de integração para endpoints principais.

## Frontend (React + Tailwind/estilo moderno)
- [ ] Criar app React (Vite) dentro do repo (ex.: `frontend-react/`).
- [ ] Criar layout base (Sidebar + Sections) com componentes.
- [ ] Implementar clientes de API (axios/fetch) com tipagem TS.
- [ ] Migrar primeiro fluxo: **Painel Visual + Calculadora** conectando em `POST /controllers/alocar_turma.php`.
- [ ] Migrar modais (Agendar Turma, Alocação Automática, Feriados, etc.).
- [ ] Preservar “pixel-perfect”: portar CSS atual para Tailwind/custom ou reescrever estilos.
- [ ] Validar responsividade e performance (memoization, React Query, loading states).

## Entrega
- [ ] Substituir referências do HTML legado para o bundle React.
- [ ] Ajustar Docker (se necessário) para rodar backend Nest e servir frontend.
- [ ] Rodar `lint`, `typecheck` e testes.
- [ ] Garantir equivalência funcional com os endpoints legados (JSONs compatíveis).

