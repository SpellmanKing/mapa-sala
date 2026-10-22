import { describe, expect, it } from 'vitest';
import xlsx from 'xlsx';
import {
  analisarPlanilha,
  lerPlanilha,
  normalizarData,
  normalizarDiasSemana,
  normalizarTurnoOuHorario
} from './importacaoPlanilhaSchema.js';

describe('planilha de turmas e detecção inteligente de colunas', () => {
  it('preserva data DD/MM/AAAA ambigua no CSV', () => {
    const csv = 'codigo_turma,curso,sala,local_sala,turno,data_inicio\nA,Curso,Sala,Local,Noite,03/01/2028';
    expect(lerPlanilha(Buffer.from(csv)).linhas[0]?.data_inicio).toBe('2028-01-03');
  });

  it('aceita cabeçalhos exatos do modelo sem distinção de acentos, espaços ou maiúsculas', () => {
    const csv =
      'ID TURMA,CÓDIGO TURMA,CURSO,CARGA HORÁRIA,INSTRUTOR,SALA,LOCAL SALA,TURNO,DATA INÍCIO,ALUNOS\n' +
      ',2026.99.1,Curso A,800,,Laboratório 1,Polo Recanto das Emas,Tarde,16/11/2026,30';
    const analise = analisarPlanilha(Buffer.from(csv, 'utf8'));
    expect(analise.pronto_para_simular).toBe(true);
    expect(analise.campos_obrigatorios_ausentes).toEqual([]);
    const resultado = lerPlanilha(Buffer.from(csv, 'utf8'));
    expect(resultado.erros).toEqual([]);
    expect(resultado.linhas[0]).toMatchObject({
      linha: 2,
      codigo_turma: '2026.99.1',
      carga_horaria: 800,
      data_inicio: '2026-11-16',
      alunos: 30
    });
  });

  it('detecta nomes de colunas diferentes, ordem trocada e colunas extras ignoradas', () => {
    const csv =
      'Observações,Período,Ambiente,Polo,Docente,Início das Aulas,Formação,Cód. Turma,Matriculados,CH,Status Interno\n' +
      'Prioridade,Noturno,Sala 1,Cep Talal Abu Allan,Ana Silva,20/11/2026,Técnico em Administração,2026.09.78,28,800,Ativa';
    const analise = analisarPlanilha(Buffer.from(csv, 'utf8'));
    expect(analise.pronto_para_simular).toBe(true);
    expect(analise.mapeamento_sugerido).toEqual({
      turno: 1,
      sala: 2,
      local_sala: 3,
      instrutor: 4,
      data_inicio: 5,
      curso: 6,
      codigo_turma: 7,
      alunos: 8,
      carga_horaria: 9
    });
    expect(analise.colunas_ignoradas.map(c => c.cabecalho)).toEqual(['Observações', 'Status Interno']);

    const lido = lerPlanilha(Buffer.from(csv, 'utf8'));
    expect(lido.erros).toEqual([]);
    expect(lido.linhas[0]).toMatchObject({
      codigo_turma: '2026.09.78',
      curso: 'Técnico em Administração',
      sala: 'Sala 1',
      local_sala: 'Cep Talal Abu Allan',
      instrutor: 'Ana Silva',
      turno: 'Noite',
      data_inicio: '2026-11-20',
      alunos: 28,
      carga_horaria: 800
    });
  });

  it('detecta cabeçalho após linhas de título e linhas vazias acima do cabeçalho', () => {
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.aoa_to_sheet([
        ['SENAC DF — Planejamento Acadêmico 2026'],
        ['Unidade Ceilândia'],
        [],
        ['Turma', 'Curso', 'Ambiente', 'Unidade', 'Período', 'Data de Início', 'Qtd Alunos'],
        ['2026.09.10', 'Cabeleireiro', 'Imagem - Cabelos', 'Cep Talal Abu Allan', 'Matutino', '18/11/2026', '18']
      ]),
      'Planejamento'
    );
    const arquivo = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const analise = analisarPlanilha(arquivo);
    expect(analise.linha_cabecalho).toBe(4);
    expect(analise.pronto_para_simular).toBe(true);

    const lido = lerPlanilha(arquivo);
    expect(lido.linhas[0]).toMatchObject({
      linha: 5,
      codigo_turma: '2026.09.10',
      turno: 'Manhã',
      data_inicio: '2026-11-18',
      alunos: 18
    });
  });

  it('detecta colunas pelo conteúdo quando a planilha não tem cabeçalho', () => {
    const csv =
      '2026.09.55,Técnico em Secretariado,800,Ricardo Araújo,Sala 1,Cep Talal Abu Allan,Vespertino,16/11/2026,25,Ter, Qui, Sáb\n' +
      '2026.09.82,Informática Windows e Office,100,Rildo Goncalves,Laboratório de TI 1,Cep Talal Abu Allan,Noturno,20/11/2026,22,"1,3,5"';
    const csvSemCabecalho =
      '2026.09.55,Técnico em Secretariado,800,Ricardo Araújo,Sala 1,Cep Talal Abu Allan,Vespertino,16/11/2026,25,"Ter, Qui, Sáb"\n' +
      '2026.09.82,Informática Windows e Office,100,Rildo Goncalves,Laboratório de TI 1,Cep Talal Abu Allan,Noturno,20/11/2026,22,"1,3,5"';
    const analise = analisarPlanilha(Buffer.from(csvSemCabecalho, 'utf8'));
    expect(analise.linha_cabecalho).toBeNull();
    expect(analise.campos_obrigatorios_ausentes).toEqual([]);

    const lido = lerPlanilha(Buffer.from(csvSemCabecalho, 'utf8'));
    expect(lido.erros).toEqual([]);
    expect(lido.linhas[0]).toMatchObject({
      linha: 1,
      codigo_turma: '2026.09.55',
      curso: 'Técnico em Secretariado',
      carga_horaria: 800,
      instrutor: 'Ricardo Araújo',
      sala: 'Sala 1',
      local_sala: 'Cep Talal Abu Allan',
      turno: 'Tarde',
      data_inicio: '2026-11-16',
      alunos: 25,
      dias_semana: ['2', '4', '6']
    });
    void csv;
  });

  it('normaliza sinônimos de turno e infere turno pelo horário inicial quando não há coluna de turno', () => {
    expect(normalizarTurnoOuHorario('Matutino')).toEqual({ turno: 'Manhã', inferido: false });
    expect(normalizarTurnoOuHorario('Vespertino')).toEqual({ turno: 'Tarde', inferido: false });
    expect(normalizarTurnoOuHorario('Noturno')).toEqual({ turno: 'Noite', inferido: false });
    expect(normalizarTurnoOuHorario('M')).toEqual({ turno: 'Manhã', inferido: false });
    expect(normalizarTurnoOuHorario('T')).toEqual({ turno: 'Tarde', inferido: false });
    expect(normalizarTurnoOuHorario('N')).toEqual({ turno: 'Noite', inferido: false });
    expect(normalizarTurnoOuHorario('08:00 às 12:00')).toEqual({ turno: 'Manhã', inferido: true });
    expect(normalizarTurnoOuHorario('14:00 às 18:00')).toEqual({ turno: 'Tarde', inferido: true });
    expect(normalizarTurnoOuHorario('19:00 às 22:00')).toEqual({ turno: 'Noite', inferido: true });

    const csvComHorario =
      'Turma,Curso,Sala,Horário,Início\n2026.09.108,Assistente de TI,Lab 1,14:00 às 18:00,16/11/2026';
    const lido = lerPlanilha(Buffer.from(csvComHorario, 'utf8'));
    expect(lido.linhas[0]).toMatchObject({
      codigo_turma: '2026.09.108',
      turno: 'Tarde',
      turno_inferido: true
    });
  });

  it('normaliza datas em vários formatos, inclusive número serial do Excel, e dias da semana', () => {
    // 46342 no Excel corresponde a 2026-11-16
    expect(normalizarData('46342')).toBe('2026-11-16');
    expect(normalizarData('16-11-2026')).toBe('2026-11-16');
    expect(normalizarData('16.11.2026')).toBe('2026-11-16');
    expect(normalizarData('2026/11/16')).toBe('2026-11-16');

    expect(normalizarDiasSemana('Ter, Qui, Sáb')).toEqual(['2', '4', '6']);
    expect(normalizarDiasSemana('2,4,6')).toEqual(['2', '4', '6']);
    expect(normalizarDiasSemana('seg a sex')).toEqual(['1', '2', '3', '4', '5']);
    expect(normalizarDiasSemana('Segunda a Sexta')).toEqual(['1', '2', '3', '4', '5']);

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.aoa_to_sheet([
        ['codigo_turma', 'curso', 'sala', 'turno', 'data_inicio', 'dias_semana'],
        ['2026.09.90', 'Curso Excel', 'Sala 1', 'Manhã', 46342, 'Ter, Qui, Sáb']
      ]),
      'Turmas'
    );
    const arquivo = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const lido = lerPlanilha(arquivo);
    expect(lido.linhas[0]).toMatchObject({
      codigo_turma: '2026.09.90',
      data_inicio: '2026-11-16',
      dias_semana: ['2', '4', '6']
    });
  });

  it('seleciona automaticamente a aba de maior pontuação quando há duas abas e permite escolher outra aba', () => {
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.aoa_to_sheet([
        ['Resumo Geral'],
        ['Total de cursos', '15']
      ]),
      'Capa'
    );
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.aoa_to_sheet([
        ['Turma', 'Curso', 'Ambiente', 'Turno', 'Data de Início'],
        ['2026.09.1', 'Técnico em Administração', 'Sala 1', 'Noite', '2026-11-16']
      ]),
      'Cronograma 2026'
    );
    const arquivo = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const analise = analisarPlanilha(arquivo);
    expect(analise.abas).toEqual(['Capa', 'Cronograma 2026']);
    expect(analise.aba_selecionada).toBe('Cronograma 2026');
    expect(analise.pronto_para_simular).toBe(true);

    const analiseCapa = analisarPlanilha(arquivo, { aba: 'Capa' });
    expect(analiseCapa.aba_selecionada).toBe('Capa');
    expect(analiseCapa.pronto_para_simular).toBe(false);
  });

  it('marca colunas como ambíguas quando há empate ou competição direta pelo mesmo campo', () => {
    const csv =
      'Turma,Curso,Ambiente Principal,Ambiente Reserva,Turno,Data Início\n' +
      '2026.09.1,Técnico em Administração,Sala 1,Sala 2,Manhã,16/11/2026';
    const analise = analisarPlanilha(Buffer.from(csv, 'utf8'));
    const colPrincipal = analise.colunas[2]!;
    const colReserva = analise.colunas[3]!;
    expect(colPrincipal.ambiguo || colReserva.ambiguo).toBe(true);
    expect(analise.pronto_para_simular).toBe(false);
  });

  it('informa erro por linha para data impossível e número inválido', () => {
    const csv = 'codigo_turma,curso,sala,local_sala,turno,data_inicio,alunos\nA,Curso,Sala,Local,Noite,31/02/2026,-1';
    const resultado = lerPlanilha(Buffer.from(csv));
    expect(resultado.linhas).toEqual([]);
    expect(resultado.erros[0]?.mensagem).toContain('Data de início inválida');
    expect(resultado.erros[0]?.mensagem).toContain('número inteiro positivo');
  });

  it('rejeita cabeçalho obrigatório ausente', () => {
    expect(() => lerPlanilha(Buffer.from('curso,sala\nA,B'))).toThrow('Colunas obrigatórias ausentes');
  });

  it('lê arquivo XLSX e data ISO sem depender de banco', () => {
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.aoa_to_sheet([
        ['codigo_turma', 'curso', 'sala', 'local_sala', 'turno', 'data_inicio'],
        ['X', 'Curso', 'Sala 1', 'Unidade', 'Noite', '2026-11-16']
      ]),
      'Turmas'
    );
    const arquivo = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    expect(lerPlanilha(arquivo).linhas[0]).toMatchObject({ codigo_turma: 'X', data_inicio: '2026-11-16' });
  });
});
