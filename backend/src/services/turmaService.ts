import { Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
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
  id_salas: number;
  id_turmas: number;
  data_aula: Date;
  sala: { nome_sala: string };
  turma: {
    codigo_turma: string;
    id_instrutores: number | null;
    instrutor: { nome_instrutor: string } | null;
  };
};

export class TurmaService {
  private calculadoraService = new CalculadoraService();

  async getAll() {
    return prisma.turma.findMany({
      include: {
        curso: true,
        instrutor: true,
        turno: true,
        agendamentos: {
          take: 1,
          select: {
            id_salas: true
          }
        }
      }
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
    idSala: number,
    idInstrutor?: number | null,
    ignoreTurmaId?: number
  ): Promise<ConflitoRecurso[]> {
    return tx.agendamento.findMany({
      where: {
        data_aula: { in: datas },
        turma: {
          fk_id_turno: idTurno,
          ...(ignoreTurmaId ? { id_turmas: { not: ignoreTurmaId } } : {})
        },
        OR: [
          { id_salas: idSala },
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
    idSala: number,
    idInstrutor?: number | null
  ) {
    // ponytail: locks por recurso/turno são intencionalmente amplos; particionar por data se houver contenção mensurável.
    const chaves = [
      `sala:${idSala}:turno:${idTurno}`,
      ...(idInstrutor != null ? [`instrutor:${idInstrutor}:turno:${idTurno}`] : [])
    ].sort();

    for (const chave of chaves) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${chave}, 0))`;
    }
  }

  private validarConflitos(
    conflitos: ConflitoRecurso[],
    idSala: number,
    idInstrutor?: number | null
  ) {
    const conflitoSala = conflitos.find(conflito => conflito.id_salas === idSala);
    if (conflitoSala) {
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

  async getDisponibilidade(data: {
    id_cursos: number;
    id_salas?: number;
    data_inicio: Date;
    fk_id_turno: number;
    total_alunos: number;
    dias_semana: string[];
    id_instrutores?: number | null;
    ignore_turma_id?: number;
  }) {
    const curso = await prisma.curso.findUnique({ where: { id_cursos: data.id_cursos } });
    if (!curso) throw new HttpError(404, 'Curso não encontrado');

    const idTurnoReal = await this.obterIdTurnoReal(data.fk_id_turno);
    const cronograma = await this.calculadoraService.calcularCronograma(
      curso.carga_horaria,
      data.data_inicio,
      data.dias_semana
    );
    const datas = cronograma.datasAulas.map(dataAula => new Date(dataAula));
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
    const salasOcupadas = new Set(conflitosTurno.map(agendamento => agendamento.id_salas));

    const salasLivres = salas.filter(sala =>
      sala.capacidade_maxima >= data.total_alunos && !salasOcupadas.has(sala.id_salas)
    );
    const sugestoesTurnos = [] as Array<{ turno: string; vagas: number }>;

    for (const turno of turnos) {
      if (turno.id_turno === idTurnoReal) continue;
      const ocupadas = agendamentos.filter(agendamento =>
        agendamento.turma.fk_id_turno === turno.id_turno
      );
      const ocupadasIds = new Set(ocupadas.map(agendamento => agendamento.id_salas));
      const livres = salas.filter(sala =>
        sala.capacidade_maxima >= data.total_alunos && !ocupadasIds.has(sala.id_salas)
      );
      if (livres.length > 0) sugestoesTurnos.push({ turno: turno.nome_turno, vagas: livres.length });
    }

    return {
      salasLivres: salasLivres.map(sala => sala.id_salas),
      salasOcupadas: conflitosTurno.map(agendamento => ({
        salaId: agendamento.id_salas,
        turmaId: agendamento.id_turmas,
        turmaCodigo: agendamento.turma.codigo_turma,
        data: agendamento.data_aula
      })),
      salasCapacidadeInsuficiente: salas
        .filter(sala => sala.capacidade_maxima < data.total_alunos)
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

  private async obterIdTurnoReal(idOuNome: number | string): Promise<number> {
    const nome = typeof idOuNome === 'string'
      ? idOuNome
      : idOuNome === 1 ? 'Manhã' : idOuNome === 2 ? 'Tarde' : idOuNome === 3 ? 'Noite' : null;

    if (nome) {
      const t = await prisma.turno.findFirst({ where: { nome_turno: nome } });
      if (t) return t.id_turno;
    }

    if (typeof idOuNome === 'number') {
      const t = await prisma.turno.findUnique({ where: { id_turno: idOuNome } });
      if (t) return t.id_turno;
    }

    throw new HttpError(400, 'Turno inválido');
  }

  async alocarTurma(data: { id_cursos: number, id_salas: number, data_inicio: Date, fk_id_turno: number, total_alunos: number, codigo_turma?: string, dias_semana: string[], id_instrutores?: number | null }) {
    // Busca o curso para ver os detalhes
    const curso = await prisma.curso.findUnique({
      where: { id_cursos: data.id_cursos }
    });

    if (!curso) throw new HttpError(404, 'Curso não encontrado');

    // Busca a sala para validar existência e capacidade física
    const sala = await prisma.sala.findUnique({
      where: { id_salas: data.id_salas }
    });
    if (!sala) throw new HttpError(404, 'Ambiente pedagógico não encontrado');

    const totalAlunos = Number(data.total_alunos);
    if (totalAlunos > sala.capacidade_maxima) {
      throw new HttpError(400, `Capacidade física insuficiente: o ambiente ${sala.nome_sala} comporta no máximo ${sala.capacidade_maxima} alunos (solicitado: ${totalAlunos}).`);
    }

    const diasSemana = data.dias_semana;

    const cronograma = await this.calculadoraService.calcularCronograma(
      curso.carga_horaria,
      data.data_inicio,
      diasSemana
    );

    const idTurnoReal = await this.obterIdTurnoReal(data.fk_id_turno);

    const datas = cronograma.datasAulas.map(d => new Date(d));
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
      await this.bloquearRecursos(tx, idTurnoReal, data.id_salas, idInstrutor);
      const conflitos = await this.obterConflitosRecursos(
        tx,
        datas,
        idTurnoReal,
        data.id_salas,
        idInstrutor
      );
      this.validarConflitos(conflitos, data.id_salas, idInstrutor);

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
        id_salas: data.id_salas,
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

  async reallocarTurma(id_turmas: number, data: { id_salas: number, data_inicio: Date, fk_id_turno: number, dias_semana: string[], id_instrutores?: number | null }) {
    const turma = await prisma.turma.findUnique({ where: { id_turmas }, include: { curso: true } });
    const sala = await prisma.sala.findUnique({ where: { id_salas: data.id_salas } });
    if (!sala) throw new HttpError(404, 'Ambiente pedagógico não encontrado');
    if (turma && turma.total_alunos > sala.capacidade_maxima) {
      throw new HttpError(400, `Capacidade física insuficiente: o ambiente ${sala.nome_sala} comporta no máximo ${sala.capacidade_maxima} alunos (turma: ${turma.total_alunos}).`);
    }
    if (!turma) throw new HttpError(404, 'Turma não encontrada');

    const diasSemana = data.dias_semana;
    
    const cronograma = await this.calculadoraService.calcularCronograma(
      turma.curso.carga_horaria,
      data.data_inicio,
      diasSemana
    );

    const idTurnoReal = await this.obterIdTurnoReal(data.fk_id_turno);

    const datas = cronograma.datasAulas.map(d => new Date(d));
    const idInstrutor = data.id_instrutores !== undefined
      ? data.id_instrutores
      : turma.id_instrutores;
    return prisma.$transaction(async (tx) => {
      await this.bloquearRecursos(tx, idTurnoReal, data.id_salas, idInstrutor);
      const conflitos = await this.obterConflitosRecursos(
        tx,
        datas,
        idTurnoReal,
        data.id_salas,
        idInstrutor,
        id_turmas
      );
      this.validarConflitos(conflitos, data.id_salas, idInstrutor);

      await tx.agendamento.deleteMany({ where: { id_turmas } });
      
      await tx.turma.update({
        where: { id_turmas },
        data: {
          fk_id_turno: idTurnoReal,
          data_inicio: new Date(data.data_inicio),
          data_termino: new Date(cronograma.dataTermino || data.data_inicio),
          dias_semana: diasSemana.join(','),
          id_instrutores: idInstrutor
        }
      });

      const agendamentosParaCriar = datas.map(dataAula => ({
        id_turmas,
        id_salas: data.id_salas,
        data_aula: dataAula,
      }));

      await tx.agendamento.createMany({ data: agendamentosParaCriar });

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
