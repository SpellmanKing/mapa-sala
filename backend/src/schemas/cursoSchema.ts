import { z } from 'zod';
import { nonEmptyUpdate } from './commonSchema.js';

const diasCsvSchema = z.string().trim()
  .regex(/^[0-6](,[0-6])*$/, 'Dias da semana inválidos')
  .refine(value => new Set(value.split(',')).size === value.split(',').length, 'Dias da semana duplicados');

const cursoSchema = z.object({
  nome_curso: z.string().trim().min(1, 'Nome do curso é obrigatório'),
  segmento: z.string().trim().min(1, 'Segmento é obrigatório'),
  modalidade: z.enum(['Presencial', 'Semi-Presencial', 'Remoto']),
  carga_horaria: z.coerce.number().int().positive('Carga horária deve ser positiva'),
  valor: z.coerce.number().finite().min(0, 'Valor não pode ser negativo'),
  curso_tem: z.boolean(),
  bolsa_compativel: z.boolean(),
  idTipo_sala: z.coerce.number().int().positive().optional().nullable(),
  unidade: z.string().trim().min(1).max(150).optional().nullable(),
  codigo_turma_padrao: z.string().trim().min(1).max(100).optional().nullable(),
  turno_padrao: z.enum(['Manhã', 'Tarde', 'Noite']).optional().nullable(),
  dias_letivos_padrao: diasCsvSchema.optional().nullable(),
  dias_remotos_padrao: diasCsvSchema.optional().nullable(),
  id_instrutor_padrao: z.coerce.number().int().positive().optional().nullable(),
}).strict();

const diasDoCursoSchema = cursoSchema.pick({
  modalidade: true,
  dias_letivos_padrao: true,
  dias_remotos_padrao: true
}).partial();

type DiasDoCurso = z.infer<typeof diasDoCursoSchema>;

function modalidadeDosDias(dados: DiasDoCurso) {
  if (dados.dias_remotos_padrao) return dados.dias_letivos_padrao ? 'Semi-Presencial' : 'Remoto';
  if (dados.dias_letivos_padrao) return 'Presencial';
}

function validarDias(dados: DiasDoCurso, ctx: z.RefinementCtx) {
  const presenciais = dados.dias_letivos_padrao?.split(',') ?? [];
  const remotos = dados.dias_remotos_padrao?.split(',') ?? [];
  if (remotos.some(dia => presenciais.includes(dia))) {
    ctx.addIssue({
      code: 'custom', path: ['dias_remotos_padrao'],
      message: 'Um mesmo dia não pode ser presencial e remoto.'
    });
  }
  const modalidade = modalidadeDosDias(dados);
  if (modalidade && dados.modalidade && dados.modalidade !== modalidade) {
    ctx.addIssue({
      code: 'custom', path: ['modalidade'],
      message: 'A modalidade deve corresponder aos dias presenciais e remotos.'
    });
  }
}

export const configuracaoCursoSchema = diasDoCursoSchema.superRefine(validarDias).transform(dados => ({
  ...dados, modalidade: dados.modalidade ?? modalidadeDosDias(dados)
}));

export const createCursoSchema = cursoSchema.extend({
  modalidade: cursoSchema.shape.modalidade.optional(),
  valor: cursoSchema.shape.valor.default(0),
  curso_tem: cursoSchema.shape.curso_tem.default(false),
  bolsa_compativel: cursoSchema.shape.bolsa_compativel.default(true)
}).superRefine(validarDias).transform(dados => ({
  ...dados, modalidade: dados.modalidade ?? modalidadeDosDias(dados) ?? 'Presencial'
}));
export const updateCursoSchema = nonEmptyUpdate(cursoSchema);
export type AtualizacaoCurso = z.infer<typeof updateCursoSchema>;
