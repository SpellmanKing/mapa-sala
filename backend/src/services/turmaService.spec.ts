import { Prisma, type Curso, type Sala, type Turno, type Turma } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CURSO_ESPERADO_POR_CODIGO_DUPLICADO,
  calcularCronograma as calcularCronogramaSeedDemo,
  turmasFinais,
  verificarCodigoDuplicado
} from '../../prisma/seedDemo.js';
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

const { mockCalcularCronograma } = vi.hoisted(() => ({ mockCalcularCronograma: vi.fn() }));

vi.mock('./calculadoraService.js', () => ({
  CalculadoraService: class MockCalculadoraService {
    calcularCronograma = mockCalcularCronograma;
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 28, 12));
    vi.clearAllMocks();
    service = new TurmaService();
    mockCalcularCronograma.mockResolvedValue({
      dataTermino: '2026-03-03', diasCorridos: 2, totalAulas: 2,
      horasPorAula: 4, datasAulas: ['2026-03-02', '2026-03-03'], feriadosPulados: []
    });
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
  afterEach(() => vi.useRealTimers());

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

  it.each(['alocar', 'realocar', 'disponibilidade'])('usa o turno real na calculadora ao %s', async operacao => {
    vi.mocked(prisma.turno.findFirst).mockResolvedValue({ id_turno: 3, nome_turno: 'Noite' });
    const dados = { id_salas: 5, data_inicio: new Date('2026-03-02'), fk_id_turno: 3, dias_semana: ['1', '2'] };
    if (operacao === 'alocar') await service.alocarTurma({ ...dados, id_cursos: 1, total_alunos: 20 });
    if (operacao === 'realocar') await service.reallocarTurma(1, dados);
    if (operacao === 'disponibilidade') await service.getDisponibilidade({ ...dados, id_cursos: 1, total_alunos: 20 });
    expect(mockCalcularCronograma).toHaveBeenCalledWith(40, dados.data_inicio, dados.dias_semana, undefined, 'Noite');
  });

  it('consulta conflito de sala ou instrutor somente nas datas e no turno da turma', async () => {
    await service.alocarTurma({
      id_cursos: 1, id_salas: 5, data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1, total_alunos: 20, dias_semana: ['1', '2'], id_instrutores: 8
    });
    expect(prisma.agendamento.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        data_aula: { in: [new Date('2026-03-02'), new Date('2026-03-03')] },
        turma: { fk_id_turno: 1 },
        OR: [{ id_salas: 5 }, { turma: { id_instrutores: 8 } }]
      })
    }));
  });

  it('permite o mesmo instrutor e sala em outro turno na consulta de disponibilidade', async () => {
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([{
      ...conflito('instrutor'), id_salas: 5,
      turma: { ...conflito('instrutor').turma, fk_id_turno: 3 }
    }] as never);
    const resultado = await service.getDisponibilidade({
      id_cursos: 1, data_inicio: new Date('2026-03-02'),
      fk_id_turno: 1, total_alunos: 20, dias_semana: ['1', '2'], id_instrutores: 8
    });
    expect(resultado.salasLivres).toEqual([5]);
    expect(resultado.conflitoInstrutor).toBeNull();
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
    vi.mocked(prisma.agendamento.findMany).mockResolvedValueOnce([]);
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

    expect(prisma.agendamento.deleteMany).toHaveBeenCalledWith({ where: { id_turmas: 1, data_aula: { gte: new Date('2026-02-28') } } });
    expect(prisma.agendamento.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ id_turmas: 1, id_salas: 5 })
      ])
    });
  });

  it('preserva aulas passadas e recalcula somente as restantes a partir de hoje', async () => {
    vi.setSystemTime(new Date(2026, 2, 3, 12));
    vi.mocked(prisma.agendamento.findMany)
      .mockResolvedValueOnce([{ data_aula: new Date('2026-03-02') }] as never)
      .mockResolvedValueOnce([]);
    await service.reallocarTurma(1, {
      id_salas: 5, data_inicio: new Date('2026-03-02'), fk_id_turno: 1, dias_semana: ['1', '2']
    });
    expect(mockCalcularCronograma).toHaveBeenCalledWith(36, new Date('2026-03-03'), ['1', '2'], undefined, 'Manhã');
    expect(prisma.agendamento.deleteMany).toHaveBeenCalledWith({ where: { id_turmas: 1, data_aula: { gte: new Date('2026-03-03') } } });
    expect(prisma.turma.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ data_inicio: turma.data_inicio, fk_id_turno: 1 })
    }));
  });

  it('recusa mudar turno ou início de turma com histórico', async () => {
    vi.setSystemTime(new Date(2026, 2, 3, 12));
    vi.mocked(prisma.agendamento.findMany).mockResolvedValueOnce([{ data_aula: new Date('2026-03-02') }] as never);
    vi.mocked(prisma.turno.findFirst).mockResolvedValue({ id_turno: 3, nome_turno: 'Noite' });
    await expect(service.reallocarTurma(1, {
      id_salas: 5, data_inicio: new Date('2026-03-02'), fk_id_turno: 3, dias_semana: ['1', '2']
    })).rejects.toThrow('Turma iniciada não pode mudar de turno');
    expect(prisma.agendamento.deleteMany).not.toHaveBeenCalled();
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

  it('não gera falsos positivos de conflito de instrutor nas turmas de períodos sucessivos ou dias disjuntos do seed demo', () => {
    const cronogramaDe = (codigo: string) => {
      const item = turmasFinais.find(t => t.codigo_turma === codigo)!;
      const turnoNome = item.horario.includes('19:00') ? 'Noite' : item.horario.includes('08:00') ? 'Manhã' : 'Tarde';
      return new Set(
        calcularCronogramaSeedDemo(item.carga_horaria, new Date(item.data_inicio), item.dias_semana, [], turnoNome).datasAulas
      );
    };
    const intersecao = (a: string, b: string) => {
      const datasA = cronogramaDe(a);
      return [...cronogramaDe(b)].filter(d => datasA.has(d));
    };

    expect(intersecao('2026.29.15', '2026.29.17')).toEqual([]);
    expect(intersecao('2026.29.15', '2026.29.16')).toEqual([]);
    expect(intersecao('2026.09.82', '2026.09.103')).toEqual([]);
    expect(intersecao('2026.09.71', '2026.09.80')).toEqual([]);
    expect(intersecao('2025.09.121', '2026.09.65')).toEqual([]);

    expect(intersecao('2025.09.57', '2025.09.114').length).toBeGreaterThan(0);
    expect(intersecao('2025.09.126', '2026.09.77').length).toBeGreaterThan(0);
    expect(intersecao('2026.09.34', '2026.29.14').length).toBeGreaterThan(0);
  });

  it('seleciona a ocorrência cujo curso bate com o mapeamento explícito de códigos duplicados e mantém a primeira ocorrência para códigos fora do mapeamento', () => {
    expect(CURSO_ESPERADO_POR_CODIGO_DUPLICADO).toEqual({
      '2026.09.78': 'Técnico em Administração',
      '2025.09.55': 'Técnico em Secretariado'
    });

    const codigosVistos = new Set<string>();
    const ocorrencias78 = turmasFinais.filter(t => t.codigo_turma === '2026.09.78');
    const ocorrencias55 = turmasFinais.filter(t => t.codigo_turma === '2025.09.55');

    expect(ocorrencias78).toHaveLength(2);
    expect(verificarCodigoDuplicado(ocorrencias78[0]!, codigosVistos)).toEqual({
      aceita: false,
      motivo: 'Código duplicado: pertence a outra turma (Técnico em Administração); código correto desconhecido'
    });
    expect(verificarCodigoDuplicado(ocorrencias78[1]!, codigosVistos)).toEqual({ aceita: true });

    expect(ocorrencias55).toHaveLength(2);
    expect(verificarCodigoDuplicado(ocorrencias55[0]!, codigosVistos)).toEqual({
      aceita: false,
      motivo: 'Código duplicado: pertence a outra turma (Técnico em Secretariado); código correto desconhecido'
    });
    expect(verificarCodigoDuplicado(ocorrencias55[1]!, codigosVistos)).toEqual({ aceita: true });

    // Código fora do mapeamento mantém a primeira ocorrência
    expect(verificarCodigoDuplicado({ codigo_turma: '2099.01.99', nome_curso: 'Curso A' }, codigosVistos)).toEqual({
      aceita: true
    });
    expect(verificarCodigoDuplicado({ codigo_turma: '2099.01.99', nome_curso: 'Curso B' }, codigosVistos)).toEqual({
      aceita: false,
      motivo: 'Código de turma duplicado (mantida a primeira ocorrência)'
    });
  });
});
