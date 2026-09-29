import { z } from 'zod';
import { calendarDateSchema } from './dateSchema.js';
import { nonEmptyUpdate } from './commonSchema.js';

const feriadoSchema = z.object({
  data_feriado: calendarDateSchema,
  descricao: z.string().trim().min(1, 'Descrição é obrigatória').max(200),
  fk_id_tipo_feriado: z.coerce.number().int().positive('Tipo de feriado inválido')
}).strict();

export const createFeriadoSchema = feriadoSchema;
export const updateFeriadoSchema = nonEmptyUpdate(feriadoSchema);
