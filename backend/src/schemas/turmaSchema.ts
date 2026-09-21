import { z } from 'zod';

export const alocarTurmaSchema = z.object({
  id_cursos: z.coerce.number().int().positive('ID do curso é obrigatório'),
  id_salas: z.coerce.number().int().positive('ID da sala é obrigatório'),
  data_inicio: z.string().or(z.date()).transform(val => new Date(val)),
  fk_id_turno: z.coerce.number().int().or(z.string()),
  total_alunos: z.coerce.number().int().positive('Total de alunos deve ser positivo'),
  codigo_turma: z.string().trim().optional(),
  dias_semana: z.array(z.string()).default(['1', '2', '3', '4', '5']),
  id_instrutores: z.coerce.number().int().positive().optional().nullable(),
});

export const reallocarTurmaSchema = z.object({
  id_salas: z.coerce.number().int().positive().optional(),
  data_inicio: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  fk_id_turno: z.coerce.number().int().or(z.string()).optional(),
  dias_semana: z.array(z.string()).optional(),
  id_instrutores: z.coerce.number().int().positive().optional().nullable(),
});
