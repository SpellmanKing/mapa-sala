import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';

export class FeriadoService {
  async getAll() {
    return prisma.feriadosRecessos.findMany({
      include: {
        tipoFeriado: true,
      }
    });
  }

  async getById(id: number) {
    const feriado = await prisma.feriadosRecessos.findUnique({
      where: { id_feriado: id },
      include: {
        tipoFeriado: true,
      }
    });
    if (!feriado) throw new HttpError(404, 'Feriado não encontrado');
    return feriado;
  }

  async create(data: { data_feriado: Date, descricao: string, fk_id_tipo_feriado: number }) {
    return prisma.feriadosRecessos.create({
      data: {
        ...data,
        data_feriado: new Date(data.data_feriado)
      }
    });
  }

  async update(id: number, data: Partial<{ data_feriado: Date, descricao: string, fk_id_tipo_feriado: number }>) {
    await this.getById(id);
    return prisma.feriadosRecessos.update({
      where: { id_feriado: id },
      data: {
        ...data,
        data_feriado: data.data_feriado ? new Date(data.data_feriado) : undefined
      }
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.feriadosRecessos.delete({
      where: { id_feriado: id }
    });
  }
}
