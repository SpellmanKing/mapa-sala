import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalculadoraService } from './calculadoraService.js';
import { prisma } from '../infrastructure/prismaClient.js';

// Mock do prisma client para testes unitários independentes do banco
vi.mock('../infrastructure/prismaClient.js', () => ({
  prisma: {
    feriadosRecessos: {
      findMany: vi.fn(),
    },
  },
}));

describe('CalculadoraService', () => {
  let calculadora: CalculadoraService;

  beforeEach(() => {
    vi.clearAllMocks();
    calculadora = new CalculadoraService();
  });

  it('deve calcular corretamente um cronograma simples de 5 dias úteis sem feriados', async () => {
    // Mock sem feriados
    vi.mocked(prisma.feriadosRecessos.findMany).mockResolvedValueOnce([]);

    // 20 horas / 4 horas por dia = 5 aulas (Segunda a Sexta)
    // 2026-03-02 é uma segunda-feira
    const resultado = await calculadora.calcularCronograma(
      20,
      '2026-03-02',
      ['1', '2', '3', '4', '5'],
      4
    );

    expect(resultado.totalAulas).toBe(5);
    expect(resultado.datasAulas).toHaveLength(5);
    expect(resultado.datasAulas[0]).toBe('2026-03-02'); // Seg
    expect(resultado.datasAulas[1]).toBe('2026-03-03'); // Ter
    expect(resultado.datasAulas[2]).toBe('2026-03-04'); // Qua
    expect(resultado.datasAulas[3]).toBe('2026-03-05'); // Qui
    expect(resultado.datasAulas[4]).toBe('2026-03-06'); // Sex
    expect(resultado.dataTermino).toBe('2026-03-06');
    expect(resultado.feriadosPulados).toHaveLength(0);
  });

  it('deve pular finais de semana quando os dias selecionados forem de segunda a sexta', async () => {
    vi.mocked(prisma.feriadosRecessos.findMany).mockResolvedValueOnce([]);

    // 24 horas / 4h = 6 aulas. Começa numa quinta 2026-03-05
    // Aulas esperadas: Qui (05), Sex (06), pula Sáb(07) e Dom(08), Seg (09), Ter (10), Qua (11), Qui (12)
    const resultado = await calculadora.calcularCronograma(
      24,
      '2026-03-05',
      ['1', '2', '3', '4', '5'],
      4
    );

    expect(resultado.totalAulas).toBe(6);
    expect(resultado.datasAulas).toEqual([
      '2026-03-05',
      '2026-03-06',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-12'
    ]);
    expect(resultado.dataTermino).toBe('2026-03-12');
  });

  it('deve pular feriados de 2026 e abater corretamente no cronograma', async () => {
    // Mock com o feriado de Tiradentes (2026-04-21, terça-feira)
    vi.mocked(prisma.feriadosRecessos.findMany).mockResolvedValueOnce([
      {
        id_feriado: 1,
        data_feriado: new Date('2026-04-21T00:00:00.000Z'),
        descricao: 'Tiradentes / Fundação de Brasília',
        fk_id_tipo_feriado: 1,
        tipoFeriado: { id_tipo_feriado: 1, nome_tipo: 'Nacional' }
      } as any
    ]);

    // 16 horas / 4h = 4 aulas. Começa numa segunda 2026-04-20
    // Seg (20), Ter (21 - Feriado, pula!), Qua (22), Qui (23), Sex (24)
    const resultado = await calculadora.calcularCronograma(
      16,
      '2026-04-20',
      ['1', '2', '3', '4', '5'],
      4
    );

    expect(resultado.totalAulas).toBe(4);
    expect(resultado.datasAulas).toEqual([
      '2026-04-20',
      '2026-04-22',
      '2026-04-23',
      '2026-04-24'
    ]);
    expect(resultado.feriadosPulados).toHaveLength(1);
    expect(resultado.feriadosPulados[0]?.data).toBe('2026-04-21');
    expect(resultado.feriadosPulados[0]?.descricao).toBe('Tiradentes / Fundação de Brasília');
    expect(resultado.dataTermino).toBe('2026-04-24');
  });
});
