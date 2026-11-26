import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedReferenceData } from './seedReferenceData.js';
import { calcularCronograma, normalizarChaveNome } from './seedDemo.js';

const prisma = new PrismaClient();

export interface TurmaConsolidadaItem {
  codigo_turma: string;
  unidade: string;
  nome_curso: string;
  carga_horaria: number;
  curso_tem: boolean;
  instrutor: string;
  total_alunos: number;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  dias_semana: string[];
  data_inicio: string;
  nome_sala: string;
  local_sala: string;
}

// 27 turmas oficiais consolidadas a partir de DEPARTAMENTO DE TI(TURMAS).csv:
// - Eliminadas: 2025.09.75 (concluída), 2026.09.34 e 2026.29.14 (conforme validação do usuário)
// - Atualizadas:
//   * 2026.09.59 -> Instrutor: Vitor Gonçalves | Sala: Laboratório de TI 2 (31 alunos)
//   * 2026.09.77 -> Instrutor: Dionisio Francisco Pereira (24 alunos)
export const TURMAS_DEPARTAMENTO_TI: readonly TurmaConsolidadaItem[] = [
  // === TEM Talal Abu Allan (11 turmas) ===
  {
    codigo_turma: '2025.09.119',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas (CLDF)',
    carga_horaria: 1200,
    curso_tem: true,
    instrutor: 'Wellerson Pereira do Couto',
    total_alunos: 12,
    turno: 'Tarde',
    dias_semana: ['1', '2', '3', '4'],
    data_inicio: '2025-03-10',
    nome_sala: 'Laboratório de TI 1',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.121',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Marketing (CLDF)',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Lucas Augusto Esmeraldo de Oliveira',
    total_alunos: 6,
    turno: 'Manhã',
    dias_semana: ['1', '2', '3', '4', '5'],
    data_inicio: '2025-03-10',
    nome_sala: 'Sala 2',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.56',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Marketing',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Carlos Eduardo Alves Munis',
    total_alunos: 26,
    turno: 'Manhã',
    dias_semana: ['1', '3', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'Sala 1',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.58',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    carga_horaria: 1200,
    curso_tem: true,
    instrutor: 'Ricardo De Souza Serra',
    total_alunos: 23,
    turno: 'Manhã',
    dias_semana: ['1', '2', '3', '4', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'Laboratório de TI 1',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.59',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    carga_horaria: 1200,
    curso_tem: true,
    instrutor: 'Vitor Gonçalves',
    total_alunos: 31,
    turno: 'Tarde',
    dias_semana: ['1', '2', '3', '4', '5'],
    data_inicio: '2026-03-03',
    nome_sala: 'Laboratório de TI 2',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.65',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Marketing',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Lucas Augusto Esmeraldo de Oliveira',
    total_alunos: 34,
    turno: 'Manhã',
    dias_semana: ['2', '4', '6'],
    data_inicio: '2026-02-26',
    nome_sala: 'Sala 3',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.67',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Programação de Jogos Digitais (CLDF)',
    carga_horaria: 1000,
    curso_tem: true,
    instrutor: 'Nicole Cândido de Oliveira Andrade',
    total_alunos: 22,
    turno: 'Manhã',
    dias_semana: ['1', '2', '3', '4'],
    data_inicio: '2026-02-25',
    nome_sala: 'Laboratório de TI 2',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.69',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Marileia De Jesus Amorim',
    total_alunos: 33,
    turno: 'Manhã',
    dias_semana: ['1', '3', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'Sala 4',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.77',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Dionisio Francisco Pereira',
    total_alunos: 24,
    turno: 'Manhã',
    dias_semana: ['1', '3', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'Sala 6',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.78',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Shirliany Andrade Do Nascimento',
    total_alunos: 22,
    turno: 'Tarde',
    dias_semana: ['2', '4', '6'],
    data_inicio: '2026-03-10',
    nome_sala: 'Sala 1',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.79',
    unidade: 'TEM Talal Abu Allan',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    carga_horaria: 1200,
    curso_tem: true,
    instrutor: 'Wellerson Pereira do Couto',
    total_alunos: 26,
    turno: 'Manhã',
    dias_semana: ['1', '2', '3', '4', '5'],
    data_inicio: '2026-03-09',
    nome_sala: 'Laboratório de Informática 3',
    local_sala: 'Cep Talal Abu Allan'
  },

  // === Técnico Regular Talal Abu Allan (2 turmas ativas) ===
  {
    codigo_turma: '2025.09.83',
    unidade: 'Técnico Regular Talal Abu Allan',
    nome_curso: 'Técnico em Contabilidade',
    carga_horaria: 800,
    curso_tem: false,
    instrutor: 'Jose De Assis Custodio',
    total_alunos: 11,
    turno: 'Noite',
    dias_semana: ['1', '3', '5'],
    data_inicio: '2025-07-14',
    nome_sala: 'Sala 2',
    local_sala: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.55',
    unidade: 'Técnico Regular Talal Abu Allan',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    carga_horaria: 1200,
    curso_tem: false,
    instrutor: 'Lucas Dionísio Gomes Lima',
    total_alunos: 19,
    turno: 'Noite',
    dias_semana: ['1', '2', '3', '4', '5'],
    data_inicio: '2026-03-02',
    nome_sala: 'Laboratório de TI 1',
    local_sala: 'Cep Talal Abu Allan'
  },

  // === Polo Recanto das Emas (3 turmas ativas) ===
  {
    codigo_turma: '2026.29.5',
    unidade: 'POLO RECANTO DAS EMAS',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    carga_horaria: 1200,
    curso_tem: false,
    instrutor: 'Guilherme Lima Silva',
    total_alunos: 28,
    turno: 'Manhã',
    dias_semana: ['1', '2', '3', '4', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'Laboratório 1 (Recanto)',
    local_sala: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.7',
    unidade: 'POLO RECANTO DAS EMAS',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: false,
    instrutor: 'Flavia Renata Martins',
    total_alunos: 27,
    turno: 'Manhã',
    dias_semana: ['1', '3', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'Laboratório 2 (Recanto)',
    local_sala: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.9',
    unidade: 'POLO RECANTO DAS EMAS',
    nome_curso: 'Técnico em Programação de Jogos Digitais (CLDF)',
    carga_horaria: 1000,
    curso_tem: true,
    instrutor: 'Nicole Cândido de Oliveira Andrade',
    total_alunos: 30,
    turno: 'Tarde',
    dias_semana: ['1', '2', '3', '4'],
    data_inicio: '2026-02-25',
    nome_sala: 'Laboratório 1 (Recanto)',
    local_sala: 'Polo Recanto das Emas'
  },

  // === Escolas Parceiras SEE-DF Exclusivas (11 turmas) ===
  {
    codigo_turma: '2025.09.53',
    unidade: 'SEE CEM 111 - EXCLUSIVA',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'André Luiz Soares Alonso',
    total_alunos: 19,
    turno: 'Tarde',
    dias_semana: ['2', '3', '4'],
    data_inicio: '2025-03-10',
    nome_sala: 'SEE CEM 111 - Sala 1',
    local_sala: 'SEE CEM 111 - EXCLUSIVA'
  },
  {
    codigo_turma: '2025.09.54',
    unidade: 'SEE CEM 111 - EXCLUSIVA',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Leandro das Chagas Ferreira',
    total_alunos: 22,
    turno: 'Tarde',
    dias_semana: ['2', '4', '6'],
    data_inicio: '2025-03-10',
    nome_sala: 'SEE CEM 111 - Sala 2',
    local_sala: 'SEE CEM 111 - EXCLUSIVA'
  },
  {
    codigo_turma: '2025.09.55',
    unidade: 'SEE CEM 111 - EXCLUSIVA',
    nome_curso: 'Técnico em Secretariado',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Ricardo Pereira Gomes De Araujo',
    total_alunos: 11,
    turno: 'Tarde',
    dias_semana: ['2', '4', '5'],
    data_inicio: '2025-03-10',
    nome_sala: 'SEE CEM 111 - Sala 3',
    local_sala: 'SEE CEM 111 - EXCLUSIVA'
  },
  {
    codigo_turma: '2026.29.11',
    unidade: 'SEE CEM 111 - EXCLUSIVA',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Ricardo Da Silva Pierre',
    total_alunos: 32,
    turno: 'Tarde',
    dias_semana: ['2', '3', '4'],
    data_inicio: '2026-02-25',
    nome_sala: 'SEE CEM 111 - Sala 4',
    local_sala: 'SEE CEM 111 - EXCLUSIVA'
  },
  {
    codigo_turma: '2026.29.13',
    unidade: 'SEE CEM 111 - EXCLUSIVA',
    nome_curso: 'Técnico em Marketing',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Carlos Eduardo Alves Munis',
    total_alunos: 32,
    turno: 'Tarde',
    dias_semana: ['2', '4', '6'],
    data_inicio: '2026-02-26',
    nome_sala: 'SEE CEM 111 - Sala 5',
    local_sala: 'SEE CEM 111 - EXCLUSIVA'
  },
  {
    codigo_turma: '2025.09.56',
    unidade: 'SEE CEM 12 - EXCLUSIVA',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Analice Barbosa Santos De Oliveira',
    total_alunos: 10,
    turno: 'Tarde',
    dias_semana: ['2', '4', '6'],
    data_inicio: '2025-03-11',
    nome_sala: 'SEE CEM 12 - Sala Exclusiva',
    local_sala: 'SEE CEM 12 - EXCLUSIVA'
  },
  {
    codigo_turma: '2026.09.71',
    unidade: 'SEE CED 11 - EXCLUSIVA',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Jose De Assis Custodio',
    total_alunos: 30,
    turno: 'Tarde',
    dias_semana: ['2', '4', '5'],
    data_inicio: '2026-02-26',
    nome_sala: 'SEE CED 11 - Sala 1',
    local_sala: 'SEE CED 11 - EXCLUSIVA'
  },
  {
    codigo_turma: '2026.09.80',
    unidade: 'SEE CED 11 - EXCLUSIVA',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Jose De Assis Custodio',
    total_alunos: 39,
    turno: 'Tarde',
    dias_semana: ['1', '3', '6'],
    data_inicio: '2026-03-11',
    nome_sala: 'SEE CED 11 - Sala 2',
    local_sala: 'SEE CED 11 - EXCLUSIVA'
  },
  {
    codigo_turma: '2026.09.75',
    unidade: 'SEE CED 07 - EXCLUSIVA',
    nome_curso: 'Técnico em Informática para Internet',
    carga_horaria: 1000,
    curso_tem: true,
    instrutor: 'Ricardo De Souza Serra',
    total_alunos: 22,
    turno: 'Tarde',
    dias_semana: ['1', '3', '4', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'SEE CED 07 - Sala Exclusiva',
    local_sala: 'SEE CED 07 - EXCLUSIVA'
  },
  {
    codigo_turma: '2026.29.10',
    unidade: 'SEE CEM 308 - EXCLUSIVA',
    nome_curso: 'Técnico em Administração',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Flavia Renata Martins',
    total_alunos: 43,
    turno: 'Tarde',
    dias_semana: ['1', '3', '5'],
    data_inicio: '2026-02-25',
    nome_sala: 'SEE CEM 308 - Sala 1',
    local_sala: 'SEE CEM 308 - EXCLUSIVA'
  },
  {
    codigo_turma: '2026.29.12',
    unidade: 'SEE CEM 308 - EXCLUSIVA',
    nome_curso: 'Técnico em Marketing',
    carga_horaria: 800,
    curso_tem: true,
    instrutor: 'Flavia Renata Martins',
    total_alunos: 31,
    turno: 'Tarde',
    dias_semana: ['2', '4', '6'],
    data_inicio: '2026-02-26',
    nome_sala: 'SEE CEM 308 - Sala 2',
    local_sala: 'SEE CEM 308 - EXCLUSIVA'
  }
];

export async function seedDepartamentoTi() {
  console.log('=== Iniciando Consolidação do Banco (DEPARTAMENTO DE TI - TURMAS) ===');

  await seedReferenceData();

  const [dbSalas, dbTurnos, dbStatus, feriados] = await Promise.all([
    prisma.sala.findMany({ include: { tipoSala: true } }),
    prisma.turno.findMany(),
    prisma.statusTurma.findMany(),
    prisma.feriadosRecessos.findMany()
  ]);

  const feriadosStrings = feriados.map(f => f.data_feriado.toISOString().split('T')[0]!);
  const statusEmAndamento = dbStatus.find(s => s.nome_status === 'Em Andamento')!;
  const statusConcluida = dbStatus.find(s => s.nome_status === 'Concluída') ?? statusEmAndamento;
  const hojeStr = new Date().toISOString().split('T')[0]!;

  const ocupacaoSalas = new Map<string, string>();
  const ocupacaoInstrutores = new Map<string, string>();
  const resumoCriadas: Array<{
    codigo: string;
    unidade: string;
    curso: string;
    instrutor: string;
    sala: string;
    turno: string;
    alunos: number;
    inicio: string;
    termino: string;
    aulas: number;
  }> = [];

  await prisma.$transaction(async (tx) => {
    console.log('Limpando agendamentos e turmas anteriores...');
    await tx.agendamento.deleteMany({});
    await tx.turma.deleteMany({});

    const dbCursos = await tx.curso.findMany();
    const dbInstrutores = await tx.instrutor.findMany();

    for (const item of TURMAS_DEPARTAMENTO_TI) {
      const turno = dbTurnos.find(tu => tu.nome_turno === item.turno);
      if (!turno) throw new Error(`Turno não encontrado: ${item.turno}`);

      const curso = dbCursos.find(c => normalizarChaveNome(c.nome_curso) === normalizarChaveNome(item.nome_curso));
      if (!curso) throw new Error(`Curso não encontrado para ${item.codigo_turma}: ${item.nome_curso}`);

      const instrutor = dbInstrutores.find(i => normalizarChaveNome(i.nome_instrutor) === normalizarChaveNome(item.instrutor));
      if (!instrutor) throw new Error(`Instrutor não encontrado para ${item.codigo_turma}: ${item.instrutor}`);

      const sala = dbSalas.find(s => s.nome_sala === item.nome_sala && s.local === item.local_sala);
      if (!sala) throw new Error(`Sala não encontrada para ${item.codigo_turma}: ${item.nome_sala} (${item.local_sala})`);

      if (item.total_alunos > sala.capacidade_maxima) {
        throw new Error(
          `Capacidade insuficiente na turma ${item.codigo_turma}: sala ${sala.nome_sala} suporta ${sala.capacidade_maxima}, solicitado ${item.total_alunos}.`
        );
      }

      const cronograma = calcularCronograma(
        item.carga_horaria,
        new Date(`${item.data_inicio}T00:00:00.000Z`),
        item.dias_semana,
        feriadosStrings,
        item.turno
      );

      for (const dataAula of cronograma.datasAulas) {
        const chaveSala = `${sala.id_salas}:${dataAula}:${turno.id_turno}`;
        if (ocupacaoSalas.has(chaveSala)) {
          throw new Error(
            `Conflito de sala em ${dataAula} (${item.turno}): ${sala.nome_sala} entre ${ocupacaoSalas.get(chaveSala)} e ${item.codigo_turma}`
          );
        }

        const chaveInstrutor = `${instrutor.id_instrutores}:${dataAula}:${turno.id_turno}`;
        if (ocupacaoInstrutores.has(chaveInstrutor)) {
          throw new Error(
            `Conflito de instrutor em ${dataAula} (${item.turno}): ${instrutor.nome_instrutor} entre ${ocupacaoInstrutores.get(chaveInstrutor)} e ${item.codigo_turma}`
          );
        }
      }

      for (const dataAula of cronograma.datasAulas) {
        ocupacaoSalas.set(`${sala.id_salas}:${dataAula}:${turno.id_turno}`, item.codigo_turma);
        ocupacaoInstrutores.set(`${instrutor.id_instrutores}:${dataAula}:${turno.id_turno}`, item.codigo_turma);
      }

      const terminoStr = cronograma.dataTermino.toISOString().split('T')[0]!;
      const statusEscolhido = terminoStr < hojeStr ? statusConcluida : statusEmAndamento;

      const turmaCriada = await tx.turma.create({
        data: {
          id_cursos: curso.id_cursos,
          id_instrutores: instrutor.id_instrutores,
          codigo_turma: item.codigo_turma,
          fk_id_status: statusEscolhido.id_status,
          fk_id_turno: turno.id_turno,
          data_inicio: new Date(`${item.data_inicio}T00:00:00.000Z`),
          data_termino: cronograma.dataTermino,
          total_alunos: item.total_alunos,
          dias_semana: item.dias_semana.join(','),
          observacoes: `Unidade: ${item.unidade}`
        }
      });

      await tx.agendamento.createMany({
        data: cronograma.datasAulas.map(d => ({
          id_turmas: turmaCriada.id_turmas,
          id_salas: sala.id_salas,
          fk_id_turno: turno.id_turno,
          data_aula: new Date(`${d}T00:00:00.000Z`)
        }))
      });

      resumoCriadas.push({
        codigo: item.codigo_turma,
        unidade: item.unidade,
        curso: curso.nome_curso,
        instrutor: instrutor.nome_instrutor,
        sala: sala.nome_sala,
        turno: item.turno,
        alunos: item.total_alunos,
        inicio: item.data_inicio,
        termino: terminoStr,
        aulas: cronograma.datasAulas.length
      });
    }
  }, { timeout: 60000 });

  console.log(`\n✓ ${resumoCriadas.length} turmas e seus agendamentos foram gravados com zero conflitos!`);
  return resumoCriadas;
}

if (process.argv[1]?.includes('seedDepartamentoTi')) {
  seedDepartamentoTi()
    .catch((err) => {
      console.error('Erro ao popular turmas do Departamento de TI:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
