import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';

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

  async create(data: { nome_instrutor: string, segmento_principal?: string, habilidades_extras?: string }) {
    return prisma.instrutor.create({
      data
    });
  }

  async update(id: number, data: Partial<{ nome_instrutor: string, segmento_principal: string, habilidades_extras: string }>) {
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
