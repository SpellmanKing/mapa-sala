import { z } from 'zod';
import { dateInputSchema } from './dateSchema.js';

const diasSemanaSchema = z.array(
  z.string().regex(/^[0-6]$/, 'Dia da semana deve estar entre 0 e 6')
).min(1, 'Informe pelo menos um dia da semana')
  .refine(dias => new Set(dias).size === dias.length, 'Dias da semana duplicados');

export const alocarTurmaSchema = z.object({
  id_cursos: z.coerce.number().int().positive('ID do curso é obrigatório'),
  id_salas: z.coerce.number().int().positive('ID da sala é obrigatório'),
  data_inicio: dateInputSchema,
  fk_id_turno: z.coerce.number().int().positive('Turno inválido'),
  total_alunos: z.coerce.number().int().positive('Total de alunos deve ser positivo'),
  codigo_turma: z.string().trim().optional(),
  dias_semana: diasSemanaSchema.default(['1', '2', '3', '4', '5']),
  id_instrutores: z.coerce.number().int().positive().optional().nullable(),
}).strict();

export const reallocarTurmaSchema = z.object({
  id_salas: z.coerce.number().int().positive('Sala inválida'),
  data_inicio: dateInputSchema,
  fk_id_turno: z.coerce.number().int().positive('Turno inválido'),
  dias_semana: diasSemanaSchema,
  id_instrutores: z.coerce.number().int().positive().optional().nullable(),
}).strict();

export const disponibilidadeTurmaSchema = z.object({
  id_cursos: z.coerce.number().int().positive('ID do curso é obrigatório'),
  data_inicio: dateInputSchema,
  fk_id_turno: z.coerce.number().int().positive('Turno inválido'),
  total_alunos: z.coerce.number().int().positive('Total de alunos deve ser positivo'),
  dias_semana: diasSemanaSchema,
  id_instrutores: z.coerce.number().int().positive().optional().nullable(),
  ignore_turma_id: z.coerce.number().int().positive().optional(),
}).strict();
