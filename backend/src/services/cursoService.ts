import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import { configuracaoCursoSchema, type AtualizacaoCurso } from '../schemas/cursoSchema.js';
import type { Prisma } from '@prisma/client';

export class CursoService {
  async getAll() {
    return prisma.curso.findMany({
      include: {
        tipoSala: true,
        instrutorPadrao: true,
      }
    });
  }

  async getById(id: number) {
    const curso = await prisma.curso.findUnique({
      where: { id_cursos: id },
      include: {
        tipoSala: true,
        instrutorPadrao: true,
      }
    });
    if (!curso) throw new HttpError(404, 'Curso não encontrado');
    return curso;
  }

  async create(data: Prisma.CursoUncheckedCreateInput) {
    return prisma.curso.create({
      data
    });
  }

  async update(id: number, data: AtualizacaoCurso) {
    const atual = await this.getById(id);
    const { modalidade, dias_letivos_padrao, dias_remotos_padrao } = data;
    const configuracao = modalidade !== undefined || dias_letivos_padrao !== undefined || dias_remotos_padrao !== undefined
      ? configuracaoCursoSchema.parse({
          modalidade,
          dias_letivos_padrao: dias_letivos_padrao === undefined ? atual.dias_letivos_padrao : dias_letivos_padrao,
          dias_remotos_padrao: dias_remotos_padrao === undefined ? atual.dias_remotos_padrao : dias_remotos_padrao
        })
      : {};
    return prisma.curso.update({
      where: { id_cursos: id },
      data: { ...data, ...configuracao }
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.$transaction(async (tx) => {
      const turmas = await tx.turma.findMany({
        where: { id_cursos: id },
        select: { id_turmas: true }
      });
      const turmaIds = turmas.map(t => t.id_turmas);
      if (turmaIds.length > 0) {
        await tx.agendamento.deleteMany({
          where: { id_turmas: { in: turmaIds } }
        });
        await tx.turma.deleteMany({
          where: { id_turmas: { in: turmaIds } }
        });
      }
      return tx.curso.delete({
        where: { id_cursos: id }
      });
    });
  }
}
