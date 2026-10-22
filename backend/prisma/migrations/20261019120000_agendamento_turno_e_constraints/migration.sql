-- DropIndex
DROP INDEX IF EXISTS "Turma_codigo_turma_idx";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Turma_codigo_turma_key" ON "Turma"("codigo_turma");

-- CreateIndex (suporte para foreign key composta de integridade de turno)
CREATE UNIQUE INDEX IF NOT EXISTS "Turma_id_turmas_fk_id_turno_key" ON "Turma"("id_turmas", "fk_id_turno");

-- AlterTable Agendamento: adiciona coluna fk_id_turno
ALTER TABLE "Agendamento" ADD COLUMN IF NOT EXISTS "fk_id_turno" INTEGER;

-- Popula fk_id_turno a partir de Turma caso existam agendamentos anteriores
UPDATE "Agendamento" a
SET "fk_id_turno" = t."fk_id_turno"
FROM "Turma" t
WHERE a."id_turmas" = t."id_turmas" AND a."fk_id_turno" IS NULL;

-- Garante NOT NULL em fk_id_turno
ALTER TABLE "Agendamento" ALTER COLUMN "fk_id_turno" SET NOT NULL;

-- Altera tipo de data_aula para DATE
ALTER TABLE "Agendamento" ALTER COLUMN "data_aula" TYPE DATE;

-- DropForeignKey antiga
ALTER TABLE "Agendamento" DROP CONSTRAINT IF EXISTS "Agendamento_id_turmas_fkey";

-- AddForeignKey composta Turma (garante coerência estrita de turno entre Turma e Agendamento)
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_id_turmas_fk_id_turno_fkey" FOREIGN KEY ("id_turmas", "fk_id_turno") REFERENCES "Turma"("id_turmas", "fk_id_turno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Turno
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_fk_id_turno_fkey" FOREIGN KEY ("fk_id_turno") REFERENCES "Turno"("id_turno") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex Unique para evitar sobreposição: UMA sala tem no máximo UMA turma por dia e turno
CREATE UNIQUE INDEX IF NOT EXISTS "Agendamento_id_salas_data_aula_fk_id_turno_key" ON "Agendamento"("id_salas", "data_aula", "fk_id_turno");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Agendamento_fk_id_turno_idx" ON "Agendamento"("fk_id_turno");
