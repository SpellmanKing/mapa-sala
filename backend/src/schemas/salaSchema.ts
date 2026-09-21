import { z } from 'zod';

export const createSalaSchema = z.object({
  nome_sala: z.string().trim().min(1, 'Nome da sala é obrigatório'),
  capacidade_maxima: z.coerce.number().int().positive('Capacidade deve ser um número inteiro positivo'),
  idTipo_sala: z.coerce.number().int().positive().optional().nullable(),
  local: z.string().trim().optional().nullable(),
  recursos_especiais: z.string().trim().optional().nullable(),
});

export const updateSalaSchema = createSalaSchema.partial();
