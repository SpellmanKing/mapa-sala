import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

export class FeriadoService {
  async getAll() {
    return prisma.feriadosRecessos.findMany({
      include: {
        tipoFeriado: true,
      },
      orderBy: { data_feriado: 'asc' }
    });
  }

  async getTypes() {
    return prisma.tipoFeriado.findMany({ orderBy: { nome_tipo: 'asc' } });
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

  private async validateReferences(data: {
    data_feriado?: Date;
    fk_id_tipo_feriado?: number;
  }, ignoreId?: number) {
    if (data.fk_id_tipo_feriado) {
      const type = await prisma.tipoFeriado.findUnique({
        where: { id_tipo_feriado: data.fk_id_tipo_feriado }
      });
      if (!type) throw new HttpError(400, 'Tipo de feriado inválido');
    }

    if (data.data_feriado) {
      const start = new Date(data.data_feriado);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      const duplicate = await prisma.feriadosRecessos.findFirst({
        where: {
          data_feriado: { gte: start, lt: end },
          ...(ignoreId ? { id_feriado: { not: ignoreId } } : {})
        }
      });
      if (duplicate) throw new HttpError(409, 'Já existe um feriado ou recesso cadastrado nesta data');
    }
  }

  async create(data: Prisma.FeriadosRecessosUncheckedCreateInput) {
    const normalized = { ...data, data_feriado: new Date(data.data_feriado) };
    await this.validateReferences(normalized);
    return prisma.feriadosRecessos.create({
      data: normalized,
      include: { tipoFeriado: true }
    });
  }

  async update(id: number, data: Prisma.FeriadosRecessosUncheckedUpdateInput) {
    await this.getById(id);
    await this.validateReferences({
      data_feriado: data.data_feriado instanceof Date ? data.data_feriado : undefined,
      fk_id_tipo_feriado: typeof data.fk_id_tipo_feriado === 'number' ? data.fk_id_tipo_feriado : undefined
    }, id);
    return prisma.feriadosRecessos.update({
      where: { id_feriado: id },
      data,
      include: { tipoFeriado: true }
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.feriadosRecessos.delete({
      where: { id_feriado: id }
    });
  }
}
