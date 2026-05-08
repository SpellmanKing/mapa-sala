# SGST Mapas de Sala — PHP → JavaScript (Node.js)

> Projeto de mapeamento de salas com back-end em Node.js (Express) para substituir os controllers PHP legados, preservando regras de negócio e contratos JSON.

---

## Status do Projeto
- **Transposição incremental (modo compatibilidade)**: endpoints do Node replicam os JSONs do PHP para que o frontend atual continue funcionando.
- Implementações críticas já realocadas para JS:
  - `POST /controllers/alocar_turma.php` com lógica equivalente de:
    - busca de **curso** (equivalente a `Curso->buscarPorId`)
    - cálculo de cronograma
    - **disponibilidade** via consulta real em `agendamentos`
    - fallback para **auditório** (`idTipo_sala=5`)

---

## Tecnologias

- Node.js + Express
- MySQL (via `mysql2/promise`)
- ESM modules (`"type": "module"`)

---

## Requisitos
- Node.js 18+ (recomendado)
- MySQL acessível

---

## Instalação (local)

### 1) Instalar dependências
```bash
npm install
```

### 2) Configurar variáveis de ambiente
Crie um arquivo `.env` (exemplo):

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=sgst_bd
```

> Observação: ajustes podem ser necessários conforme `src/db/mysql.js`.

### 3) Rodar aplicação
```bash
npm run dev
```

Abra:
- `http://localhost:3000`

---

## Arquitetura (sob o capô)

### Camadas principais
- **Routes** (`src/routes/*`)
  - Controlam verbos HTTP e convertem `req.body` / `req.query`.
- **Services** (`src/services/*`)
  - Contêm regras de negócio (ex.: cronograma, disponibilidade, alocação, fallback).
- **DB** (`src/db/*`)
  - Pool e acesso ao MySQL com queries parametrizadas.

### Contratos JSON
Endpoints do Node expõem contratos compatíveis com o PHP:
- `success: boolean`
- `salas: [...]`
- `dataInicio`, `dataTermino`, `turnoId`
- `message`/`error`

---

## Plano de Testes (100% de equivalência)

### 1) Equivalência lógica (PHP vs Node)
Crie uma bateria de testes comparativos:
- **Entradas**: mesmo `cursoId`, `totalAlunos`, `turno`, `diasSemana`, `dataInicio`.
- **Saída**: comparar JSON do Node vs JSON do PHP (quando possível) para:
  - `salas` sugeridas (mesmo conjunto/ordem)
  - `dataTermino`
  - `turnoId`

Sugestão de abordagem:
- Testes automatizados com Jest (quando o projeto estiver finalizado)
- Runner iterando cenários fixos e coletando snapshots.

### 2) Validação de lógica de coordenadas e renderização
(Quando houver migração do módulo do mapa)
- Para cada objeto do mapa:
  - compare coordenadas e bounds renderizadas
  - use tolerância numérica para floats (ex.: `epsilon = 0.01px`)

### 3) Persistência e tipos
Verifique:
- números de ponto flutuante (coordenadas/escala)
- conversão de tipos de `Number()` no Node antes de cálculos
- integridade de chaves e índices do MySQL (ex.: UNIQUE `agendamentos(id_salas,data_aula)`)

### 4) Tratamento de exceções global
- garantir que falhas na renderização/serviço não derrubem o servidor
- padronizar `return { success:false, error:'...' }`

---

## Refatoração e Limpeza (Clean Code / SOLID)

Recomendações para evolução do código:
- Extrair services ainda monolíticos
- Unificar helpers (ex.: `TURNOS_MAP`, chunking de queries)
- Tipar retornos (mesmo em JS, via JSDoc)

---

## Performance (Render/Mapa)

Quando o módulo visual for portado completamente:
- Canvas/SVG com `requestAnimationFrame`
- memoization por estado
- virtualização/viewport culling
- drag & drop com snapping usando coordenadas normalizadas (world coords)

---

## Segurança

- Queries com **placeholders** (`?`) em todo SQL
- Sanitização contra XSS no frontend (quando aplicar tooltips/textos de usuário)
- Não confiar em `req.body`: validar schema
  - (recomendado) `zod`/`joi` para validação estrita

---

## Dockerização

> Arquivos abaixo devem ser criados quando o projeto estiver consolidado.

- `Dockerfile`
- `docker-compose.yml`

---

## CI/CD (GitHub Actions)

Workflow básico:
- instalar deps
- rodar lint
- rodar testes

Exemplo:
- `npm run lint`
- `npm test`

---

## Licença
MIT (ver `LICENSE`)

---

## Créditos
Equipe do SGST / SENAC

