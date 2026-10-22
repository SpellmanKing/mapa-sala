export const DATA_CORTE_IMPORTACAO = process.env.DATA_CORTE_IMPORTACAO ?? '2026-10-15';

export const COLUNAS_IMPORTACAO = {
  id_turma: ['id_turma', 'id turma', 'id da turma', 'id_turmas', 'identificador da turma', 'identificador'],
  codigo_turma: [
    'codigo_turma',
    'código da turma',
    'codigo turma',
    'turma',
    'cod',
    'cód',
    'cód.',
    'cod.',
    'código',
    'codigo',
    'cod turma',
    'cód. turma',
    'cod. turma',
    'código turma',
    'numero da turma',
    'número da turma',
    'nº turma',
    'nº da turma'
  ],
  curso: [
    'curso',
    'nome do curso',
    'nome_curso',
    'formação',
    'formacao',
    'qualificação',
    'qualificacao',
    'capacitação',
    'capacitacao',
    'programa',
    'curso / formação'
  ],
  carga_horaria: [
    'carga_horaria',
    'carga horária',
    'carga horaria',
    'ch',
    'c.h.',
    'c.h',
    'horas',
    'total de horas',
    'duração',
    'duracao',
    'carga'
  ],
  instrutor: [
    'instrutor',
    'nome do instrutor',
    'nome_instrutor',
    'professor',
    'professora',
    'docente',
    'facilitador',
    'orientador',
    'educador',
    'prof',
    'prof.'
  ],
  sala: [
    'sala',
    'nome da sala',
    'nome_sala',
    'ambiente',
    'ambiente pedagógico',
    'ambiente pedagogico',
    'laboratório',
    'laboratorio',
    'espaço',
    'espaco',
    'sala de aula',
    'lab'
  ],
  local_sala: [
    'local_sala',
    'local da sala',
    'unidade da sala',
    'unidade',
    'polo',
    'local',
    'campus',
    'centro',
    'cep',
    'localidade',
    'sede',
    'filial'
  ],
  turno: ['turno', 'período', 'periodo', 'turno de aula'],
  data_inicio: [
    'data_inicio',
    'data de início',
    'data de inicio',
    'data inicio',
    'data início',
    'inicio',
    'início',
    'dt inicio',
    'dt. início',
    'dt_inicio',
    'data inicial',
    'início das aulas',
    'inicio das aulas'
  ],
  alunos: [
    'alunos',
    'número de alunos',
    'numero de alunos',
    'total_alunos',
    'total de alunos',
    'qtd alunos',
    'qtd. alunos',
    'qtd de alunos',
    'quantidade de alunos',
    'matriculados',
    'alunos matriculados',
    'vagas',
    'inscritos'
  ],
  dias_semana: [
    'dias_semana',
    'dias da semana',
    'dias letivos',
    'dias_letivos',
    'dias',
    'dias de aula',
    'frequência',
    'frequencia'
  ]
} as const;

export type CampoImportacao = keyof typeof COLUNAS_IMPORTACAO;

export const APELIDOS_HORARIO_TURNO = [
  'horario',
  'horário',
  'hora',
  'horário de aula',
  'horario de aula',
  'horários',
  'horarios',
  'faixa horária',
  'faixa horaria'
] as const;

export const COLUNAS_OBRIGATORIAS = ['codigo_turma', 'curso', 'sala', 'turno', 'data_inicio'] as const;

export const LIMIAR_MINIMO_DETECCAO = 0.45;
export const LIMIAR_ALTA_CONFIANCA = 0.7;
export const MARGEM_AMBIGUIDADE = 0.1;
