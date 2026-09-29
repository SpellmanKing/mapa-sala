import { describe, expect, it } from 'vitest';
import { calculadoraSchema } from './calculadoraSchema.js';
import { idParamSchema } from './commonSchema.js';
import { createCursoSchema } from './cursoSchema.js';
import { createFeriadoSchema, updateFeriadoSchema } from './feriadoSchema.js';
import { createInstrutorSchema, updateInstrutorSchema } from './instrutorSchema.js';
import { createSalaSchema } from './salaSchema.js';
import { alocarTurmaSchema } from './turmaSchema.js';

describe('schemas de entrada', () => {
  it('aceita um feriado válido', () => {
    const result = createFeriadoSchema.parse({
      data_feriado: '2026-09-07',
      descricao: ' Independência do Brasil ',
      fk_id_tipo_feriado: '1'
    });
    expect(result).toMatchObject({
      descricao: 'Independência do Brasil',
      fk_id_tipo_feriado: 1
    });
    expect(result.data_feriado).toEqual(new Date('2026-09-07T00:00:00.000Z'));
  });

  it.each([
    [{ descricao: 'Sem data', fk_id_tipo_feriado: 1 }, 'payload incompleto'],
    [{ data_feriado: '2026-02-30', descricao: 'Data impossível', fk_id_tipo_feriado: 1 }, 'data inválida'],
    [{ data_feriado: '2026-09-07', descricao: '   ', fk_id_tipo_feriado: 1 }, 'descrição vazia'],
    [{ data_feriado: '2026-09-07', descricao: 'Teste', fk_id_tipo_feriado: 'NaN' }, 'tipo inválido']
  ])('rejeita feriado com %s (%s)', (payload) => {
    expect(createFeriadoSchema.safeParse(payload).success).toBe(false);
  });

  it('rejeita atualização vazia e ID de rota inválido', () => {
    expect(updateFeriadoSchema.safeParse({}).success).toBe(false);
    expect(idParamSchema.safeParse('abc').success).toBe(false);
    expect(idParamSchema.safeParse('-1').success).toBe(false);
  });

  it('valida instrutor e não aceita nome vazio', () => {
    expect(createInstrutorSchema.safeParse({ nome_instrutor: ' Ana ' }).success).toBe(true);
    expect(createInstrutorSchema.safeParse({ nome_instrutor: '  ' }).success).toBe(false);
    expect(updateInstrutorSchema.safeParse({}).success).toBe(false);
  });

  it.each([
    { cargaHoraria: -1, dataInicio: '2026-09-01', diasSemana: ['1'], horasPorDia: 4 },
    { cargaHoraria: 'NaN', dataInicio: '2026-09-01', diasSemana: ['1'], horasPorDia: 4 },
    { cargaHoraria: 40, dataInicio: '2026-02-30', diasSemana: ['1'], horasPorDia: 4 },
    { cargaHoraria: 40, dataInicio: '2026-09-01', diasSemana: [], horasPorDia: 4 },
    { cargaHoraria: 40, dataInicio: '2026-09-01', diasSemana: ['1', '1'], horasPorDia: 4 },
    { cargaHoraria: 40, dataInicio: '2026-09-01', diasSemana: ['1'], horasPorDia: 25 }
  ])('rejeita entrada inválida da calculadora', payload => {
    expect(calculadoraSchema.safeParse(payload).success).toBe(false);
  });

  it('rejeita números negativos e payloads incompletos nos cadastros operacionais', () => {
    expect(createSalaSchema.safeParse({ nome_sala: 'Sala A', capacidade_maxima: -1 }).success).toBe(false);
    expect(createCursoSchema.safeParse({
      nome_curso: 'Curso',
      segmento: 'TI',
      carga_horaria: -20
    }).success).toBe(false);
    expect(alocarTurmaSchema.safeParse({
      id_cursos: 1,
      id_salas: 1,
      data_inicio: '2026-09-01',
      fk_id_turno: 1,
      total_alunos: -2,
      dias_semana: ['1']
    }).success).toBe(false);
  });
});
