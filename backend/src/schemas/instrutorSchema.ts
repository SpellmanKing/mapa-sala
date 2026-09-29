import { z } from 'zod';
import { nonEmptyUpdate } from './commonSchema.js';

const optionalText = z.string().trim().max(500).optional().nullable();

const instrutorSchema = z.object({
  nome_instrutor: z.string().trim().min(1, 'Nome do instrutor é obrigatório').max(150),
  segmento_principal: optionalText,
  habilidades_extras: optionalText
}).strict();

export const createInstrutorSchema = instrutorSchema;
export const updateInstrutorSchema = nonEmptyUpdate(instrutorSchema);
