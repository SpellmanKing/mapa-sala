import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import { CalculadoraService } from './calculadoraService.js';

export class TurmaService {
  private calculadoraService = new CalculadoraService();

  async getAll() {
    return prisma.turma.findMany({
      include: {
        curso: true,
        instrutor: true,
        turno: true,
        agendamentos: {
          include: {
            sala: true
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

  async alocarTurma(data: { id_cursos: number, id_salas: number, data_inicio: Date, fk_id_turno: number, total_alunos: number, codigo_turma: string, dias_semana: string[] }) {
    // Busca o curso para ver os detalhes
    const curso = await prisma.curso.findUnique({
      where: { id_cursos: data.id_cursos }
    });

    if (!curso) throw new HttpError(404, 'Curso não encontrado');

    const diasSemana = data.dias_semana && data.dias_semana.length > 0 ? data.dias_semana : ['1', '2', '3', '4', '5']; 

    const cronograma = await this.calculadoraService.calcularCronograma(
      curso.carga_horaria,
      data.data_inicio,
      diasSemana
    );

    const datas = cronograma.datasAulas.map(d => new Date(d));
    const conflito = await prisma.agendamento.findFirst({
      where: {
        id_salas: data.id_salas,
        data_aula: { in: datas },
        turma: { fk_id_turno: data.fk_id_turno }
      },
      include: { sala: true }
    });

    if (conflito) {
      const dataFormatada = conflito.data_aula.toLocaleDateString('pt-BR');
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

    // Cria a Turma
    const turma = await prisma.turma.create({
      data: {
        id_cursos: data.id_cursos,
        id_instrutores: curso.id_instrutor_padrao,
        codigo_turma: codigoTurmaFinal,
        fk_id_turno: data.fk_id_turno,
        data_inicio: new Date(data.data_inicio),
        data_termino: new Date(cronograma.dataTermino),
        total_alunos: data.total_alunos,
        fk_id_status: 1, // Ex: Planejada
      }
    });

    // Cria os Agendamentos
    const agendamentosParaCriar = cronograma.datasAulas.map(dataAula => ({
      id_turmas: turma.id_turmas,
      id_salas: data.id_salas,
      data_aula: new Date(dataAula),
    }));

    await prisma.agendamento.createMany({
      data: agendamentosParaCriar
    });

    return prisma.turma.findUnique({
      where: { id_turmas: turma.id_turmas },
      include: {
        agendamentos: true
      }
    });
  }

  async reallocarTurma(id_turmas: number, data: { id_salas: number, data_inicio: Date, fk_id_turno: number, dias_semana: string[] }) {
    const turma = await prisma.turma.findUnique({ where: { id_turmas }, include: { curso: true } });
    if (!turma) throw new HttpError(404, 'Turma não encontrada');

    const diasSemana = data.dias_semana && data.dias_semana.length > 0 ? data.dias_semana : ['1', '2', '3', '4', '5'];
    
    const cronograma = await this.calculadoraService.calcularCronograma(
      turma.curso.carga_horaria,
      data.data_inicio,
      diasSemana
    );

    const datas = cronograma.datasAulas.map(d => new Date(d));
    const conflito = await prisma.agendamento.findFirst({
      where: {
        id_salas: data.id_salas,
        data_aula: { in: datas },
        id_turmas: { not: id_turmas },
        turma: { fk_id_turno: data.fk_id_turno }
      },
      include: { sala: true }
    });

    if (conflito) {
      const dataFormatada = conflito.data_aula.toLocaleDateString('pt-BR');
      throw new HttpError(409, `Conflito: O ambiente ${conflito.sala.nome_sala} já está ocupado neste turno no dia ${dataFormatada}.`);
    }

    await prisma.agendamento.deleteMany({ where: { id_turmas } });
    
    await prisma.turma.update({
      where: { id_turmas },
      data: {
        fk_id_turno: data.fk_id_turno,
        data_inicio: new Date(data.data_inicio),
        data_termino: new Date(cronograma.dataTermino)
      }
    });

    const agendamentosParaCriar = datas.map(dataAula => ({
      id_turmas,
      id_salas: data.id_salas,
      data_aula: dataAula,
    }));

    await prisma.agendamento.createMany({ data: agendamentosParaCriar });

    return prisma.turma.findUnique({
      where: { id_turmas },
      include: { agendamentos: true }
    });
  }

  async deletarTurma(id_turmas: number) {
    const turma = await prisma.turma.findUnique({ where: { id_turmas } });
    if (!turma) throw new HttpError(404, 'Turma não encontrada');
    await prisma.turma.delete({ where: { id_turmas } });
    return { message: 'Alocação removida com sucesso' };
  }
}
