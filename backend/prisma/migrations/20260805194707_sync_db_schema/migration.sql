-- DropForeignKey
ALTER TABLE `Agendamento` DROP FOREIGN KEY `Agendamento_id_salas_fkey`;

-- DropIndex
DROP INDEX `Agendamento_id_salas_data_aula_key` ON `Agendamento`;

-- DropIndex
DROP INDEX `Turma_codigo_turma_key` ON `Turma`;

-- AlterTable
ALTER TABLE `Curso` ADD COLUMN `codigo_turma_padrao` VARCHAR(191) NULL,
    ADD COLUMN `dias_letivos_padrao` VARCHAR(191) NULL,
    ADD COLUMN `dias_remotos_padrao` VARCHAR(191) NULL,
    ADD COLUMN `id_instrutor_padrao` INTEGER NULL,
    ADD COLUMN `turno_padrao` VARCHAR(191) NULL,
    ADD COLUMN `unidade` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Sala` MODIFY `recursos_especiais` TEXT NULL;

-- AlterTable
ALTER TABLE `Turma` ADD COLUMN `dias_semana` VARCHAR(191) NOT NULL DEFAULT '1,2,3,4,5';



-- AddForeignKey
ALTER TABLE `Curso` ADD CONSTRAINT `Curso_id_instrutor_padrao_fkey` FOREIGN KEY (`id_instrutor_padrao`) REFERENCES `Instrutor`(`id_instrutores`) ON DELETE SET NULL ON UPDATE CASCADE;
