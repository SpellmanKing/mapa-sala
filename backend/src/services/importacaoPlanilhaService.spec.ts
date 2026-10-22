import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';
import { dataEfetiva, ImportacaoPlanilhaService } from './importacaoPlanilhaService.js';

const { calcular } = vi.hoisted(() => ({ calcular: vi.fn() }));
vi.mock('../infrastructure/prismaClient.js', () => ({ prisma: {
  $transaction: vi.fn(), $queryRaw: vi.fn(),
  curso: { findMany: vi.fn(), create: vi.fn() },
  sala: { findMany: vi.fn() }, instrutor: { findMany: vi.fn() }, turno: { findMany: vi.fn() },
  turma: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  agendamento: { findMany: vi.fn(), createMany: vi.fn(), updateMany: vi.fn() },
  statusTurma: { findFirst: vi.fn() }
} }));
vi.mock('./calculadoraService.js', () => ({ CalculadoraService: class { calcularCronograma = calcular; } }));

const data = (dia: string) => new Date(`${dia}T00:00:00.000Z`);
const turnoTarde = { id_turno: 2, nome_turno: 'Tarde' };
const curso = { id_cursos: 1, nome_curso: 'Curso B', carga_horaria: 12, dias_letivos_padrao: '1,2,3,4,5' };
const antiga = { id_agendamento: 1, id_turmas: 57, id_salas: 1, data_aula: data('2026-10-14') };
const futura = { id_agendamento: 2, id_turmas: 57, id_salas: 1, data_aula: data('2026-10-16') };
const turma = { id_turmas: 57, codigo_turma: 'B', id_cursos: 1, curso, turno: turnoTarde, fk_id_turno: 2, id_instrutores: 1, total_alunos: 20, data_inicio: data('2026-09-01'), dias_semana: '1,2,3,4,5', agendamentos: [antiga, futura] };
const csv = (linhas: string) => Buffer.from(`id_turma,codigo_turma,curso,carga_horaria,instrutor,sala,local_sala,turno,data_inicio,alunos\n${linhas}`);

describe('ImportacaoPlanilhaService (sem banco)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 12));
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async callback => callback(prisma as never));
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    vi.mocked(prisma.curso.findMany).mockResolvedValue([curso] as never);
    vi.mocked(prisma.sala.findMany).mockResolvedValue([
      { id_salas: 1, nome_sala: 'Lab 1', local: 'Recanto', capacidade_maxima: 30 },
      { id_salas: 2, nome_sala: 'Lab 2', local: 'Recanto', capacidade_maxima: 30 }
    ] as never);
    vi.mocked(prisma.instrutor.findMany).mockResolvedValue([{ id_instrutores: 1, nome_instrutor: 'Ana' }] as never);
    vi.mocked(prisma.turno.findMany).mockResolvedValue([{ id_turno: 1, nome_turno: 'Manhã' }, turnoTarde, { id_turno: 3, nome_turno: 'Noite' }] as never);
    vi.mocked(prisma.turma.findMany).mockResolvedValue([turma] as never);
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([{ ...futura, turma }] as never);
    vi.mocked(prisma.statusTurma.findFirst).mockResolvedValue({ id_status: 1 } as never);
    vi.mocked(prisma.curso.create).mockResolvedValue({ id_cursos: 2 } as never);
    vi.mocked(prisma.turma.create).mockResolvedValue({ id_turmas: 59 } as never);
    calcular.mockImplementation(async (carga: number) => ({ datasAulas: carga === 8 ? ['2026-10-16', '2026-10-19'] : ['2026-10-16', '2026-10-19', '2026-10-20'] }));
  });
  afterEach(() => vi.useRealTimers());

  it('nunca usa uma data anterior à data de corte', () => {
    expect(dataEfetiva(new Date(2026, 9, 14, 12))).toBe('2026-10-15');
    expect(dataEfetiva(new Date(2026, 9, 20, 12))).toBe('2026-10-20');
  });

  it('simula mudança de sala futura sem gravar e preserva a aula passada', async () => {
    const resultado = await new ImportacaoPlanilhaService().processar(csv('57,B,Curso B,,Ana,Lab 2,Recanto,Tarde,,20'), false);
    expect(resultado.linhas[0]).toMatchObject({ operacao: '2', criados: 0, alterados: 1, mantidos: 1 });
    expect(prisma.agendamento.updateMany).not.toHaveBeenCalled();
    expect(prisma.turma.update).not.toHaveBeenCalled();
  });

  it('confirma toda a planilha em uma transação, alterando apenas agendamentos de hoje em diante', async () => {
    const resultado = await new ImportacaoPlanilhaService().processar(csv('57,B,Curso B,,Ana,Lab 2,Recanto,Tarde,,20'), true);
    expect(resultado.linhas[0]?.operacao).toBe('2');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.agendamento.updateMany).toHaveBeenCalledWith({ where: { id_turmas: 57, data_aula: { gte: data('2026-10-15') } }, data: { id_salas: 2 } });
    expect(prisma.agendamento.deleteMany).toBeUndefined();
  });

  it('recusa alterar turno de turma com aulas futuras e não escreve nada', async () => {
    const arquivo = csv('57,B,Curso B,,Ana,Lab 2,Recanto,Noite,,20');
    const simulacao = await new ImportacaoPlanilhaService().processar(arquivo, false);
    expect(simulacao.linhas[0]?.mensagem).toContain('não muda de turno');
    await expect(new ImportacaoPlanilhaService().processar(arquivo, true)).rejects.toBeInstanceOf(HttpError);
    expect(prisma.agendamento.updateMany).not.toHaveBeenCalled();
  });

  it('lista os IDs quando o código da turma é ambíguo', async () => {
    vi.mocked(prisma.turma.findMany).mockResolvedValue([turma, { ...turma, id_turmas: 58 }] as never);
    const resultado = await new ImportacaoPlanilhaService().processar(csv(',B,Curso B,,Ana,Lab 2,Recanto,Tarde,,20'), false);
    expect(resultado.linhas[0]?.mensagem).toContain('57, 58');
  });

  it('cria turma nova com curso novo e calendário calculado; não cria sala ou instrutor', async () => {
    const arquivo = csv(',N,Curso Novo,8,,Lab 2,Recanto,Noite,16/10/2026,25');
    const resultado = await new ImportacaoPlanilhaService().processar(arquivo, true);
    expect(resultado.linhas[0]).toMatchObject({ operacao: '1', criados: 2 });
    expect(calcular).toHaveBeenCalledWith(8, '2026-10-16', ['1', '2', '3', '4', '5'], undefined, 'Noite');
    expect(prisma.curso.create).toHaveBeenCalledTimes(1);
    expect(prisma.turma.create).toHaveBeenCalledTimes(1);
    expect(prisma.agendamento.createMany).toHaveBeenCalledWith({ data: expect.arrayContaining([expect.objectContaining({ id_turmas: 59, id_salas: 2 })]) });
  });

  it('recompõe somente as aulas restantes da turma sem agendamentos futuros', async () => {
    vi.mocked(prisma.turma.findMany).mockResolvedValue([{ ...turma, agendamentos: [antiga] }] as never);
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([]);
    const resultado = await new ImportacaoPlanilhaService().processar(csv('57,B,Curso B,,Ana,Lab 2,Recanto,Noite,,20'), true);
    expect(resultado.linhas[0]).toMatchObject({ operacao: '3', criados: 3, mantidos: 1 });
    expect(calcular).toHaveBeenCalledWith(9, '2026-10-15', ['1', '2', '3', '4', '5'], undefined, 'Noite');
    expect(prisma.agendamento.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.agendamento.updateMany).not.toHaveBeenCalled();
  });

  it('sinaliza turma concluída sem criar novas aulas', async () => {
    const passadas = [1, 2, 3].map(id => ({ ...antiga, id_agendamento: id }));
    vi.mocked(prisma.turma.findMany).mockResolvedValue([{ ...turma, agendamentos: passadas }] as never);
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([]);
    const resultado = await new ImportacaoPlanilhaService().processar(csv('57,B,Curso B,,Ana,Lab 2,Recanto,Tarde,,20'), true);
    expect(resultado.linhas[0]).toMatchObject({ operacao: 'AVISO', criados: 0, mantidos: 3 });
    expect(prisma.turma.update).not.toHaveBeenCalled();
    expect(prisma.agendamento.createMany).not.toHaveBeenCalled();
  });

  it('detecta conflito de sala entre linhas e impede confirmar toda a planilha', async () => {
    const arquivo = csv(',N1,Curso Novo,8,,Lab 2,Recanto,Noite,16/10/2026,20\n,N2,Curso Novo,8,,Lab 2,Recanto,Noite,16/10/2026,20');
    const simulacao = await new ImportacaoPlanilhaService().processar(arquivo, false);
    expect(simulacao.linhas.map(linha => linha.operacao)).toEqual(['ERRO', 'ERRO']);
    await expect(new ImportacaoPlanilhaService().processar(arquivo, true)).rejects.toThrow('nenhuma linha foi aplicada');
    expect(prisma.curso.create).not.toHaveBeenCalled();
    expect(prisma.turma.create).not.toHaveBeenCalled();
  });

  it('detecta conflito de instrutor no mesmo turno, mas não em turno diferente', async () => {
    vi.mocked(prisma.agendamento.findMany).mockResolvedValue([{ ...futura, id_salas: 1, turma: { ...turma, id_turmas: 99, id_instrutores: 1, fk_id_turno: 2 } }] as never);
    const service = new ImportacaoPlanilhaService();
    const tarde = await service.processar(csv(',N,Curso Novo,8,Ana,Lab 2,Recanto,Tarde,16/10/2026,20'), false);
    const noite = await service.processar(csv(',N,Curso Novo,8,Ana,Lab 2,Recanto,Noite,16/10/2026,20'), false);
    expect(tarde.linhas[0]?.operacao).toBe('ERRO');
    expect(noite.linhas[0]?.operacao).toBe('1');
  });
});
