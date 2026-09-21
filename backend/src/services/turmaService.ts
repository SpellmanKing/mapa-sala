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

    const primeiro = await prisma.turno.findFirst();
    return primeiro ? primeiro.id_turno : 1;
  }

  async alocarTurma(data: { id_cursos: number, id_salas: number, data_inicio: Date, fk_id_turno: number, total_alunos: number, codigo_turma: string, dias_semana: string[], id_instrutores?: number }) {
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

    const totalAlunos = Number(data.total_alunos) || 30;
    if (totalAlunos > sala.capacidade_maxima) {
      throw new HttpError(400, `Capacidade física insuficiente: o ambiente ${sala.nome_sala} comporta no máximo ${sala.capacidade_maxima} alunos (solicitado: ${totalAlunos}).`);
    }

    const diasSemana = data.dias_semana && data.dias_semana.length > 0 ? data.dias_semana : ['1', '2', '3', '4', '5']; 

    const cronograma = await this.calculadoraService.calcularCronograma(
      curso.carga_horaria,
      data.data_inicio,
      diasSemana
    );

    const idTurnoReal = await this.obterIdTurnoReal(data.fk_id_turno);

    const datas = cronograma.datasAulas.map(d => new Date(d));
    const conflito = await prisma.agendamento.findFirst({
      where: {
        id_salas: data.id_salas,
        data_aula: { in: datas },
        turma: { fk_id_turno: idTurnoReal }
      },
      include: { sala: true }
    });

    if (conflito) {
      const dataFormatada = formatarDataBR(conflito.data_aula);
      throw new HttpError(409, `Conflito: O ambiente ${conflito.sala.nome_sala} já está ocupado neste turno no dia ${dataFormatada}.`);
    }

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
    const idStatusReal = statusPlanejada ? statusPlanejada.id_status : 7;

    return prisma.$transaction(async (tx) => {
      // Cria a Turma
      const turma = await tx.turma.create({
        data: {
          id_cursos: data.id_cursos,
          id_instrutores: data.id_instrutores !== undefined ? data.id_instrutores : curso.id_instrutor_padrao,
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

  async reallocarTurma(id_turmas: number, data: { id_salas: number, data_inicio: Date, fk_id_turno: number, dias_semana: string[], id_instrutores?: number }) {
    const turma = await prisma.turma.findUnique({ where: { id_turmas }, include: { curso: true } });
    if (!turma) throw new HttpError(404, 'Turma não encontrada');

    const diasSemana = data.dias_semana && data.dias_semana.length > 0 ? data.dias_semana : ['1', '2', '3', '4', '5'];
    
    const cronograma = await this.calculadoraService.calcularCronograma(
      turma.curso.carga_horaria,
      data.data_inicio,
      diasSemana
    );

    const idTurnoReal = await this.obterIdTurnoReal(data.fk_id_turno);

    const datas = cronograma.datasAulas.map(d => new Date(d));
    const conflito = await prisma.agendamento.findFirst({
      where: {
        id_salas: data.id_salas,
        data_aula: { in: datas },
        id_turmas: { not: id_turmas },
        turma: { fk_id_turno: idTurnoReal }
      },
      include: { sala: true }
    });

    if (conflito) {
      const dataFormatada = formatarDataBR(conflito.data_aula);
      throw new HttpError(409, `Conflito: O ambiente ${conflito.sala.nome_sala} já está ocupado neste turno no dia ${dataFormatada}.`);
    }

    return prisma.$transaction(async (tx) => {
      await tx.agendamento.deleteMany({ where: { id_turmas } });
      
      await tx.turma.update({
        where: { id_turmas },
        data: {
          fk_id_turno: idTurnoReal,
          data_inicio: new Date(data.data_inicio),
          data_termino: new Date(cronograma.dataTermino || data.data_inicio),
          dias_semana: diasSemana.join(','),
          ...(data.id_instrutores !== undefined ? { id_instrutores: data.id_instrutores } : {})
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
