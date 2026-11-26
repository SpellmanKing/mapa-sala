import { Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import { horasPorTurno } from '../utils/horasPorTurno.js';
import { datasRemotasDoCronograma } from '../utils/modalidadeAula.js';
import { CalculadoraService } from './calculadoraService.js';

function formatarDataBR(data: Date | string): string {
  const str = typeof data === 'string' ? data : data.toISOString();
  const dateOnly = str.split('T')[0] || '';
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateOnly;
}

type ConflitoRecurso = {
  id_salas: number | null;
  id_turmas: number;
  data_aula: Date;
  sala: { nome_sala: string } | null;
  turma: {
    codigo_turma: string;
    id_instrutores: number | null;
    instrutor: { nome_instrutor: string } | null;
  };
};

type DadosRealocacao = {
  id_salas?: number | null;
  data_inicio: Date;
  fk_id_turno: number;
  dias_semana: string[];
  id_instrutores?: number | null;
};

export class TurmaService {
  private calculadoraService = new CalculadoraService();

  async getAll() {
    const turmas = await prisma.turma.findMany({
      include: {
        curso: true,
        instrutor: true,
        turno: true,
        agendamentos: {
          orderBy: { data_aula: 'desc' },
          select: {
            id_salas: true,
            data_aula: true
          }
        }
      }
    });

    return turmas.map(turma => {
      // A carga de TI registra a unidade da turma em uma linha das observações.
      const unidadeTurma = turma.observacoes?.match(/^[ \t]*Unidade:[ \t]*([^\r\n]+)/im)?.[1]?.trim();
      // shortcut: o indicador da carga atual vem do programa da turma até existir um campo próprio.
      const turmaTem = unidadeTurma
        ? /^(?:TEM|SEE)\b/i.test(unidadeTurma) || /\(CLDF\)$/i.test(turma.curso.nome_curso.trim())
        : turma.curso.curso_tem;

      return { ...turma, unidade: unidadeTurma || turma.curso.unidade, turma_tem: turmaTem };
    });
  }

  async getAgendamentos() {
    return prisma.agendamento.findMany({
      include: {
        turma: {
          include: {
            curso: true
          }
        },
        sala: true
      }
    });
  }

  private async obterConflitosRecursos(
    tx: Prisma.TransactionClient,
    datas: Date[],
    idTurno: number,
    idSala: number | null,
    idInstrutor?: number | null,
    ignoreTurmaId?: number
  ): Promise<ConflitoRecurso[]> {
    if (idSala == null && idInstrutor == null) return [];
    return tx.agendamento.findMany({
      where: {
        data_aula: { in: datas },
        turma: {
          fk_id_turno: idTurno,
          ...(ignoreTurmaId ? { id_turmas: { not: ignoreTurmaId } } : {})
        },
        OR: [
          ...(idSala != null ? [{ id_salas: idSala }] : []),
          ...(idInstrutor != null ? [{ turma: { id_instrutores: idInstrutor } }] : [])
        ]
      },
      select: {
        id_salas: true,
        id_turmas: true,
        data_aula: true,
        sala: { select: { nome_sala: true } },
        turma: {
          select: {
            codigo_turma: true,
            id_instrutores: true,
            instrutor: { select: { nome_instrutor: true } }
          }
        }
      }
    });
  }

  private async bloquearRecursos(
    tx: Prisma.TransactionClient,
    idTurno: number,
    idSala: number | null,
    idInstrutor?: number | null
  ) {
    // ponytail: locks por recurso/turno são intencionalmente amplos; particionar por data se houver contenção mensurável.
    const chaves = [
      ...(idSala != null ? [`sala:${idSala}:turno:${idTurno}`] : []),
      ...(idInstrutor != null ? [`instrutor:${idInstrutor}:turno:${idTurno}`] : [])
    ].sort();

    for (const chave of chaves) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${chave}, 0))::text`;
    }
  }

  private validarConflitos(
    conflitos: ConflitoRecurso[],
    idSala: number | null,
    datasRemotas: Set<string>,
    idInstrutor?: number | null
  ) {
    const conflitoSala = conflitos.find(conflito =>
      idSala != null && conflito.id_salas === idSala && !datasRemotas.has(conflito.data_aula.toISOString().slice(0, 10))
    );
    if (conflitoSala?.sala) {
      throw new HttpError(
        409,
        `Conflito de sala: o ambiente ${conflitoSala.sala.nome_sala} já está reservado para a turma ${conflitoSala.turma.codigo_turma} neste turno em ${formatarDataBR(conflitoSala.data_aula)}.`
      );
    }

    const conflitoInstrutor = conflitos.find(conflito =>
      idInstrutor != null && conflito.turma.id_instrutores === idInstrutor
    );
    if (conflitoInstrutor) {
      throw new HttpError(
        409,
        `Conflito de instrutor: ${conflitoInstrutor.turma.instrutor?.nome_instrutor ?? 'o instrutor selecionado'} já está associado à turma ${conflitoInstrutor.turma.codigo_turma} neste turno em ${formatarDataBR(conflitoInstrutor.data_aula)}.`
      );
    }
  }

  private async obterSala(idSala: number | null | undefined, totalAlunos: number, requerSala: boolean) {
    if (!requerSala) return null;
    if (idSala == null) throw new HttpError(400, 'Selecione uma sala para as aulas presenciais.');
    const sala = await prisma.sala.findUnique({ where: { id_salas: idSala } });
    if (!sala) throw new HttpError(404, 'Ambiente pedagógico não encontrado');
    if (totalAlunos > sala.capacidade_maxima) {
      throw new HttpError(400, `Capacidade física insuficiente: o ambiente ${sala.nome_sala} comporta no máximo ${sala.capacidade_maxima} alunos (solicitado: ${totalAlunos}).`);
    }
    return sala.id_salas;
  }

  async getDisponibilidade(data: {
    id_cursos: number;
    data_inicio: Date;
    fk_id_turno: number;
    total_alunos: number;
    dias_semana: string[];
    id_instrutores?: number | null;
    ignore_turma_id?: number;
  }) {
    const curso = await prisma.curso.findUnique({ where: { id_cursos: data.id_cursos } });
    if (!curso) throw new HttpError(404, 'Curso não encontrado');

    const turnoReal = await this.obterTurnoReal(data.fk_id_turno);
    const idTurnoReal = turnoReal.id_turno;
    const turmaEditada = data.ignore_turma_id
      ? await prisma.turma.findUnique({ where: { id_turmas: data.ignore_turma_id } })
      : null;
    if (data.ignore_turma_id && (!turmaEditada || turmaEditada.id_cursos !== curso.id_cursos)) {
      throw new HttpError(404, 'Turma não encontrada para este curso.');
    }
    const cronograma = turmaEditada
      ? (await this.planejarRealocacao(prisma, { ...turmaEditada, curso }, data, turnoReal)).cronograma
      : await this.calculadoraService.calcularCronograma(
          curso.carga_horaria, data.data_inicio, data.dias_semana, undefined, turnoReal.nome_turno
        );
    const datasAulas = cronograma?.datasAulas ?? [];
    const datasRemotas = datasRemotasDoCronograma(curso, datasAulas);
    const requerSala = datasAulas.length > datasRemotas.size;
    const datas = datasAulas.map(dataAula => new Date(dataAula));
    const idInstrutor = data.id_instrutores === undefined
      ? curso.id_instrutor_padrao
      : data.id_instrutores;
    const [salas, turnos, agendamentos] = await Promise.all([
      prisma.sala.findMany({ include: { tipoSala: true } }),
      prisma.turno.findMany({ orderBy: { id_turno: 'asc' } }),
      prisma.agendamento.findMany({
        where: {
          data_aula: { in: datas },
          ...(data.ignore_turma_id ? { id_turmas: { not: data.ignore_turma_id } } : {})
        },
        select: {
          id_salas: true,
          id_turmas: true,
          data_aula: true,
          turma: {
            select: {
              codigo_turma: true,
              fk_id_turno: true,
              id_instrutores: true,
              instrutor: { select: { nome_instrutor: true } }
            }
          }
        }
      })
    ]);
    const conflitosTurno = agendamentos.filter(agendamento =>
      agendamento.turma.fk_id_turno === idTurnoReal
    );
    const ocupamSala = (agendamento: (typeof agendamentos)[number]) =>
      agendamento.id_salas != null && !datasRemotas.has(agendamento.data_aula.toISOString().slice(0, 10));
    const conflitosSala = conflitosTurno.filter(ocupamSala);
    const salasOcupadas = new Set(conflitosSala.map(agendamento => agendamento.id_salas));

    const salasLivres = requerSala ? salas.filter(sala =>
      sala.capacidade_maxima >= data.total_alunos && !salasOcupadas.has(sala.id_salas)
    ) : [];
    const sugestoesTurnos = [] as Array<{ turno: string; vagas: number }>;

    for (const turno of turnos) {
      if (turno.id_turno === idTurnoReal || !requerSala) continue;
      const ocupadas = agendamentos.filter(agendamento =>
        agendamento.turma.fk_id_turno === turno.id_turno && ocupamSala(agendamento)
      );
      const ocupadasIds = new Set(ocupadas.map(agendamento => agendamento.id_salas));
      const livres = salas.filter(sala =>
        sala.capacidade_maxima >= data.total_alunos && !ocupadasIds.has(sala.id_salas)
      );
      if (livres.length > 0) sugestoesTurnos.push({ turno: turno.nome_turno, vagas: livres.length });
    }

    return {
      requerSala,
      cronograma: cronograma ? {
        cargaHoraria: curso.carga_horaria,
        dataTermino: cronograma.dataTermino,
        totalAulas: cronograma.totalAulas,
        horasPorAula: cronograma.horasPorAula,
        datasAulas,
        datasRemotas: [...datasRemotas]
      } : null,
      salasLivres: salasLivres.map(sala => sala.id_salas),
      salasOcupadas: conflitosSala.map(agendamento => ({
        salaId: agendamento.id_salas,
        turmaId: agendamento.id_turmas,
        turmaCodigo: agendamento.turma.codigo_turma,
        data: agendamento.data_aula
      })),
      salasCapacidadeInsuficiente: salas
        .filter(sala => requerSala && sala.capacidade_maxima < data.total_alunos)
        .map(sala => ({
          salaId: sala.id_salas,
          nome: sala.nome_sala,
          capacidade: sala.capacidade_maxima
        })),
      conflitoInstrutor: idInstrutor == null
        ? null
        : conflitosTurno
            .filter(agendamento => agendamento.turma.id_instrutores === idInstrutor)
            .map(agendamento => ({
              instrutorId: idInstrutor,
              nome: agendamento.turma.instrutor?.nome_instrutor ?? 'Instrutor selecionado',
              turmaId: agendamento.id_turmas,
              turmaCodigo: agendamento.turma.codigo_turma,
              data: agendamento.data_aula
            }))[0] ?? null,
      totalSalas: salas.length,
      sugestoesTurnos
    };
  }

  private async obterTurnoReal(idOuNome: number | string) {
    const nome = typeof idOuNome === 'string'
      ? idOuNome
      : idOuNome === 1 ? 'Manhã' : idOuNome === 2 ? 'Tarde' : idOuNome === 3 ? 'Noite' : null;

    if (nome) {
      const t = await prisma.turno.findFirst({ where: { nome_turno: nome } });
      if (t) return t;
    }

    if (typeof idOuNome === 'number') {
      const t = await prisma.turno.findUnique({ where: { id_turno: idOuNome } });
      if (t) return t;
    }

    throw new HttpError(400, 'Turno inválido');
  }

  async alocarTurma(data: DadosRealocacao & { id_cursos: number; total_alunos: number; codigo_turma?: string }) {
    // Busca o curso para ver os detalhes
    const curso = await prisma.curso.findUnique({
      where: { id_cursos: data.id_cursos }
    });

    if (!curso) throw new HttpError(404, 'Curso não encontrado');

    const diasSemana = data.dias_semana;

    const turnoReal = await this.obterTurnoReal(data.fk_id_turno);
    const idTurnoReal = turnoReal.id_turno;
    const cronograma = await this.calculadoraService.calcularCronograma(
      curso.carga_horaria,
      data.data_inicio,
      diasSemana,
      undefined,
      turnoReal.nome_turno
    );

    const datas = cronograma.datasAulas.map(d => new Date(d));
    const datasRemotas = datasRemotasDoCronograma(curso, cronograma.datasAulas);
    const idSala = await this.obterSala(data.id_salas, data.total_alunos, datas.length > datasRemotas.size);
    const idInstrutor = data.id_instrutores === undefined
      ? curso.id_instrutor_padrao
      : data.id_instrutores;
    // Determina o código da turma de forma robusta e única
    let codigoTurmaFinal = data.codigo_turma || curso.codigo_turma_padrao || `TURMA-${data.id_cursos}`;
    const turmaExistente = await prisma.turma.findFirst({
      where: { codigo_turma: codigoTurmaFinal }
    });
    if (turmaExistente) {
      const totalMesmoCodigo = await prisma.turma.count({
        where: { codigo_turma: { startsWith: codigoTurmaFinal } }
      });
      codigoTurmaFinal = `${codigoTurmaFinal}-${totalMesmoCodigo + 1}`;
    }

    const statusPlanejada = await prisma.statusTurma.findFirst({
      where: { nome_status: 'Planejada' }
    });
    if (!statusPlanejada) {
      throw new HttpError(500, 'Status Planejada não configurado');
    }
    const idStatusReal = statusPlanejada.id_status;

    return prisma.$transaction(async (tx) => {
      await this.bloquearRecursos(tx, idTurnoReal, idSala, idInstrutor);
      const conflitos = await this.obterConflitosRecursos(
        tx,
        datas,
        idTurnoReal,
        idSala,
        idInstrutor
      );
      this.validarConflitos(conflitos, idSala, datasRemotas, idInstrutor);

      const turma = await tx.turma.create({
        data: {
          id_cursos: data.id_cursos,
          id_instrutores: idInstrutor,
          codigo_turma: codigoTurmaFinal,
          fk_id_turno: idTurnoReal,
          data_inicio: new Date(data.data_inicio),
          data_termino: new Date(cronograma.dataTermino || data.data_inicio),
          total_alunos: data.total_alunos,
          fk_id_status: idStatusReal,
          dias_semana: diasSemana.join(','),
        }
      });

      // Cria os Agendamentos
      const agendamentosParaCriar = cronograma.datasAulas.map(dataAula => ({
        id_turmas: turma.id_turmas,
        id_salas: datasRemotas.has(dataAula) ? null : idSala,
        fk_id_turno: idTurnoReal,
        data_aula: new Date(dataAula),
      }));

      await tx.agendamento.createMany({
        data: agendamentosParaCriar
      });

      return tx.turma.findUnique({
        where: { id_turmas: turma.id_turmas },
        include: {
          agendamentos: true
        }
      });
    });
  }

  private async planejarRealocacao(
    db: Prisma.TransactionClient,
    turma: Prisma.TurmaGetPayload<{ include: { curso: true } }>,
    data: DadosRealocacao,
    turno: { id_turno: number; nome_turno: string }
  ) {
    const agora = new Date();
    const hoje = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
    const anteriores = await db.agendamento.findMany({
      where: { id_turmas: turma.id_turmas, data_aula: { lt: hoje } },
      orderBy: { data_aula: 'desc' },
      select: { data_aula: true }
    });
    if (anteriores.length && (
      turno.id_turno !== turma.fk_id_turno ||
      data.data_inicio.toISOString().slice(0, 10) !== turma.data_inicio.toISOString().slice(0, 10)
    )) {
      throw new HttpError(409, 'Turma iniciada não pode mudar de turno nem de data de início.');
    }
    const inicio = anteriores.length || data.data_inicio < hoje ? hoje : data.data_inicio;
    const horas = horasPorTurno(turno.nome_turno);
    const aulasRestantes = Math.ceil(turma.curso.carga_horaria / horas) - anteriores.length;
    const cronograma = aulasRestantes > 0
      ? await this.calculadoraService.calcularCronograma(
          anteriores.length ? aulasRestantes * horas : turma.curso.carga_horaria,
          inicio, data.dias_semana, undefined, turno.nome_turno
        )
      : null;
    return { anteriores, hoje, inicio, cronograma };
  }

  async reallocarTurma(id_turmas: number, data: DadosRealocacao) {
    const turma = await prisma.turma.findUnique({ where: { id_turmas }, include: { curso: true } });
    if (!turma) throw new HttpError(404, 'Turma não encontrada');

    const diasSemana = data.dias_semana;
    const turnoReal = await this.obterTurnoReal(data.fk_id_turno);
    const idTurnoReal = turnoReal.id_turno;
    const idInstrutor = data.id_instrutores !== undefined
      ? data.id_instrutores
      : turma.id_instrutores;
    return prisma.$transaction(async (tx) => {
      const { anteriores, hoje, inicio, cronograma } = await this.planejarRealocacao(tx, turma, data, turnoReal);
      const datas = cronograma?.datasAulas.map(d => new Date(d)) ?? [];
      const datasRemotas = datasRemotasDoCronograma(turma.curso, cronograma?.datasAulas ?? []);
      const idSala = await this.obterSala(data.id_salas, turma.total_alunos, datas.length > datasRemotas.size);
      await this.bloquearRecursos(tx, idTurnoReal, idSala, idInstrutor);
      const conflitos = await this.obterConflitosRecursos(
        tx,
        datas,
        idTurnoReal,
        idSala,
        idInstrutor,
        id_turmas
      );
      this.validarConflitos(conflitos, idSala, datasRemotas, idInstrutor);

      await tx.agendamento.deleteMany({ where: { id_turmas, data_aula: { gte: hoje } } });
      
      await tx.turma.update({
        where: { id_turmas },
        data: {
          fk_id_turno: idTurnoReal,
          data_inicio: anteriores.length ? turma.data_inicio : inicio,
          data_termino: datas.at(-1) ?? anteriores[0]?.data_aula ?? inicio,
          dias_semana: diasSemana.join(','),
          id_instrutores: idInstrutor
        }
      });

      const agendamentosParaCriar = datas.map(dataAula => ({
        id_turmas,
        id_salas: datasRemotas.has(dataAula.toISOString().slice(0, 10)) ? null : idSala,
        fk_id_turno: idTurnoReal,
        data_aula: dataAula,
      }));

      if (agendamentosParaCriar.length) await tx.agendamento.createMany({ data: agendamentosParaCriar });

      return tx.turma.findUnique({
        where: { id_turmas },
        include: { agendamentos: true }
      });
    });
  }

  async deletarTurma(id_turmas: number) {
    const turma = await prisma.turma.findUnique({ where: { id_turmas } });
    if (!turma) throw new HttpError(404, 'Turma não encontrada');
    await prisma.turma.delete({ where: { id_turmas } });
    return { message: 'Alocação removida com sucesso' };
  }
}
