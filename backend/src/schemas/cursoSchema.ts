import { z } from 'zod';

export const createCursoSchema = z.object({
  nome_curso: z.string().trim().min(1, 'Nome do curso é obrigatório'),
  segmento: z.string().trim().min(1, 'Segmento é obrigatório'),
  modalidade: z.string().trim().default('Presencial'),
  carga_horaria: z.coerce.number().int().positive('Carga horária deve ser positiva'),
  valor: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  curso_tem: z.boolean().optional().default(false),
  bolsa_compativel: z.boolean().optional().default(true),
  idTipo_sala: z.coerce.number().int().positive().optional().nullable(),
  unidade: z.string().trim().optional().nullable(),
  codigo_turma_padrao: z.string().trim().optional().nullable(),
  turno_padrao: z.string().trim().optional().nullable(),
  dias_letivos_padrao: z.string().trim().optional().nullable(),
  dias_remotos_padrao: z.string().trim().optional().nullable(),
  id_instrutor_padrao: z.coerce.number().int().positive().optional().nullable(),
});

export const updateCursoSchema = createCursoSchema.partial();
