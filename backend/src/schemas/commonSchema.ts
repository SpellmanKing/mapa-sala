import { z } from 'zod';

export const idParamSchema = z.coerce.number()
  .int('ID deve ser um número inteiro')
  .positive('ID deve ser um número inteiro positivo');

export const nonEmptyUpdate = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.partial().refine(data => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização'
  });
