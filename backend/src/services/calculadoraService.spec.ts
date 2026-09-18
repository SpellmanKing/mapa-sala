import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalculadoraService } from './calculadoraService.js';
import { prisma } from '../infrastructure/prismaClient.js';

vi.mock('../infrastructure/prismaClient.js', () => ({
  prisma: {
    feriadosRecessos: {
      findMany: vi.fn()
    }
  }
}));

describe('CalculadoraService', () => {
  let calculadoraService: CalculadoraService;

  beforeEach(() => {
    vi.clearAllMocks();
    calculadoraService = new CalculadoraService();
  });

  it('deve calcular corretamente o cronograma para curso de 20h (5 dias de 4h) sem feriados', async () => {
    vi.mocked(prisma.feriadosRecessos.findMany).mockResolvedValue([]);

    // 2026-03-02 é uma Segunda-feira (day 1)
    const resultado = await calculadoraService.calcularCronograma(
      20,
      '2026-03-02',
      ['1', '2', '3', '4', '5'],
      4
    );

    expect(resultado.totalAulas).toBe(5);
    expect(resultado.horasPorAula).toBe(4);
    expect(resultado.datasAulas).toHaveLength(5);
    expect(resultado.datasAulas[0]).toBe('2026-03-02'); // Segunda
    expect(resultado.datasAulas[1]).toBe('2026-03-03'); // Terça
    expect(resultado.datasAulas[2]).toBe('2026-03-04'); // Quarta
    expect(resultado.datasAulas[3]).toBe('2026-03-05'); // Quinta
    expect(resultado.datasAulas[4]).toBe('2026-03-06'); // Sexta
    expect(resultado.dataTermino).toBe('2026-03-06');
    expect(resultado.feriadosPulados).toHaveLength(0);
  });

  it('deve pular feriados nacionais e recessos estendendo o término da turma', async () => {
    vi.mocked(prisma.feriadosRecessos.findMany).mockResolvedValue([
      {
        id_feriado: 1,
        descricao: 'Tiradentes',
        data_feriado: new Date('2026-04-21T00:00:00.000Z'),
        tipoFeriado: { nome_tipo: 'Nacional' }
      } as any
    ]);

    // 2026-04-20 (Segunda), 2026-04-21 (Terça - Feriado), 2026-04-22 (Quarta)
    const resultado = await calculadoraService.calcularCronograma(
      8, // 2 aulas de 4h
      '2026-04-20',
      ['1', '2', '3', '4', '5'],
      4
    );

    expect(resultado.totalAulas).toBe(2);
    expect(resultado.datasAulas).toEqual(['2026-04-20', '2026-04-22']);
    expect(resultado.dataTermino).toBe('2026-04-22');
    expect(resultado.feriadosPulados).toHaveLength(1);
    expect(resultado.feriadosPulados[0]?.descricao).toBe('Tiradentes');
  });

  it('deve agendar corretamente para turmas com dias alternados (ex: Seg/Qua/Sex)', async () => {
    vi.mocked(prisma.feriadosRecessos.findMany).mockResolvedValue([]);

    // Início 2026-03-02 (Segunda), 3 aulas
    const resultado = await calculadoraService.calcularCronograma(
      12,
      '2026-03-02',
      ['1', '3', '5'], // Seg, Qua, Sex
      4
    );

    expect(resultado.totalAulas).toBe(3);
    expect(resultado.datasAulas).toEqual(['2026-03-02', '2026-03-04', '2026-03-06']);
    expect(resultado.dataTermino).toBe('2026-03-06');
  });

  it('deve arredondar para cima a quantidade de aulas necessárias se carga horária for fracionada', async () => {
    vi.mocked(prisma.feriadosRecessos.findMany).mockResolvedValue([]);

    // 15 horas / 4h por dia = 3.75 -> 4 aulas
    const resultado = await calculadoraService.calcularCronograma(
      15,
      '2026-03-02',
      ['1', '2', '3', '4', '5'],
      4
    );

    expect(resultado.totalAulas).toBe(4);
    expect(resultado.datasAulas).toHaveLength(4);
  });
});
