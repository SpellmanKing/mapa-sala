# SGST — Sistema de Gestão de Salas, Turmas e Ambientes Pedagógicos

<div align="center">

![SENAC DF](https://img.shields.io/badge/SENAC-Distrito%20Federal-004a8f?style=for-the-badge&logo=institution&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38b2ac?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2d3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<p align="center">
  <strong>Plataforma corporativa para alocação inteligente de ambientes educacionais, cálculo automatizado de calendários letivos e prevenção de conflitos de ocupação em tempo real.</strong>
</p>

[Visão Geral](#-visão-geral) •
[Funcionalidades](#-funcionalidades-principais) •
[Arquitetura](#-arquitetura-do-sistema) •
[Modelo de Dados](#-modelo-de-dados) •
[Stack Tecnológica](#-stack-tecnológica) •
[Instalação e Uso](#-instalação-e-execução) •
[API Reference](#-referência-da-api) •
[CI/CD & Qualidade](#-qualidade-de-código-e-cicd)

</div>

---

## 📌 Visão Geral

O **SGST (Sistema de Gestão de Salas e Turmas)** é uma solução de engenharia de software desenvolvida para solucionar a complexidade logística e operacional de planejamento acadêmico em unidades do **SENAC Distrito Federal** (com destaque para o *CEP Talal Abu-Allan* e *Recanto das Emas*).

Historicamente baseado em scripts monolíticos em PHP com acoplamento procedimental, o projeto passou por um processo completo de **modernização arquitetural**. Hoje, o SGST opera em uma arquitetura desacoplada em **Node.js, TypeScript, Express, Prisma ORM e React**, mantendo simultaneamente uma **camada de compatibilidade de contratos (Zero Breaking Changes)** para garantir transição suave e integração contínua.

### Principais Objetivos Alcançados
- **Eliminação de Conflitos Físicos**: Validação matemática e atômica de horários, turnos e salas, impedindo sobreposição de turmas no mesmo ambiente.
- **Cálculo de Cronogramas com Inteligência de Negócio**: Algoritmo dedicado que projeta automaticamente as datas de início e término das turmas com base na carga horária, dias letivos semanais e tabela de feriados/recessos acadêmicos.
- **Visualização Operacional Intuitiva**: Painel visual em grade de calendário mensal com filtros segmentados por turno e tipologia de sala (TI, Moda, Multiuso, Auditório).
- **Flexibilidade e Gestão Ágil**: Módulos completos para cadastro de cursos, turmas, instrutores, salas e feriados, além de suporte a re-alocações dinâmicas e fallbacks estratégicos (ex: auditórios).

---

## 🚀 Funcionalidades Principais

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ECOSSISTEMA SGST                               │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│   PAINEL DE AGENDA   │     CALCULADORA      │       GESTÃO CORPORATIVA      │
│  Grade Interativa    │  Projeção Automática │  Cursos & Segmentos           │
│  Filtros de Ambientes│  Abatimento Feriados │  Instrutores & Habilidades    │
│  Detecção de Conflito│  Distribuição Dias   │  Salas, Recursos & Capacidades│
│  Toasts com Alertas  │  Métricas de Carga   │  Turmas & Feriados/Recessos   │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 1. Painel Visual de Alocação (Agenda Interativa)
- **Navegação Temporal**: Navegação fluida entre meses e anos com atualização em tempo real.
- **Filtros Especializados**:
  - *Turnos*: Manhã, Tarde, Noite e Integral.
  - *Ambientes*: Salas Convencionais, Laboratórios de Informática (Lab 1, Lab 2, Lab 3), Laboratórios de Imagem e Estética / Moda, Salas Multiuso e Auditório.
- **Feedback Visual & Conflitos**: Destaque de cards com identificação da unidade (ex.: *Talal*, *Recanto*), alertas de conflito com efeito *glow* e notificações flutuantes dinâmicas (*Toast Notifications*).

### 2. Calculadora Inteligente de Cronogramas
- Entrada de carga horária (ex.: 20h, 160h, 1020h, 1300h), data de início e seleção customizada de dias letivos (ex.: Segunda a Sexta, Terças e Quintas, Sábados).
- Consulta direta ao repositório de **Feriados e Recessos** cadastrados, ignorando automaticamente dias não úteis.
- Retorno detalhado contendo data de término projetada, quantidade de encontros e relação completa de datas letivas.

### 3. Motor de Alocação e Regras de Negócio
- Alocação assistida com busca do curso, instrutor e sala.
- Prevenção rigorosa de sobreposição: se o ambiente já estiver ocupado no turno e dia requerido, a operação é rejeitada com erro HTTP `409 Conflict` e mensagem explicativa.
- Geração inteligente de códigos de turma sequenciais e normalizados (ex.: `2026.09.4`, `TURMA-CURSO-1`).
- Suporte a re-alocação atômica e exclusão em lote de agendamentos associados.

### 4. Gestão e Cadastros Unificados
- **Cursos**: Cadastro com carga horária, valor, segmento pedagógico, modalidade, compatibilidade com bolsas (PSG) e parâmetros padrão.
- **Instrutores**: Gestão de corpo docente com atribuição de segmento principal, competências adicionais e associação múltipla de cursos.
- **Ambientes (Salas)**: Capacidade máxima, tipologia, localização e relação de recursos específicos (projetor, computadores, maquinário de moda, etc.).
- **Feriados e Recessos**: Classificação entre feriados nacionais, distritais, recessos escolares e pontos facultativos.

---

## 🏗️ Arquitetura do Sistema

O projeto é concebido em **Camadas (Layered Architecture)** com separação estrita de responsabilidades:

```mermaid
graph TD
    subgraph Frontend["Frontend Layer"]
        UI_Modern["React 18 + Vite SPA<br/>(Tailwind CSS, Lucide Icons, Router)"]
        UI_Legacy["Legacy Static Web UI<br/>(HTML5 / CSS3 / Vanilla JS)"]
    end

    subgraph Gateway["API Gateway & Routing Layer"]
        Express["Express Server<br/>(CORS, Helmet, Morgan, JSON Parser)"]
        CompatRoutes["Legacy Compatibility Routes<br/>(/controllers/*.php)"]
        ModernRoutes["RESTful Modern Routes<br/>(/cursos, /salas, /turmas, /auth)"]
    end

    subgraph Services["Business Logic & Domain Layer"]
        TurmaSvc["TurmaService<br/>(Alocação, Conflitos, Re-alocação)"]
        CalcSvc["CalculadoraService<br/>(Cronogramas & Feriados)"]
        SalaSvc["SalaService & InstrutorService"]
        AuthSvc["AuthService<br/>(JWT & Bcrypt)"]
    end

    subgraph Data["Persistence & Caching Layer"]
        Prisma["Prisma ORM Client v6"]
        MySQLDriver["mysql2 / Connection Pool"]
        RedisCache["Redis In-Memory Cache"]
    end

    subgraph Storage["Infrastructure Layer"]
        DB[(MySQL 8 Database<br/>Schema: sgst_bd)]
        RedisInstance[(Redis Engine)]
    end

    UI_Modern -->|REST / JSON| ModernRoutes
    UI_Legacy -->|Compat REST| CompatRoutes
    ModernRoutes --> Express
    CompatRoutes --> Express
    Express --> Services
    TurmaSvc --> CalcSvc
    Services --> Prisma
    Services --> RedisCache
    Prisma --> DB
    MySQLDriver --> DB
    RedisCache --> RedisInstance
```

### Fluxo de Alocação de Turmas

```mermaid
sequenceDiagram
    autonumber
    actor Operador as Coordenador Pedagógico
    participant Client as Frontend (React / SPA)
    participant API as Backend (Express / TurmaService)
    participant Calc as CalculadoraService
    participant DB as MySQL (via Prisma)

    Operador->>Client: Solicita Alocação (Curso, Sala, Turno, Início, Dias)
    Client->>API: POST /turmas/alocar (Payload)
    API->>DB: Busca detalhes do Curso & Parâmetros
    DB-->>API: Dados do Curso (Carga Horária, etc.)
    API->>Calc: calcularCronograma(Carga, DataInicio, DiasSemana)
    Calc->>DB: Consulta Feriados e Recessos vigentes
    DB-->>Calc: Lista de Feriados
    Calc-->>API: Datas de aula calculadas & Data de término
    API->>DB: Verifica conflito em Agendamentos (Sala + Datas + Turno)
    alt Ambiente Ocupado em alguma das datas
        DB-->>API: Registro conflitante encontrado
        API-->>Client: HTTP 409 Conflict (Ambiente já ocupado na data X)
        Client-->>Operador: Alerta visual de conflito + Toast de erro
    else Ambiente Disponível
        API->>DB: Inicia transação: Cria Turma + Agendamentos em lote
        DB-->>API: Registros persistidos com sucesso
        API-->>Client: HTTP 201 Created (Turma e Agendamentos)
        Client-->>Operador: Atualização da grade + Toast de sucesso
    end
```

---

## 🗄️ Modelo de Dados

O banco de dados relacional (`sgst_bd`) possui modelagem normalizada para garantir integridade referencial e velocidade de consulta:

```mermaid
erDiagram
    User ||--o{ Turma : cadastra
    TipoSala ||--o{ Sala : classifica
    TipoSala ||--o{ Curso : define_padrao
    Sala ||--o{ Agendamento : recebe
    Turno ||--o{ Turma : pertence
    StatusTurma ||--o{ Turma : define_estado
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

> [!NOTE]
> A tabela `Agendamento` possui restrição de unicidade composta sobre `(id_turmas, data_aula)` e indexação sobre `(id_salas, data_aula)` para garantir alta performance nas consultas de disponibilidade de salas.

---

## 💻 Stack Tecnológica

| Componente | Tecnologia | Detalhes / Versão |
| :--- | :--- | :--- |
| **Linguagem Principal** | TypeScript / JavaScript | TypeScript 5.x (ESM modules nativo) |
| **Runtime Backend** | Node.js | v20 LTS / v18+ |
| **Framework Backend** | Express.js | 4.19+ com middlewares customizados |
| **ORM & Database Client** | Prisma ORM | v6.0 com migrations declarativas e seeders |
| **Banco de Dados** | MySQL | 8.0 com tabelas InnoDB e charset UTF-8 |
| **Cache & Sessão** | Redis | v7.x / driver `redis` 5.x |
| **Segurança & Validação**| Zod, Helmet, BCrypt, JWT | Validação estrita de schemas e criptografia |
| **Frontend Framework** | React | 18.3+ com TypeScript e Hooks |
| **Bundler / Build Tool** | Vite | v5.x com Hot Module Replacement (HMR) |
| **Estilização** | Tailwind CSS / Vanilla CSS | Tailwind 4.x, Google Fonts (Outfit & Inter) |
| **Ícones & UI Kits** | Lucide React / FontAwesome | Ícones vetorizados de alta fidelidade |
| **Containerização** | Docker & Docker Compose | Imagens Node Alpine multi-stage |
| **Automação CI/CD** | GitHub Actions | Workflows automatizados de build, lint e testes |

---

## 📂 Estrutura do Repositório

```text
mapa-sala/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline automatizada de integração contínua (GitHub Actions)
├── backend/                       # Backend moderno em Node.js + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma          # Modelagem de dados, índices e relacionamentos
│   │   └── seed.ts                # Seeder automatizado populando 60+ turmas, cursos e salas
│   ├── src/
│   │   ├── controllers/           # Camada de controle e despacho HTTP
│   │   ├── infrastructure/        # Instâncias de clientes (PrismaClient, conexões externas)
│   │   ├── middlewares/           # Error handlers, validações e autenticação
│   │   ├── repositories/          # Abstrações de acesso a dados (quando aplicável)
│   │   ├── services/              # Regras de negócio essenciais (TurmaService, etc.)
│   │   ├── utils/                 # Formatadores, erros customizados e constantes
│   │   ├── app.ts                 # Configuração central do Express, rotas e middlewares
│   │   └── main.ts                # Ponto de entrada do servidor backend
│   ├── Dockerfile                 # Containerização do serviço backend
│   ├── package.json               # Dependências e scripts de desenvolvimento
│   └── tsconfig.json              # Configurações do compilador TypeScript
├── frontend/                      # Frontend moderno em React + TypeScript + Vite
│   ├── src/
│   │   ├── api/                   # Clientes de consumo HTTP (Axios)
│   │   ├── components/            # Componentes reutilizáveis (Layout, Modais, Toasts)
│   │   ├── context/               # Gerenciamento de estado global (AppContext)
│   │   ├── pages/                 # Páginas (PainelPage, CalculadoraPage, ManageSystemPage)
│   │   ├── styles.css             # Folha de estilos e extensões do Tailwind
│   │   ├── App.tsx                # Roteamento e árvore de componentes
│   │   └── main.tsx               # Montagem do React no DOM
│   ├── package.json               # Dependências do frontend (React, Vite, Tailwind)
│   └── vite.config.ts             # Configurações do Vite
├── src/                           # Camada de compatibilidade transitória (Node.js ESM)
│   ├── cache/                     # Integração e helpers com Redis
│   ├── db/                        # Pool de conexões legadas com mysql2
│   ├── routes/                    # Endpoints com contratos de compatibilidade (/controllers/*.php)
│   └── services/                  # Implementações de serviços para a camada legada
├── public/                        # Arquivos estáticos legados (CSS, JS, imagens)
├── docs/                          # Documentação institucional, requisitos e regras de negócio
│   ├── Documento de Requisitos de Software(SRS).pdf
│   ├── Documentação Técnica do SGST.pdf
│   ├── Regra_do_negocio.docx
│   └── portfolio.xlsx
├── docker-compose.yml             # Orquestração local de contêineres (App + MySQL)
├── Dockerfile                     # Container raiz para execução geral
├── index.html                     # Interface web estática compatível
├── package.json                   # Pacote raiz para execução unificada
├── server.js                      # Ponto de entrada da camada de compatibilidade
└── sgst_bd.sql                    # Script DDL/DML de carga inicial do banco de dados
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- **Node.js**: Versão `20.x` LTS (ou `18.x`+)
- **NPM** ou **Yarn**
- **Docker** e **Docker Compose** *(opcional, porém recomendado para execução padronizada)*
- **MySQL Server** (8.0+) caso opte por execução local sem contêineres

---

### Opção A: Execução via Docker Compose (Recomendado)

Inicie a aplicação e o banco de dados pré-configurado com um único comando:

```bash
# Na raiz do repositório
docker compose up -d --build
```

O ambiente subirá:
- **API / Aplicação**: `http://localhost:3000`
- **Banco MySQL**: porta `3306` (`root:root`, database `sgst_bd`)

---

### Opção B: Execução Manual dos Módulos

#### 1. Banco de Dados
Importe o arquivo [`sgst_bd.sql`](file:///c:/Users/calebe.carvalho/OneDrive%20-%20SERVICO%20NACIONAL%20DE%20APRENDIZAGEM%20COMERCIAL%20DN-7170257-SENAC%20-%20DF/Documentos/MapaSala/mapa-sala/sgst_bd.sql) no seu servidor MySQL local:
```bash
mysql -u root -p sgst_bd < sgst_bd.sql
```

#### 2. Backend Moderno (`backend/`)
```bash
cd backend

# Copie o arquivo de exemplo de ambiente
cp .env.example .env
```

Configure seu arquivo `.env`:
```env
PORT=3001
DATABASE_URL="mysql://root:sua_senha@localhost:3306/sgst_bd"
JWT_SECRET="seu_jwt_secret_super_seguro"
CORS_ORIGIN="*"
```

Instale as dependências, gere os clientes do Prisma e popule a base de dados:
```bash
npm install
npx prisma generate
npx prisma db seed      # Executa seed com turmas, cursos e ambientes oficiais
npm run dev             # Inicializa o servidor backend em modo watch (http://localhost:3001)
```

#### 3. Frontend Moderno (`frontend/`)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev             # Inicializa o Vite Dev Server (geralmente http://localhost:5173)
```

#### 4. Servidor de Compatibilidade Legado (Raiz)
Caso deseje rodar a suíte legada com contratos diretos para `/controllers/*.php`:
```bash
# Na raiz do projeto
npm install
npm run dev             # Roda server.js em http://localhost:3000
```

---

## 📡 Referência da API

### Endpoints do Backend Moderno (`/backend`)

#### Cursos & Salas
- `GET /cursos` — Lista todos os cursos disponíveis com carga horária e modalidades.
- `GET /salas` — Relação completa de salas com tipos, capacidade e status de ocupação.
- `POST /salas` — Cadastro de novas salas pedagógicas.

#### Turmas & Agendamento
- `GET /turmas` — Retorna turmas ativas, instrutores vinculados e agendamentos.
- `POST /turmas/alocar` — Executa alocação com cálculo de cronograma e validação de conflitos.
  ```json
  {
    "id_cursos": 12,
    "id_salas": 3,
    "data_inicio": "2026-03-02",
    "fk_id_turno": 1,
    "total_alunos": 25,
    "dias_semana": ["1", "2", "3", "4", "5"],
    "codigo_turma": "2026.09.100"
  }
  ```
- `PUT /turmas/:id/reallocar` — Realoca turma existente para novo ambiente/período.
- `DELETE /turmas/:id` — Desfaz alocação e libera o ambiente na agenda.

#### Cronograma & Feriados
- `POST /calcular_cronograma` — Projeta término e dias de aula a partir dos parâmetros informados.
- `GET /feriados` — Lista feriados e recessos cadastrados no sistema acadêmico.
- `POST /feriados` — Adiciona novo feriado ou recesso com data e classificação.

#### Autenticação & Sistema
- `POST /auth/login` — Autenticação de coordenadores e geração de token JWT.
- `GET /health` — Verificação de integridade e disponibilidade da API (`{ "ok": true }`).

---

## 🧪 Qualidade de Código e CI/CD

O repositório mantém padrões rígidos de qualidade de software:

- **Linter & Formatador**: Configuração com **ESLint** e **Prettier** para padronização de sintaxe.
- **Tipagem Estrita**: TypeScript configurado com checagem estrita para prevenção de erros em tempo de desenvolvimento.
- **Pipeline de Integração Contínua**: Configurado via [GitHub Actions](file:///c:/Users/calebe.carvalho/OneDrive%20-%20SERVICO%20NACIONAL%20DE%20APRENDIZAGEM%20COMERCIAL%20DN-7170257-SENAC%20-%20DF/Documentos/MapaSala/mapa-sala/.github/workflows/ci.yml) para validação a cada `push` ou `pull_request`:
  - Instalação limpa de dependências em ambiente Ubuntu LTS.
  - Execução de linter (`npm run lint --if-present`).
  - Execução de testes automatizados (`npm test --if-present`).

---

## 🗺️ Roadmap de Evolução

- [x] **Fase 1: Transposição PHP → Node.js**
  - Mapeamento completo dos contratos legados JSON em `/controllers/*.php`.
  - Implementação do algoritmo matemático de cronograma letivo e checagem de feriados.
- [x] **Fase 2: Arquitetura Moderna e Persistência Tipada**
  - Criação do backend em TypeScript com Express.
  - Modelagem relacional completa com Prisma ORM e seeder com dados reais do Senac.
- [x] **Fase 3: Interface SPA com React e Tailwind**
  - Implementação do Painel Visual de Agenda com navegação mensal e filtros por turno/sala.
  - Desenvolvimento da Calculadora Inteligente e Painéis Administrativos.
  - Sistema de alertas e toasts visuais para conflitos de alocação de salas.
- [ ] **Fase 4: Recursos Avançados (Próximos Passos)**
  - Módulo interativo de mapa físico (planta baixa 2D interativa em Canvas/SVG com drag & drop).
  - Notificações automáticas por e-mail/Teams para docentes quando alocados em turmas.
  - Exportação de relatórios gerenciais em PDF e Excel consolidado.

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Consulte o arquivo [`LICENSE`](file:///c:/Users/calebe.carvalho/OneDrive%20-%20SERVICO%20NACIONAL%20DE%20APRENDIZAGEM%20COMERCIAL%20DN-7170257-SENAC%20-%20DF/Documentos/MapaSala/mapa-sala/LICENSE) para obter detalhes na íntegra.

---

## 👥 Créditos e Agradecimentos

Desenvolvido para o **SENAC Distrito Federal** como parte das iniciativas de modernização tecnológica e eficiência na gestão de recursos pedagógicos.

*Gestão de Salas e Turmas — Inovação, Produtividade e Excelência Operacional.*
