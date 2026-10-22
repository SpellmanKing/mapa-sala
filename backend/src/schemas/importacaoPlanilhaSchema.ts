import xlsx from 'xlsx';
import { z } from 'zod';
import { COLUNAS_IMPORTACAO, COLUNAS_OBRIGATORIAS } from '../config/importacaoPlanilha.js';
import { HttpError } from '../utils/errors.js';

const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const apelidos = new Map<string, keyof typeof COLUNAS_IMPORTACAO>(
  Object.entries(COLUNAS_IMPORTACAO).flatMap(([coluna, nomes]) => nomes.map(nome => [normalizar(nome), coluna as keyof typeof COLUNAS_IMPORTACAO]))
);

const dataSchema = z.string().transform((valor, ctx) => {
  if (!valor) return undefined;
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  const iso = partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : valor;
  const data = new Date(`${iso}T12:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== iso) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data de início inválida' });
    return z.NEVER;
  }
  return iso;
});

const numeroOpcional = z.string().transform((valor, ctx) => {
  if (!valor) return undefined;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe um número inteiro positivo' });
    return z.NEVER;
  }
  return numero;
});

const linhaSchema = z.object({
  id_turma: numeroOpcional,
  codigo_turma: z.string().min(1, 'Código da turma obrigatório'),
  curso: z.string().min(1, 'Curso obrigatório'),
  carga_horaria: numeroOpcional,
  instrutor: z.string(),
  sala: z.string().min(1, 'Sala obrigatória'),
  local_sala: z.string().min(1, 'Local da sala obrigatório'),
  turno: z.enum(['Manhã', 'Tarde', 'Noite']),
  data_inicio: dataSchema,
  alunos: numeroOpcional
});

export type LinhaImportacao = z.infer<typeof linhaSchema> & { linha: number };
export type ErroLinha = { linha: number; codigo_turma: string; operacao: 'ERRO'; mensagem: string; criados: 0; alterados: 0; mantidos: 0 };

export function lerPlanilha(arquivo: Buffer): { linhas: LinhaImportacao[]; erros: ErroLinha[] } {
  let tabela: unknown[][];
  try {
    const workbook = arquivo.subarray(0, 2).toString() === 'PK'
      ? xlsx.read(arquivo, { type: 'buffer' })
      : xlsx.read(arquivo.toString('utf8').replace(/^\uFEFF/, ''), { type: 'string', raw: true });
    const folha = workbook.Sheets[workbook.SheetNames[0] ?? ''];
    if (!folha) throw new Error('Planilha vazia');
    tabela = xlsx.utils.sheet_to_json<unknown[]>(folha, { header: 1, raw: false, defval: '' });
  } catch {
    throw new HttpError(400, 'Arquivo inválido: envie CSV ou XLSX legível.');
  }
  if (tabela.length < 2) throw new HttpError(400, 'A planilha precisa ter cabeçalho e pelo menos uma linha.');
  const indices = new Map<keyof typeof COLUNAS_IMPORTACAO, number>();
  for (const [indice, cabecalho] of (tabela[0] ?? []).entries()) {
    const coluna = apelidos.get(normalizar(String(cabecalho ?? '')));
    if (!coluna) continue;
    if (indices.has(coluna)) throw new HttpError(400, `Cabeçalho duplicado: ${coluna}.`);
    indices.set(coluna, indice);
  }
  const ausentes = COLUNAS_OBRIGATORIAS.filter(coluna => !indices.has(coluna));
  if (ausentes.length) throw new HttpError(400, `Colunas obrigatórias ausentes: ${ausentes.join(', ')}.`);

  const linhas: LinhaImportacao[] = [];
  const erros: ErroLinha[] = [];
  tabela.slice(1).forEach((celulas, indice) => {
    if (!celulas.some(celula => String(celula ?? '').trim())) return;
    const bruto = Object.fromEntries(Object.keys(COLUNAS_IMPORTACAO).map(coluna => [coluna, String(celulas[indices.get(coluna as keyof typeof COLUNAS_IMPORTACAO) ?? -1] ?? '').trim()]));
    const parsed = linhaSchema.safeParse(bruto);
    if (parsed.success) linhas.push({ ...parsed.data, linha: indice + 2 });
    else erros.push({ linha: indice + 2, codigo_turma: bruto.codigo_turma ?? '', operacao: 'ERRO', mensagem: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '), criados: 0, alterados: 0, mantidos: 0 });
  });
  if (!linhas.length && !erros.length) throw new HttpError(400, 'A planilha não contém turmas.');
  return { linhas, erros };
}
