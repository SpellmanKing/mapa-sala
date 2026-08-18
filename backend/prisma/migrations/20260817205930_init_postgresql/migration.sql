-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusTurma" (
    "id_status" SERIAL NOT NULL,
    "nome_status" TEXT NOT NULL,

    CONSTRAINT "StatusTurma_pkey" PRIMARY KEY ("id_status")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id_turno" SERIAL NOT NULL,
    "nome_turno" TEXT NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id_turno")
);

-- CreateTable
CREATE TABLE "TipoFeriado" (
    "id_tipo_feriado" SERIAL NOT NULL,
    "nome_tipo" TEXT NOT NULL,

    CONSTRAINT "TipoFeriado_pkey" PRIMARY KEY ("id_tipo_feriado")
);

-- CreateTable
CREATE TABLE "TipoSala" (
    "idTipo_sala" SERIAL NOT NULL,
    "nome_tipo" TEXT NOT NULL,

    CONSTRAINT "TipoSala_pkey" PRIMARY KEY ("idTipo_sala")
);

-- CreateTable
CREATE TABLE "Sala" (
    "id_salas" SERIAL NOT NULL,
    "nome_sala" TEXT NOT NULL,
    "capacidade_maxima" INTEGER NOT NULL,
    "idTipo_sala" INTEGER,
    "local" TEXT,
    "recursos_especiais" TEXT,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id_salas")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id_cursos" SERIAL NOT NULL,
    "nome_curso" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "carga_horaria" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "curso_tem" BOOLEAN NOT NULL DEFAULT false,
    "bolsa_compativel" BOOLEAN NOT NULL DEFAULT true,
    "idTipo_sala" INTEGER,
    "unidade" TEXT,
    "codigo_turma_padrao" TEXT,
    "turno_padrao" TEXT,
    "dias_letivos_padrao" TEXT,
    "dias_remotos_padrao" TEXT,
    "id_instrutor_padrao" INTEGER,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id_cursos")
);

-- CreateTable
CREATE TABLE "Instrutor" (
    "id_instrutores" SERIAL NOT NULL,
    "nome_instrutor" TEXT NOT NULL,
    "segmento_principal" TEXT,
    "habilidades_extras" TEXT,

    CONSTRAINT "Instrutor_pkey" PRIMARY KEY ("id_instrutores")
);

-- CreateTable
CREATE TABLE "InstrutoresCurso" (
    "id_instrutores_cursos" SERIAL NOT NULL,
    "id_instrutores" INTEGER NOT NULL,
    "id_cursos" INTEGER NOT NULL,

    CONSTRAINT "InstrutoresCurso_pkey" PRIMARY KEY ("id_instrutores_cursos")
);

-- CreateTable
CREATE TABLE "Turma" (
    "id_turmas" SERIAL NOT NULL,
    "id_cursos" INTEGER NOT NULL,
    "id_instrutores" INTEGER,
    "codigo_turma" TEXT NOT NULL,
    "fk_id_status" INTEGER NOT NULL DEFAULT 1,
    "fk_id_turno" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_termino" TIMESTAMP(3),
    "total_alunos" INTEGER NOT NULL,
    "alunos_pagantes" INTEGER NOT NULL DEFAULT 0,
    "alunos_bolsistas" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "eh_hibrida" BOOLEAN NOT NULL DEFAULT false,
    "dias_semana" TEXT NOT NULL DEFAULT '1,2,3,4,5',

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id_turmas")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id_agendamento" SERIAL NOT NULL,
    "id_turmas" INTEGER NOT NULL,
    "id_salas" INTEGER NOT NULL,
    "data_aula" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id_agendamento")
);

-- CreateTable
CREATE TABLE "FeriadosRecessos" (
    "id_feriado" SERIAL NOT NULL,
    "data_feriado" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "fk_id_tipo_feriado" INTEGER NOT NULL,

    CONSTRAINT "FeriadosRecessos_pkey" PRIMARY KEY ("id_feriado")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StatusTurma_nome_status_key" ON "StatusTurma"("nome_status");

-- CreateIndex
CREATE UNIQUE INDEX "Turno_nome_turno_key" ON "Turno"("nome_turno");

-- CreateIndex
CREATE UNIQUE INDEX "TipoFeriado_nome_tipo_key" ON "TipoFeriado"("nome_tipo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoSala_nome_tipo_key" ON "TipoSala"("nome_tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_nome_curso_key" ON "Curso"("nome_curso");

-- CreateIndex
CREATE UNIQUE INDEX "Instrutor_nome_instrutor_key" ON "Instrutor"("nome_instrutor");

-- CreateIndex
CREATE UNIQUE INDEX "InstrutoresCurso_id_instrutores_id_cursos_key" ON "InstrutoresCurso"("id_instrutores", "id_cursos");

-- CreateIndex
CREATE INDEX "Turma_fk_id_turno_data_inicio_idx" ON "Turma"("fk_id_turno", "data_inicio");

-- CreateIndex
CREATE INDEX "Turma_codigo_turma_idx" ON "Turma"("codigo_turma");

-- CreateIndex
CREATE INDEX "Agendamento_data_aula_id_salas_idx" ON "Agendamento"("data_aula", "id_salas");

-- CreateIndex
CREATE INDEX "Agendamento_id_salas_idx" ON "Agendamento"("id_salas");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_id_turmas_data_aula_key" ON "Agendamento"("id_turmas", "data_aula");

-- CreateIndex
CREATE UNIQUE INDEX "FeriadosRecessos_data_feriado_key" ON "FeriadosRecessos"("data_feriado");

-- AddForeignKey
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_idTipo_sala_fkey" FOREIGN KEY ("idTipo_sala") REFERENCES "TipoSala"("idTipo_sala") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_idTipo_sala_fkey" FOREIGN KEY ("idTipo_sala") REFERENCES "TipoSala"("idTipo_sala") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_id_instrutor_padrao_fkey" FOREIGN KEY ("id_instrutor_padrao") REFERENCES "Instrutor"("id_instrutores") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrutoresCurso" ADD CONSTRAINT "InstrutoresCurso_id_instrutores_fkey" FOREIGN KEY ("id_instrutores") REFERENCES "Instrutor"("id_instrutores") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrutoresCurso" ADD CONSTRAINT "InstrutoresCurso_id_cursos_fkey" FOREIGN KEY ("id_cursos") REFERENCES "Curso"("id_cursos") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_id_cursos_fkey" FOREIGN KEY ("id_cursos") REFERENCES "Curso"("id_cursos") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_id_instrutores_fkey" FOREIGN KEY ("id_instrutores") REFERENCES "Instrutor"("id_instrutores") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_fk_id_status_fkey" FOREIGN KEY ("fk_id_status") REFERENCES "StatusTurma"("id_status") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_fk_id_turno_fkey" FOREIGN KEY ("fk_id_turno") REFERENCES "Turno"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_id_turmas_fkey" FOREIGN KEY ("id_turmas") REFERENCES "Turma"("id_turmas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_id_salas_fkey" FOREIGN KEY ("id_salas") REFERENCES "Sala"("id_salas") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeriadosRecessos" ADD CONSTRAINT "FeriadosRecessos_fk_id_tipo_feriado_fkey" FOREIGN KEY ("fk_id_tipo_feriado") REFERENCES "TipoFeriado"("id_tipo_feriado") ON DELETE RESTRICT ON UPDATE CASCADE;
