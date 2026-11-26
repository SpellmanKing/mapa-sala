BEGIN;

ALTER TABLE "Agendamento" ALTER COLUMN "id_salas" DROP NOT NULL;

UPDATE "Agendamento" a
SET "id_salas" = NULL
FROM "Turma" t
JOIN "Curso" c ON c."id_cursos" = t."id_cursos"
WHERE t."id_turmas" = a."id_turmas"
  AND (
    c."modalidade" = 'Remoto'
    OR EXTRACT(DOW FROM a."data_aula")::integer::text =
       ANY(regexp_split_to_array(trim(coalesce(c."dias_remotos_padrao", '')), '\s*,\s*'))
  );

COMMIT;
