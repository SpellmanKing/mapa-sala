import { z } from 'zod';
import { dateInputSchema } from './dateSchema.js';

export const calculadoraSchema = z.object({
  cargaHoraria: z.coerce.number().finite().positive('Carga horária deve ser positiva'),
  dataInicio: dateInputSchema,
  diasSemana: z.array(
    z.string().regex(/^[0-6]$/, 'Dia da semana deve estar entre 0 e 6')
  ).min(1, 'Informe pelo menos um dia da semana')
    .refine(dias => new Set(dias).size === dias.length, 'Dias da semana duplicados'),
  horasPorDia: z.coerce.number().finite().positive().max(24).default(4)
}).strict();
