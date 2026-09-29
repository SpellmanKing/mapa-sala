import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

export class InstrutorService {
  async getAll() {
    return prisma.instrutor.findMany({
      orderBy: { nome_instrutor: 'asc' }
    });
  }

  async getById(id: number) {
    const instrutor = await prisma.instrutor.findUnique({
      where: { id_instrutores: id },
    });
    if (!instrutor) throw new HttpError(404, 'Instrutor não encontrado');
    return instrutor;
  }

  async create(data: Prisma.InstrutorCreateInput) {
    return prisma.instrutor.create({
      data
    });
  }

  async update(id: number, data: Prisma.InstrutorUpdateInput) {
    await this.getById(id);
    return prisma.instrutor.update({
      where: { id_instrutores: id },
      data
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.instrutor.delete({
      where: { id_instrutores: id }
    });
  }
}
