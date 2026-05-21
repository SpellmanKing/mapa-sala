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

    // Cria a Turma
    const turma = await prisma.turma.create({
      data: {
        id_cursos: data.id_cursos,
        codigo_turma: data.codigo_turma,
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
}
