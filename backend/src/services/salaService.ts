import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

export class SalaService {
  async getAll() {
    return prisma.sala.findMany({
      include: {
        tipoSala: true,
      }
    });
  }

  async getTiposSala() {
    return prisma.tipoSala.findMany({
      orderBy: { nome_tipo: 'asc' }
    });
  }

  async getById(id: number) {
    const sala = await prisma.sala.findUnique({
      where: { id_salas: id },
      include: {
        tipoSala: true,
      }
    });
    if (!sala) throw new HttpError(404, 'Sala não encontrada');
    return sala;
  }

  async create(data: Prisma.SalaUncheckedCreateInput) {
    return prisma.sala.create({
      data
    });
  }

  async update(id: number, data: Prisma.SalaUncheckedUpdateInput) {
    await this.getById(id);
    return prisma.sala.update({
      where: { id_salas: id },
      data
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.$transaction(async (tx) => {
      await tx.agendamento.deleteMany({
        where: { id_salas: id }
      });
      return tx.sala.delete({
        where: { id_salas: id }
      });
    });
  }
}
