# SGST — Sistema de Gestão de Salas, Turmas e Ambientes Pedagógicos

<div align="center">

![SENAC DF](https://img.shields.io/badge/SENAC-Distrito%20Federal-004a8f?style=for-the-badge&logo=institution&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38b2ac?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2d3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-Unit%20Tests-fcc72b?style=for-the-badge&logo=vitest&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<p align="center">
  <strong>Plataforma corporativa para alocação inteligente de ambientes educacionais, cálculo automatizado de calendários letivos e prevenção de conflitos de ocupação em tempo real.</strong>
</p>

[Visão Geral](#-visão-geral) •
[Funcionalidades](#-funcionalidades-principais) •
[Arquitetura](#-arquitetura-do-sistema) •
[Modelo de Dados](#-modelo-de-dados) •
[Stack Tecnológica](#-stack-tecnológica) •
[Instalação e Execução](#-instalação-e-execução) •
[API Reference](#-referência-da-api) •
[Testes & Qualidade](#-testes-e-qualidade-de-código)

</div>

---

## 📌 Visão Geral

O **SGST (Sistema de Gestão de Salas e Turmas)** é uma solução de engenharia de software desenvolvida para solucionar a complexidade logística e operacional de planejamento acadêmico em unidades do **SENAC Distrito Federal** (com destaque para o *CEP Jessé Freire*, *Talal Abu-Allan* e *Recanto das Emas*).

O SGST opera em uma arquitetura moderna desacoplada em **Node.js, TypeScript, Express, Prisma ORM, PostgreSQL e React SPA com Vite e Tailwind CSS**, garantindo alta performance, consistência de dados e experiência de usuário intuitiva.

### Principais Objetivos
- **Eliminação de Conflitos Físicos**: Validação matemática e atômica de horários, turnos e salas, impedindo sobreposição de turmas no mesmo ambiente.
- **Respeito à Capacidade Máxima**: Validação no frontend e no backend garantindo que a quantidade prevista de alunos nunca exceda o limite físico do ambiente.
- **Cálculo Automatizado de Cronogramas**: Algoritmo dedicado que projeta automaticamente a data de término e dias de aula a partir da carga horária, dias letivos semanais e tabela de feriados/recessos acadêmicos.
- **Painel de Ocupação em Tempo Real**: Visualização em Modo Semanal ou Diário, com Modo TV dedicado para exibição contínua em monitores das unidades escolares.

---

## 🚀 Funcionalidades Principais

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ECOSSISTEMA SGST                               │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│   PAINEL DE AGENDA   │     CALCULADORA      │       GESTÃO CORPORATIVA      │
│  Grade Semanal/Diária│  Projeção Automática │  Cursos & Segmentos           │
│  Filtros de Ambientes│  Abatimento Feriados │  Instrutores & Atribuições    │
│  Detecção de Conflito│  Distribuição Dias   │  Salas, Recursos & Capacidades│
│  Modo TV com AutoZoom│  Métricas de Carga   │  Turmas & Feriados/Recessos   │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 1. Painel Visual de Alocação
- **Navegação Temporal**: Visualização semanal ou diária com filtros por unidade (*Ceilândia*, *Recanto das Emas*), turno e tipo de sala.
- **Modo TV (Fullscreen)**: Layout otimizado para monitores e TVs de 55" a 65", proporção quadrada para cartões de turmas e relógio digital de Brasília desvinculado de renderização de página para máxima fluidez.
- **Detecção de Conflitos & Sugestões**: Indicação de disponibilidade de salas e sugestão automática de turnos alternativos caso não haja salas livres.

### 2. Calculadora Inteligente de Cronogramas
- Entrada de carga horária (ex.: 20h, 160h, 400h, 1200h), data de início e dias da semana letivos.
- Consulta integrada ao banco de **Feriados e Recessos**, pulando automaticamente feriados nacionais, distritais e recessos acadêmicos.
- Detalhamento de cada encontro letivo e data exata de conclusão do curso.

### 3. Motor de Alocação e Regras de Negócio
- Alocação assistida com seleção de curso, ambiente, turno e instrutor.
- Rejeição atômica de conflitos físicos (`HTTP 409 Conflict`) com identificação detalhada do dia e turma conflitante.
- Validação física de capacidade (`HTTP 400 Bad Request`) impedindo que uma turma com mais alunos seja alocada em sala menor.
- Geração inteligente de códigos de turma sequenciais e normalizados (ex.: `2026.09.4`).

---

## 🏗️ Arquitetura do Sistema

```mermaid
graph TD
    subgraph Client["Camada Cliente (Frontend)"]
        UI_SPA["React 18 + Vite SPA<br/>(Tailwind CSS, Lucide Icons, Context API)"]
        Components["PainelPage | CalculadoraPage | ManageSystemPage"]
    end

    subgraph Server["Camada de Serviços (Backend)"]
        Express["Express Server (Porta 3333)<br/>(CORS, Helmet, Morgan, JSON Parser)"]
        TurmaSvc["TurmaService<br/>(Alocação, Capacidade, Conflitos)"]
        CalcSvc["CalculadoraService<br/>(Cronogramas & Feriados)"]
        SalaSvc["SalaService & InstrutorService"]
        AuthSvc["AuthService (JWT + Bcrypt)"]
    end

    subgraph Data["Camada de Persistência"]
        PrismaClient["Prisma ORM v6 Client"]
        Postgres[(PostgreSQL 16<br/>Database: sgst_bd)]
    end

    UI_SPA -->|REST / JSON via Axios| Express
    Express --> TurmaSvc
    Express --> CalcSvc
    Express --> SalaSvc
    Express --> AuthSvc
    TurmaSvc --> CalcSvc
    TurmaSvc --> PrismaClient
    CalcSvc --> PrismaClient
    SalaSvc --> PrismaClient
    PrismaClient --> Postgres
```

---

## 🗄️ Modelo de Dados

O banco de dados relacional PostgreSQL (`sgst_bd`) possui modelagem normalizada:

```mermaid
erDiagram
    Turno ||--o{ Turma : pertence
    StatusTurma ||--o{ Turma : define_estado
    TipoSala ||--o{ Sala : classifica
    TipoSala ||--o{ Curso : define_padrao
    Sala ||--o{ Agendamento : recebe
    Curso ||--o{ Turma : origina
    Curso ||--o{ InstrutoresCurso : possui
    Instrutor ||--o{ InstrutoresCurso : leciona
    Instrutor ||--o{ Turma : ministra
    Turma ||--o{ Agendamento : compoe
    TipoFeriado ||--o{ FeriadosRecessos : categoriza

    Sala {
        int id_salas PK
        string nome_sala
        int capacidade_maxima
        int idTipo_sala FK
        string local
        text recursos_especiais
    }

    Curso {
        int id_cursos PK
        string nome_curso
        string segmento
        string modalidade
        int carga_horaria
        decimal valor
        boolean bolsa_compativel
        int idTipo_sala FK
    }

    Turma {
        int id_turmas PK
        string codigo_turma UK
        int id_cursos FK
        int id_instrutores FK
        int fk_id_turno FK
        int fk_id_status FK
        date data_inicio
        date data_termino
        int total_alunos
        string dias_semana
    }

    Agendamento {
        int id_agendamento PK
        int id_turmas FK
        int id_salas FK
        date data_aula
    }

    FeriadosRecessos {
        int id_feriado PK
        date data_feriado UK
        string descricao
        int fk_id_tipo_feriado FK
    }
```

---

## 💻 Stack Tecnológica

| Componente | Tecnologia | Versão | Função |
| :--- | :--- | :--- | :--- |
| **Runtime Backend** | Node.js | v20 LTS | Execução do servidor |
| **Linguagem Backend** | TypeScript | 5.6+ | Tipagem estrita ponta a ponta |
| **Framework Web** | Express.js | 4.19+ | API RESTful |
| **ORM** | Prisma ORM | 6.x | Mapeamento relacional e migrações |
| **Banco de Dados** | PostgreSQL | 16-alpine | Banco relacional |
| **Frontend SPA** | React | 18.3+ | Interface reativa componentizada |
| **Build Tool** | Vite | 5.4+ | Empacotamento ultrarrápido |
| **Estilização** | Tailwind CSS | 4.x | Design system responsivo e temas claro/escuro |
| **Testes Unitários** | Vitest | 5.x | Testes automatizados de regras de negócio |
| **Containerização** | Docker | Docker Compose | PostgreSQL, API e frontend Nginx |

---

## ⚙️ Instalação e execução

Pré-requisito: Docker Engine com Compose no WSL. Não é necessário instalar Node.js ou Prisma no Windows para usar a pilha completa.

Na raiz do clone, execute no WSL:

```bash
docker compose up --build -d
```

Neste computador, a partir do PowerShell:

```powershell
wsl -u root -- bash -lc "cd /mnt/c/AllProjects/mapa-sala && docker compose up --build -d"
```

Abra **http://localhost/** (ou http://localhost:5173/). O painel abre sem login. O backend aplica as migrations e cadastra turnos, status, feriados, salas, instrutores e cursos de referência ao iniciar. A API responde em http://localhost:3333/health. As portas são publicadas apenas em `127.0.0.1`; configure `BIND_HOST` somente se precisar acesso pela rede e houver proteção externa.

Para carregar turmas fictícias no banco **descartável**, rode depois que o backend estiver healthy:

```bash
docker compose run --rm -e ALLOW_DESTRUCTIVE_SEED=true backend npm run db:seed:demo
```

Esse comando substitui turmas e agendamentos existentes. Ele não cria turmas incompatíveis com sala, capacidade, instrutor ou código único; as pendências ficam em `relatorios/turmas_pendentes.csv`. Revise o CSV e use **Gerenciamento → Cursos → Importar planilha** para simular e confirmar correções. O seed de referência é idempotente e automático; não exige `ALLOW_DESTRUCTIVE_SEED`.

Para parar sem apagar os dados: `docker compose down`. Para **apagar também o banco local**, somente após backup e confirmação de que está no projeto correto: `docker compose down -v`.

## 🧪 Testes e qualidade

```bash
npm ci --prefix backend
npm ci --prefix frontend
npm run lint --prefix backend
npm run build --prefix backend
npm test --prefix backend
npm run typecheck --prefix frontend
VITE_API_URL=/api npm run build --prefix frontend
npm test --prefix frontend
```

A CI executa essas validações para backend e frontend. O build do backend gera o Prisma Client; não requer banco para compilar.

---

## 📡 Referência da API

### Cursos & Salas
- `GET /cursos` — Lista todos os cursos com carga horária e modalidades.
- `POST /cursos` — Criação ou atualização de cursos pedagógicos.
- `GET /salas` — Relação completa de salas com tipos, capacidade e status.
- `POST /salas` — Cadastro e edição de ambientes pedagógicos.

### Turmas & Alocação
- `GET /turmas` — Retorna turmas ativas, instrutores vinculados e agendamentos.
- `POST /turmas/alocar` — Realiza a alocação de uma turma em um ambiente:
  ```json
  {
    "id_cursos": 1,
    "id_salas": 5,
    "data_inicio": "2026-03-02",
    "fk_id_turno": 1,
    "total_alunos": 25,
    "dias_semana": ["1", "3", "5"],
    "codigo_turma": "2026.09.100"
  }
  ```
- `PUT /turmas/:id/reallocar` — Realoca turma existente para novo ambiente/período.
- `DELETE /turmas/:id` — Desfaz alocação e libera o ambiente na agenda.

### Importação Inteligente de Planilhas (CSV / XLSX)
- `POST /importacao-planilha/analisar` — Analisa o arquivo enviado (`application/octet-stream`), seleciona a aba de maior pontuação, detecta a linha de cabeçalho (ou opera sem cabeçalho pelo conteúdo) e sugere o mapeamento de colunas com grau de confiança.
- `POST /importacao-planilha/simular` — Simula a importação (sem escrita no banco) aceitando opcionalmente `aba`, `linha_cabecalho` e `mapeamento` via query string. Suporta a coluna opcional `dias_semana` (padrão segunda a sexta, aceitando formatos como `"2,4,6"`, `"Ter, Qui, Sáb"` ou `"seg a sex"`) tanto para turmas novas quanto para recomposição das aulas restantes (operação 3), além de `local_sala` opcional quando o nome da sala é único no sistema e inferência de `turno` a partir de horário (ex.: `"14:00 às 18:00"`).
- `POST /importacao-planilha/confirmar` — Aplica transacionalmente a planilha validada preservando aulas anteriores à data de corte.

### Cronograma & Feriados
- `POST /calcular_cronograma` — Projeta término e dias de aula a partir de carga horária e dias letivos:
  ```json
  {
    "cargaHoraria": 160,
    "dataInicio": "2026-03-02",
    "diasSemana": ["1", "2", "3", "4", "5"],
    "horasPorDia": 4
  }
  ```
- `GET /feriados` — Lista feriados e recessos cadastrados no sistema acadêmico.

### Integridade
- `GET /health` — Verificação de saúde da API e status da conexão com o banco (`{ "status": "healthy", "database": "connected" }`).

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**.

---

## 👥 Créditos

Desenvolvido para o **SENAC Distrito Federal** como parte das iniciativas de modernização tecnológica e excelência operacional na gestão de recursos educacionais.
