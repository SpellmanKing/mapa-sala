import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../infrastructure/prismaClient.js';
import { SalaService } from './salaService.js';

vi.mock('../infrastructure/prismaClient.js', () => ({
  prisma: {
    sala: {
      findUnique: vi.fn(),
      delete: vi.fn()
    },
    agendamento: {
      findFirst: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe('SalaService.delete', () => {
  const service = new SalaService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.sala.findUnique).mockResolvedValue({ id_salas: 1 } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async callback => callback(prisma));
  });

  it('retorna conflito e não apaga a sala quando há vínculo', async () => {
    vi.mocked(prisma.agendamento.findFirst).mockResolvedValue({ id_agendamento: 10 } as never);

    await expect(service.delete(1)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Não é possível excluir a sala porque existem turmas ou agendamentos vinculados.'
    });
    expect(prisma.sala.delete).not.toHaveBeenCalled();
  });

  it('apaga a sala quando não há vínculo', async () => {
    vi.mocked(prisma.agendamento.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.sala.delete).mockResolvedValue({ id_salas: 1 } as never);

    await service.delete(1);

    expect(prisma.sala.delete).toHaveBeenCalledWith({ where: { id_salas: 1 } });
  });
});
