import { Prisma, type Curso, type Sala, type Turno, type Turma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import { TurmaService } from './turmaService.js';

vi.mock('../infrastructure/prismaClient.js', () => ({
  prisma: {
    curso: { findUnique: vi.fn() },
    sala: { findUnique: vi.fn(), findMany: vi.fn() },
    turno: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    statusTurma: { findFirst: vi.fn() },
    agendamento: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn()
    },
    turma: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(async (callback) => callback(prisma))
  }
}));

vi.mock('./calculadoraService.js', () => ({
  CalculadoraService: class MockCalculadoraService {
    calcularCronograma = vi.fn().mockResolvedValue({
      dataTermino: '2026-03-03',
      diasCorridos: 2,
      totalAulas: 2,
      horasPorAula: 4,
      datasAulas: ['2026-03-02', '2026-03-03'],
      feriadosPulados: []
    });
  }
}));

const curso: Curso = {
  id_cursos: 1,
  nome_curso: 'Informática Básica',
  segmento: 'Tecnologia',
  modalidade: 'Presencial',
  carga_horaria: 40,
  valor: new Prisma.Decimal(0),
  curso_tem: false,
  bolsa_compativel: true,
  idTipo_sala: null,
  unidade: null,
  codigo_turma_padrao: 'INF-01',
  turno_padrao: 'Manhã',
  dias_letivos_padrao: '1,2',
  dias_remotos_padrao: null,
  id_instrutor_padrao: null
};

const sala: Sala = {
  id_salas: 5,
  nome_sala: 'Lab 01',
  capacidade_maxima: 30,
  idTipo_sala: null,
  local: null,
  recursos_especiais: null
};

const turno: Turno = { id_turno: 1, nome_turno: 'Manhã' };

const turma: Turma = {
  id_turmas: 1,
  id_cursos: 1,
  id_instrutores: 8,
  codigo_turma: 'INF-01',
  fk_id_status: 1,
  fk_id_turno: 1,
  data_inicio: new Date('2026-03-02T00:00:00.000Z'),
  data_termino: new Date('2026-03-03T00:00:00.000Z'),
  total_alunos: 20,
  alunos_pagantes: 0,
  alunos_bolsistas: 0,
  observacoes: null,
  eh_hibrida: false,
  dias_semana: '1,2'
};

const conflito = (recurso: 'sala' | 'instrutor') => ({
  id_salas: recurso === 'sala' ? 5 : 9,
  id_turmas: 2,
  data_aula: new Date('2026-03-02T00:00:00.000Z'),
  sala: { nome_sala: recurso === 'sala' ? 'Lab 01' : 'Lab 02' },
  turma: {
    codigo_turma: 'OUTRA-TURMA',
    id_instrutores: recurso === 'instrutor' ? 8 : null,
    instrutor: recurso === 'instrutor' ? { nome_instrutor: 'Ana Souza' } : null
  }
});

describe('TurmaService - núcleo operacional', () => {
  let service: TurmaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TurmaService();
    vi.mocked(prisma.curso.findUnique).mockResolvedValue(curso);
    vi.mocked(prisma.sala.findUnique).mockResolvedValue(sala);
    vi.mocked(prisma.sala.findMany).mockResolvedValue([sala]);
    vi.mocked(prisma.turno.findFirst).mockResolvedValue(turno);
    vi.mocked(prisma.turno.findMany).mockResolvedValue([turno]);
    vi.mocked(prisma.statusTurma.findFirst).mockResolvedValue({
      id_status: 1,
      nome_status: 'Planejada'
    });
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([]);
    vi.mocked(prisma.turma.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.turma.count).mockResolvedValue(0);
    vi.mocked(prisma.turma.create).mockResolvedValue(turma);
    vi.mocked(prisma.turma.findUnique).mockResolvedValue({ ...turma, curso } as never);
    vi.mocked(prisma.turma.update).mockResolvedValue(turma);
    vi.mocked(prisma.agendamento.createMany).mockResolvedValue({ count: 2 });
    vi.mocked(prisma.agendamento.deleteMany).mockResolvedValue({ count: 2 });
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    vi.mocked(prisma.$transaction).mockImplementation(async callback => callback(prisma));
  });

  it('rejeita curso inexistente', async () => {
    vi.mocked(prisma.curso.findUnique).mockResolvedValue(null);

    await expect(service.alocarTurma({
      id_cursos: 999,
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      codigo_turma: 'TESTE',
      dias_semana: ['1', '2']
    })).rejects.toEqual(new HttpError(404, 'Curso não encontrado'));
  });

  it('classifica sala disponível e capacidade insuficiente separadamente', async () => {
    const pequena = { ...sala, id_salas: 6, nome_sala: 'Sala Pequena', capacidade_maxima: 10 };
    vi.mocked(prisma.sala.findMany).mockResolvedValue([sala, pequena]);

    const resultado = await service.getDisponibilidade({
      id_cursos: 1,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      dias_semana: ['1', '2']
    });

    expect(resultado.salasLivres).toEqual([5]);
    expect(resultado.salasCapacidadeInsuficiente).toEqual([
      { salaId: 6, nome: 'Sala Pequena', capacidade: 10 }
    ]);
  });

  it('rejeita alocação acima da capacidade da sala', async () => {
    await expect(service.alocarTurma({
      id_cursos: 1,
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 31,
      codigo_turma: 'TESTE',
      dias_semana: ['1', '2']
    })).rejects.toThrow('Capacidade física insuficiente');
  });

  it('classifica uma sala ocupada sem alegar falta de capacidade', async () => {
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([
      {
        ...conflito('sala'),
        turma: { ...conflito('sala').turma, fk_id_turno: 1 }
      }
    ] as never);

    const resultado = await service.getDisponibilidade({
      id_cursos: 1,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      dias_semana: ['1', '2']
    });

    expect(resultado.salasLivres).toEqual([]);
    expect(resultado.salasOcupadas[0]?.turmaCodigo).toBe('OUTRA-TURMA');
    expect(resultado.salasCapacidadeInsuficiente).toEqual([]);
  });

  it('rejeita criação com conflito de sala', async () => {
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([conflito('sala')] as never);

    await expect(service.alocarTurma({
      id_cursos: 1,
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      codigo_turma: 'TESTE',
      dias_semana: ['1', '2']
    })).rejects.toThrow('Conflito de sala: o ambiente Lab 01');
  });

  it('rejeita criação com conflito de instrutor', async () => {
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([conflito('instrutor')] as never);

    await expect(service.alocarTurma({
      id_cursos: 1,
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      codigo_turma: 'TESTE',
      dias_semana: ['1', '2'],
      id_instrutores: 8
    })).rejects.toThrow('Conflito de instrutor: Ana Souza');
  });

  it('cria a alocação quando sala e instrutor estão disponíveis', async () => {
    await service.alocarTurma({
      id_cursos: 1,
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      codigo_turma: 'TESTE',
      dias_semana: ['1', '2'],
      id_instrutores: 8
    });

    expect(prisma.agendamento.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          id_salas: 5
        })
      ])
    });
  });

  it('adquire locks PostgreSQL para serializar sala e instrutor antes de criar', async () => {
    await service.alocarTurma({
      id_cursos: 1,
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      codigo_turma: 'TESTE',
      dias_semana: ['1', '2'],
      id_instrutores: 8
    });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(prisma.agendamento.findMany).toHaveBeenCalled();
    expect(prisma.turma.create).toHaveBeenCalled();
  });

  it('rejeita realocação com conflito de instrutor', async () => {
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([conflito('instrutor')] as never);

    await expect(service.reallocarTurma(1, {
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      dias_semana: ['1', '2'],
      id_instrutores: 8
    })).rejects.toThrow('Conflito de instrutor: Ana Souza');
  });

  it('realoca quando os recursos estão disponíveis', async () => {
    await service.reallocarTurma(1, {
      id_salas: 5,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      dias_semana: ['1', '2'],
      id_instrutores: 8
    });

    expect(prisma.agendamento.deleteMany).toHaveBeenCalledWith({ where: { id_turmas: 1 } });
    expect(prisma.agendamento.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ id_turmas: 1, id_salas: 5 })
      ])
    });
  });

  it('propaga falha da consulta de disponibilidade', async () => {
    vi.mocked(prisma.agendamento.findMany).mockRejectedValueOnce(new Error('Banco indisponível'));

    await expect(service.getDisponibilidade({
      id_cursos: 1,
      data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1,
      total_alunos: 20,
      dias_semana: ['1', '2']
    })).rejects.toThrow('Banco indisponível');
  });
});
