import { describe, expect, it } from 'vitest';
import xlsx from 'xlsx';
import { lerPlanilha } from './importacaoPlanilhaSchema.js';

describe('planilha de turmas', () => {
  it('aceita cabeçalhos sem distinção de acentos, espaços ou maiúsculas', () => {
    const csv = 'ID TURMA,CÓDIGO TURMA,CURSO,CARGA HORÁRIA,INSTRUTOR,SALA,LOCAL SALA,TURNO,DATA INÍCIO,ALUNOS\n' +
      ',2026.99.1,Curso A,800,,Laboratório 1,Polo Recanto das Emas,Tarde,16/11/2026,30';
    const resultado = lerPlanilha(Buffer.from(csv, 'utf8'));
    expect(resultado.erros).toEqual([]);
    expect(resultado.linhas[0]).toMatchObject({ linha: 2, codigo_turma: '2026.99.1', carga_horaria: 800, data_inicio: '2026-11-16', alunos: 30 });
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
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet([
      ['codigo_turma', 'curso', 'sala', 'local_sala', 'turno', 'data_inicio'],
      ['X', 'Curso', 'Sala 1', 'Unidade', 'Noite', '2026-11-16']
    ]), 'Turmas');
    const arquivo = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    expect(lerPlanilha(arquivo).linhas[0]).toMatchObject({ codigo_turma: 'X', data_inicio: '2026-11-16' });
  });
});
