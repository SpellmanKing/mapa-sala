export const DATA_CORTE_IMPORTACAO = process.env.DATA_CORTE_IMPORTACAO ?? '2026-10-15';

export const COLUNAS_IMPORTACAO = {
  id_turma: ['id_turma', 'id turma', 'id da turma'],
  codigo_turma: ['codigo_turma', 'código da turma', 'codigo turma'],
  curso: ['curso', 'nome do curso'],
  carga_horaria: ['carga_horaria', 'carga horária'],
  instrutor: ['instrutor', 'nome do instrutor'],
  sala: ['sala', 'nome da sala'],
  local_sala: ['local_sala', 'local da sala', 'unidade da sala', 'unidade'],
  turno: ['turno'],
  data_inicio: ['data_inicio', 'data de início', 'inicio'],
  alunos: ['alunos', 'número de alunos', 'numero de alunos']
} as const;

export const COLUNAS_OBRIGATORIAS = ['codigo_turma', 'curso', 'sala', 'local_sala', 'turno', 'data_inicio'] as const;
