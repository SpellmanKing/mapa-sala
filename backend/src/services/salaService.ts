import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';

export class SalaService {
  async getAll() {
    return prisma.sala.findMany({
      include: {
        tipoSala: true,
      }
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

  async create(data: { nome_sala: string, capacidade_maxima: number, idTipo_sala?: number, local?: string, recursos_especiais?: string }) {
    return prisma.sala.create({
      data
    });
  }

  async update(id: number, data: Partial<{ nome_sala: string, capacidade_maxima: number, idTipo_sala: number, local: string, recursos_especiais: string }>) {
    await this.getById(id);
    return prisma.sala.update({
      where: { id_salas: id },
      data
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.sala.delete({
      where: { id_salas: id }
    });
  }
}
