import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';

export class CursoService {
  async getAll() {
    return prisma.curso.findMany({
      include: {
        tipoSala: true,
      }
    });
  }

  async getById(id: number) {
    const curso = await prisma.curso.findUnique({
      where: { id_cursos: id },
      include: {
        tipoSala: true,
      }
    });
    if (!curso) throw new HttpError(404, 'Curso não encontrado');
    return curso;
  }

  async create(data: { nome_curso: string, segmento: string, modalidade: string, carga_horaria: number, valor: number, curso_tem: boolean, bolsa_compativel: boolean, idTipo_sala?: number, codigo_turma_padrao?: string, turno_padrao?: string, dias_letivos_padrao?: string }) {
    return prisma.curso.create({
      data
    });
  }

  async update(id: number, data: Partial<{ nome_curso: string, segmento: string, modalidade: string, carga_horaria: number, valor: number, curso_tem: boolean, bolsa_compativel: boolean, idTipo_sala: number, codigo_turma_padrao: string, turno_padrao: string, dias_letivos_padrao: string }>) {
    await this.getById(id);
    return prisma.curso.update({
      where: { id_cursos: id },
      data
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.curso.delete({
      where: { id_cursos: id }
    });
  }
}
