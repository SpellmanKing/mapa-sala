-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StatusTurma` (
    `id_status` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_status` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `StatusTurma_nome_status_key`(`nome_status`),
    PRIMARY KEY (`id_status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Turno` (
    `id_turno` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_turno` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Turno_nome_turno_key`(`nome_turno`),
    PRIMARY KEY (`id_turno`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoFeriado` (
    `id_tipo_feriado` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_tipo` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TipoFeriado_nome_tipo_key`(`nome_tipo`),
    PRIMARY KEY (`id_tipo_feriado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoSala` (
    `idTipo_sala` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_tipo` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TipoSala_nome_tipo_key`(`nome_tipo`),
    PRIMARY KEY (`idTipo_sala`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sala` (
    `id_salas` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_sala` VARCHAR(191) NOT NULL,
    `capacidade_maxima` INTEGER NOT NULL,
    `idTipo_sala` INTEGER NULL,
    `local` VARCHAR(191) NULL,
    `recursos_especiais` VARCHAR(191) NULL,

    PRIMARY KEY (`id_salas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Curso` (
    `id_cursos` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_curso` VARCHAR(191) NOT NULL,
    `segmento` VARCHAR(191) NOT NULL,
    `modalidade` VARCHAR(191) NOT NULL,
    `carga_horaria` INTEGER NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `curso_tem` BOOLEAN NOT NULL DEFAULT false,
    `bolsa_compativel` BOOLEAN NOT NULL DEFAULT true,
    `idTipo_sala` INTEGER NULL,

    UNIQUE INDEX `Curso_nome_curso_key`(`nome_curso`),
    PRIMARY KEY (`id_cursos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Instrutor` (
    `id_instrutores` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_instrutor` VARCHAR(191) NOT NULL,
    `segmento_principal` VARCHAR(191) NULL,
    `habilidades_extras` VARCHAR(191) NULL,

    UNIQUE INDEX `Instrutor_nome_instrutor_key`(`nome_instrutor`),
    PRIMARY KEY (`id_instrutores`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstrutoresCurso` (
    `id_instrutores_cursos` INTEGER NOT NULL AUTO_INCREMENT,
    `id_instrutores` INTEGER NOT NULL,
    `id_cursos` INTEGER NOT NULL,

    UNIQUE INDEX `InstrutoresCurso_id_instrutores_id_cursos_key`(`id_instrutores`, `id_cursos`),
    PRIMARY KEY (`id_instrutores_cursos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Turma` (
    `id_turmas` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cursos` INTEGER NOT NULL,
    `id_instrutores` INTEGER NULL,
    `codigo_turma` VARCHAR(191) NOT NULL,
    `fk_id_status` INTEGER NOT NULL DEFAULT 1,
    `fk_id_turno` INTEGER NOT NULL,
    `data_inicio` DATETIME(3) NOT NULL,
    `data_termino` DATETIME(3) NULL,
    `total_alunos` INTEGER NOT NULL,
    `alunos_pagantes` INTEGER NOT NULL DEFAULT 0,
    `alunos_bolsistas` INTEGER NOT NULL DEFAULT 0,
    `observacoes` VARCHAR(191) NULL,
    `eh_hibrida` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Turma_codigo_turma_key`(`codigo_turma`),
    PRIMARY KEY (`id_turmas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agendamento` (
    `id_agendamento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_turmas` INTEGER NOT NULL,
    `id_salas` INTEGER NOT NULL,
    `data_aula` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Agendamento_id_salas_data_aula_key`(`id_salas`, `data_aula`),
    UNIQUE INDEX `Agendamento_id_turmas_data_aula_key`(`id_turmas`, `data_aula`),
    PRIMARY KEY (`id_agendamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeriadosRecessos` (
    `id_feriado` INTEGER NOT NULL AUTO_INCREMENT,
    `data_feriado` DATETIME(3) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `fk_id_tipo_feriado` INTEGER NOT NULL,

    UNIQUE INDEX `FeriadosRecessos_data_feriado_key`(`data_feriado`),
    PRIMARY KEY (`id_feriado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Sala` ADD CONSTRAINT `Sala_idTipo_sala_fkey` FOREIGN KEY (`idTipo_sala`) REFERENCES `TipoSala`(`idTipo_sala`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Curso` ADD CONSTRAINT `Curso_idTipo_sala_fkey` FOREIGN KEY (`idTipo_sala`) REFERENCES `TipoSala`(`idTipo_sala`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstrutoresCurso` ADD CONSTRAINT `InstrutoresCurso_id_instrutores_fkey` FOREIGN KEY (`id_instrutores`) REFERENCES `Instrutor`(`id_instrutores`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstrutoresCurso` ADD CONSTRAINT `InstrutoresCurso_id_cursos_fkey` FOREIGN KEY (`id_cursos`) REFERENCES `Curso`(`id_cursos`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Turma` ADD CONSTRAINT `Turma_id_cursos_fkey` FOREIGN KEY (`id_cursos`) REFERENCES `Curso`(`id_cursos`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Turma` ADD CONSTRAINT `Turma_id_instrutores_fkey` FOREIGN KEY (`id_instrutores`) REFERENCES `Instrutor`(`id_instrutores`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Turma` ADD CONSTRAINT `Turma_fk_id_status_fkey` FOREIGN KEY (`fk_id_status`) REFERENCES `StatusTurma`(`id_status`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Turma` ADD CONSTRAINT `Turma_fk_id_turno_fkey` FOREIGN KEY (`fk_id_turno`) REFERENCES `Turno`(`id_turno`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_id_turmas_fkey` FOREIGN KEY (`id_turmas`) REFERENCES `Turma`(`id_turmas`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_id_salas_fkey` FOREIGN KEY (`id_salas`) REFERENCES `Sala`(`id_salas`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeriadosRecessos` ADD CONSTRAINT `FeriadosRecessos_fk_id_tipo_feriado_fkey` FOREIGN KEY (`fk_id_tipo_feriado`) REFERENCES `TipoFeriado`(`id_tipo_feriado`) ON DELETE RESTRICT ON UPDATE CASCADE;
