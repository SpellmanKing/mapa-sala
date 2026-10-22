import type { FeriadosRecessos, TipoFeriado } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FERIADOS_REFERENCIA } from '../../prisma/seedReferenceData.js';
import { prisma } from '../infrastructure/prismaClient.js';
import { FeriadoService } from './feriadoService.js';

vi.mock('../infrastructure/prismaClient.js', () => ({
  prisma: {
    tipoFeriado: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    feriadosRecessos: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}));

const tipo: TipoFeriado = { id_tipo_feriado: 1, nome_tipo: 'Feriado' };
const feriado: FeriadosRecessos = {
  id_feriado: 10,
  data_feriado: new Date('2026-09-07T00:00:00.000Z'),
  descricao: 'Independência do Brasil',
  fk_id_tipo_feriado: 1
};

describe('FeriadoService', () => {
  const service = new FeriadoService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.tipoFeriado.findUnique).mockResolvedValue(tipo);
    vi.mocked(prisma.feriadosRecessos.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.feriadosRecessos.findUnique).mockResolvedValue({
      ...feriado,
      tipoFeriado: tipo
    });
  });

  it('cria um feriado válido e retorna seu tipo', async () => {
    vi.mocked(prisma.feriadosRecessos.create).mockResolvedValue({
      ...feriado,
      tipoFeriado: tipo
    });

    const result = await service.create({
      data_feriado: new Date('2026-09-07T00:00:00.000Z'),
      descricao: feriado.descricao,
      fk_id_tipo_feriado: 1
    });

    expect(result).toMatchObject({ id_feriado: 10, tipoFeriado: tipo });
    expect(prisma.feriadosRecessos.create).toHaveBeenCalledWith(expect.objectContaining({
      include: { tipoFeriado: true }
    }));
  });

  it('impede duas exceções na mesma data', async () => {
    vi.mocked(prisma.feriadosRecessos.findFirst).mockResolvedValue(feriado);

    await expect(service.create({
      data_feriado: feriado.data_feriado,
      descricao: 'Outro recesso',
      fk_id_tipo_feriado: 1
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('edita um feriado existente', async () => {
    vi.mocked(prisma.feriadosRecessos.update).mockResolvedValue({
      ...feriado,
      descricao: 'Independência',
      tipoFeriado: tipo
    });

    const result = await service.update(10, { descricao: 'Independência' });

    expect(result.descricao).toBe('Independência');
    expect(prisma.feriadosRecessos.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id_feriado: 10 }
    }));
  });

  it('exclui um feriado existente', async () => {
    vi.mocked(prisma.feriadosRecessos.delete).mockResolvedValue(feriado);

    await expect(service.delete(10)).resolves.toEqual(feriado);
    expect(prisma.feriadosRecessos.delete).toHaveBeenCalledWith({ where: { id_feriado: 10 } });
  });

  it('mantém na carga de referência todos os feriados nacionais e distritais de 2025 a 2027 sem duplicatas', () => {
    expect(FERIADOS_REFERENCIA).toHaveLength(39);

    const datas = FERIADOS_REFERENCIA.map(f => f.data);
    expect(new Set(datas).size).toBe(FERIADOS_REFERENCIA.length);

    for (const ano of ['2025', '2026', '2027']) {
      const doAno = FERIADOS_REFERENCIA.filter(f => f.data.startsWith(`${ano}-`));
      expect(doAno).toHaveLength(13);
      expect(doAno.some(f => f.data === `${ano}-01-01`)).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-04-21` && f.descricao.includes('Brasília'))).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-05-01`)).toBe(true);
      expect(doAno.some(f => f.descricao === 'Corpus Christi')).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-09-07`)).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-10-12`)).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-11-02`)).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-11-15`)).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-11-20` && f.descricao.includes('Consciência Negra'))).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-11-30` && f.tipo === 'Distrital')).toBe(true);
      expect(doAno.some(f => f.data === `${ano}-12-25`)).toBe(true);
    }
  });
});
