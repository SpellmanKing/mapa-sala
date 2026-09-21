import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurmaService } from './turmaService.js';
import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../infrastructure/prismaClient.js', () => ({
  prisma: {
    curso: {
      findUnique: vi.fn()
    },
    sala: {
      findUnique: vi.fn()
    },
    turno: {
      findFirst: vi.fn(),
      findUnique: vi.fn()
    },
    agendamento: {
      findFirst: vi.fn(),
      createMany: vi.fn()
    },
    turma: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn()
    },
    $transaction: vi.fn(async (cb) => cb(prisma))
  }
}));

vi.mock('./calculadoraService.js', () => {
  return {
    CalculadoraService: class MockCalculadoraService {
      calcularCronograma = vi.fn().mockResolvedValue({
        dataTermino: '2026-03-10',
        diasCorridos: 9,
        totalAulas: 2,
        horasPorAula: 4,
        datasAulas: ['2026-03-02', '2026-03-03'],
        feriadosPulados: []
      });
    }
  };
});

describe('TurmaService - Regras de Negócio e Validações', () => {
  let turmaService: TurmaService;

  beforeEach(() => {
    vi.clearAllMocks();
    turmaService = new TurmaService();
  });

  it('deve lançar HttpError 404 se o curso não existir', async () => {
    vi.mocked(prisma.curso.findUnique).mockResolvedValue(null);

    await expect(
      turmaService.alocarTurma({
        id_cursos: 999,
        id_salas: 1,
        data_inicio: new Date('2026-03-02'),
        fk_id_turno: 1,
        total_alunos: 20,
        codigo_turma: 'TURMA-TESTE',
        dias_semana: ['1', '2']
      })
    ).rejects.toThrow(new HttpError(404, 'Curso não encontrado'));
  });

  it('deve lançar HttpError 400 se o total de alunos for superior à capacidade máxima da sala', async () => {
    vi.mocked(prisma.curso.findUnique).mockResolvedValue({
      id_cursos: 1,
      nome_curso: 'Informática Básica',
      carga_horaria: 40,
      codigo_turma_padrao: 'INF-01'
    } as any);

    vi.mocked(prisma.sala.findUnique).mockResolvedValue({
      id_salas: 5,
      nome_sala: 'Lab 01',
      capacidade_maxima: 25 // Capacidade 25
    } as any);

    // Tentativa de alocar 35 alunos
    await expect(
      turmaService.alocarTurma({
        id_cursos: 1,
        id_salas: 5,
        data_inicio: new Date('2026-03-02'),
        fk_id_turno: 1,
        total_alunos: 35,
        codigo_turma: 'TURMA-TESTE',
        dias_semana: ['1', '2']
      })
    ).rejects.toThrow(/Capacidade física insuficiente/);
  });

  it('deve lançar HttpError 409 quando houver conflito de horário no mesmo turno e sala', async () => {
    vi.mocked(prisma.curso.findUnique).mockResolvedValue({
      id_cursos: 1,
      nome_curso: 'Informática Básica',
      carga_horaria: 40,
      codigo_turma_padrao: 'INF-01'
    } as any);

    vi.mocked(prisma.sala.findUnique).mockResolvedValue({
      id_salas: 5,
      nome_sala: 'Lab 01',
      capacidade_maxima: 30
    } as any);

    vi.mocked(prisma.turno.findFirst).mockResolvedValue({
      id_turno: 1,
      nome_turno: 'Manhã'
    } as any);

    // Simulando conflito existente
    vi.mocked(prisma.agendamento.findFirst).mockResolvedValue({
      id_agendamento: 10,
      id_salas: 5,
      data_aula: new Date('2026-03-02T00:00:00.000Z'),
      sala: { nome_sala: 'Lab 01' }
    } as any);

    await expect(
      turmaService.alocarTurma({
        id_cursos: 1,
        id_salas: 5,
        data_inicio: new Date('2026-03-02'),
        fk_id_turno: 1,
        total_alunos: 20,
        codigo_turma: 'TURMA-TESTE',
        dias_semana: ['1', '2']
      })
    ).rejects.toThrow(/Conflito: O ambiente Lab 01 já está ocupado/);
  });
});
