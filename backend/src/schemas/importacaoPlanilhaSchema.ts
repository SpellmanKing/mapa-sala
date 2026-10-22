import xlsx from 'xlsx';
import { z } from 'zod';
import {
  APELIDOS_HORARIO_TURNO,
  COLUNAS_IMPORTACAO,
  COLUNAS_OBRIGATORIAS,
  LIMIAR_ALTA_CONFIANCA,
  LIMIAR_MINIMO_DETECCAO,
  MARGEM_AMBIGUIDADE,
  type CampoImportacao
} from '../config/importacaoPlanilha.js';
import { HttpError } from '../utils/errors.js';

export type MapeamentoColunas = Partial<Record<CampoImportacao, number | null>>;

export type OpcoesLeituraPlanilha = {
  aba?: string;
  linha_cabecalho?: number | null;
  mapeamento?: MapeamentoColunas;
};

export type CatalogoImportacao = {
  cursos?: Array<{ nome_curso: string }>;
  salas?: Array<{ nome_sala: string; local?: string | null }>;
  instrutores?: Array<{ nome_instrutor: string }>;
};

export type AlternativaCampo = {
  campo: CampoImportacao;
  confianca: number;
};

export type AnaliseColuna = {
  indice: number;
  cabecalho: string;
  campo_sugerido: CampoImportacao | null;
  confianca: number;
  ambiguo: boolean;
  exemplos: string[];
  alternativas: AlternativaCampo[];
};

export type ColunaIgnorada = {
  indice: number;
  cabecalho: string;
  exemplos: string[];
};

export type AnalisePlanilha = {
  abas: string[];
  aba_selecionada: string;
  linha_cabecalho: number | null;
  colunas: AnaliseColuna[];
  campos_obrigatorios_ausentes: CampoImportacao[];
  colunas_ignoradas: ColunaIgnorada[];
  mapeamento_sugerido: Partial<Record<CampoImportacao, number>>;
  assinatura_cabecalhos: string;
  pronto_para_simular: boolean;
};

const TODOS_OS_CAMPOS = Object.keys(COLUNAS_IMPORTACAO) as CampoImportacao[];

export const normalizarChave = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const normalizarTexto = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const apelidosExatos = new Map<string, CampoImportacao>(
  Object.entries(COLUNAS_IMPORTACAO).flatMap(([coluna, nomes]) =>
    nomes.map(nome => [normalizarChave(nome), coluna as CampoImportacao])
  )
);

const apelidosHorarioSet = new Set(APELIDOS_HORARIO_TURNO.map(normalizarChave));

function diceBigrams(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) ?? 0) + 1);
  }
  let intersecao = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const qtd = bigramsA.get(bg) ?? 0;
    if (qtd > 0) {
      bigramsA.set(bg, qtd - 1);
      intersecao++;
    }
  }
  return (2 * intersecao) / (a.length - 1 + (b.length - 1));
}

export function calcularSimilaridade(a: string, b: string): number {
  const chaveA = normalizarChave(a);
  const chaveB = normalizarChave(b);
  if (!chaveA || !chaveB) return 0;
  if (chaveA === chaveB) return 1;

  const textoA = normalizarTexto(a);
  const textoB = normalizarTexto(b);
  const tokensA = textoA.split(' ').filter(Boolean);
  const tokensB = textoB.split(' ').filter(Boolean);

  const dice = diceBigrams(chaveA, chaveB);
  const comuns = tokensA.filter(t =>
    tokensB.some(tb => tb === t || (t.length >= 4 && tb.length >= 4 && (tb.startsWith(t) || t.startsWith(tb))))
  ).length;
  const tokenScore = tokensA.length && tokensB.length ? (2 * comuns) / (tokensA.length + tokensB.length) : 0;

  return Math.max(dice, tokenScore * 0.92);
}

export function sugerirMaisParecido(valorBuscado: string, candidatos: string[], limiar = 0.45): string | null {
  const alvo = valorBuscado.trim();
  if (!alvo || !candidatos.length) return null;
  const unicos = [...new Set(candidatos.map(c => c.trim()).filter(Boolean))];
  let melhor: string | null = null;
  let maiorScore = 0;
  for (const candidato of unicos) {
    const score = calcularSimilaridade(alvo, candidato);
    if (score > maiorScore) {
      maiorScore = score;
      melhor = candidato;
    }
  }
  return maiorScore >= limiar ? melhor : null;
}

function validarIsoCalendario(iso: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const data = new Date(`${iso}T12:00:00.000Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== iso) return null;
  const ano = Number(iso.slice(0, 4));
  if (ano < 1990 || ano > 2100) return null;
  return iso;
}

export function normalizarData(valor: string): string | null {
  const limpo = valor.trim();
  if (!limpo) return null;

  // Número serial do Excel (ex.: 46090 -> 2026-03-09)
  if (/^\d{5}(?:\.\d+)?$/.test(limpo)) {
    const serial = Math.floor(Number(limpo));
    if (serial >= 32874 && serial <= 73415) {
      const parsed = xlsx.SSF.parse_date_code(serial);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const iso = `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        return validarIsoCalendario(iso);
      }
    }
  }

  // DD/MM/AAAA, DD-MM-AAAA, DD.MM.AAAA ou DD/MM/AA
  const brMatch = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})(?:\s+.*)?$/.exec(limpo);
  if (brMatch) {
    const dia = brMatch[1]!.padStart(2, '0');
    const mes = brMatch[2]!.padStart(2, '0');
    const anoBruto = brMatch[3]!;
    const ano = anoBruto.length === 2 ? `20${anoBruto}` : anoBruto;
    return validarIsoCalendario(`${ano}-${mes}-${dia}`);
  }

  // AAAA-MM-DD, AAAA/MM/DD, AAAA.MM.DD (com ou sem sufixo de hora ISO)
  const isoMatch = /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:[T\s].*)?$/.exec(limpo);
  if (isoMatch) {
    const ano = isoMatch[1]!;
    const mes = isoMatch[2]!.padStart(2, '0');
    const dia = isoMatch[3]!.padStart(2, '0');
    return validarIsoCalendario(`${ano}-${mes}-${dia}`);
  }

  return null;
}

const SINONIMOS_MANHA = new Set(['manha', 'matutino', 'mat', 'm', 'turnomanha', 'periodomanha']);
const SINONIMOS_TARDE = new Set(['tarde', 'vespertino', 'vesp', 't', 'turnotarde', 'periodotarde']);
const SINONIMOS_NOITE = new Set(['noite', 'noturno', 'not', 'n', 'turnonoite', 'periodonoite']);

export function normalizarTurnoOuHorario(
  valor: string
): { turno: 'Manhã' | 'Tarde' | 'Noite'; inferido: boolean } | null {
  const limpo = valor.trim();
  if (!limpo) return null;

  const chave = normalizarChave(limpo);
  if (SINONIMOS_MANHA.has(chave)) return { turno: 'Manhã', inferido: false };
  if (SINONIMOS_TARDE.has(chave)) return { turno: 'Tarde', inferido: false };
  if (SINONIMOS_NOITE.has(chave)) return { turno: 'Noite', inferido: false };

  // Evita confundir datas com horários
  if (normalizarData(limpo) !== null) return null;

  // Exige indicador de horário (: ou h ou separador de faixa como "às", "as", "-", "até")
  const temIndicadorHora = /[:h]|\b(?:[aà]s?|ate|até)\b|-|~/i.test(limpo);
  if (!temIndicadorHora) return null;

  const match = /^(?:das\s+)?(\d{1,2})(?:[:h](\d{2}))?(?:\s*(?:[aà]s?|-|ate|até|~)\s*(\d{1,2})(?:[:h](\d{2}))?)?\s*(?:h|hs|horas)?$/i.exec(
    limpo
  );
  if (!match) return null;

  const horaInicial = Number(match[1]);
  const minInicial = Number(match[2] ?? '0');
  const horaFinal = match[3] != null ? Number(match[3]) : null;
  const minFinal = Number(match[4] ?? '0');

  if (horaInicial < 0 || horaInicial > 23 || minInicial < 0 || minInicial > 59) return null;
  if (horaFinal != null && (horaFinal < 0 || horaFinal > 23 || minFinal < 0 || minFinal > 59)) return null;

  if (horaInicial < 12) return { turno: 'Manhã', inferido: true };
  if (horaInicial < 18) return { turno: 'Tarde', inferido: true };
  return { turno: 'Noite', inferido: true };
}

const MAPA_DIAS: Record<string, number> = {
  '0': 0,
  dom: 0,
  domingo: 0,
  '1': 1,
  seg: 1,
  segunda: 1,
  segundafeira: 1,
  '2a': 1,
  '2afeira': 1,
  '2': 2,
  ter: 2,
  terca: 2,
  tercafeira: 2,
  '3a': 2,
  '3afeira': 2,
  '3': 3,
  qua: 3,
  quarta: 3,
  quartafeira: 3,
  '4a': 3,
  '4afeira': 3,
  '4': 4,
  qui: 4,
  quinta: 4,
  quintafeira: 4,
  '5a': 4,
  '5afeira': 4,
  '5': 5,
  sex: 5,
  sexta: 5,
  sextafeira: 5,
  '6a': 5,
  '6afeira': 5,
  '6': 6,
  sab: 6,
  sabado: 6
};

export function normalizarDiasSemana(valor: string): string[] | null {
  const limpo = valor.trim();
  if (!limpo) return null;

  const semAcento = limpo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/-feira/g, '')
    .replace(/ª/g, 'a')
    .trim();

  // Intervalo tipo "seg a sex", "segunda a sexta", "1 a 5", "ter - qui"
  const rangeMatch = /^([a-z0-9]+)\s*(?:a|ate|-|~)\s*([a-z0-9]+)$/.exec(semAcento);
  if (rangeMatch) {
    const ini = MAPA_DIAS[normalizarChave(rangeMatch[1]!)];
    const fim = MAPA_DIAS[normalizarChave(rangeMatch[2]!)];
    if (ini != null && fim != null && ini <= fim) {
      return Array.from({ length: fim - ini + 1 }, (_, i) => String(ini + i));
    }
  }

  const partes = semAcento
    .split(/[,;/|+\s]+/)
    .map(p => normalizarChave(p))
    .filter(p => p && p !== 'e');

  if (!partes.length) return null;
  const dias: string[] = [];
  for (const parte of partes) {
    const dia = MAPA_DIAS[parte];
    if (dia == null) return null;
    const diaStr = String(dia);
    if (!dias.includes(diaStr)) dias.push(diaStr);
  }
  return dias.length ? dias : null;
}

function pontuarCabecalhoPorCampo(cabecalhoBruto: string): Record<CampoImportacao, number> {
  const scores = Object.fromEntries(TODOS_OS_CAMPOS.map(c => [c, 0])) as Record<CampoImportacao, number>;
  const chave = normalizarChave(cabecalhoBruto);
  const texto = normalizarTexto(cabecalhoBruto);
  if (!chave) return scores;

  // Se parece claramente um dado (contém dígitos, data, turno direto, horário ou dias da semana), não é cabeçalho
  if (
    /\d/.test(cabecalhoBruto) ||
    normalizarData(cabecalhoBruto) !== null ||
    normalizarTurnoOuHorario(cabecalhoBruto) !== null ||
    normalizarDiasSemana(cabecalhoBruto) !== null
  ) {
    return scores;
  }

  const campoExato = apelidosExatos.get(chave);
  if (campoExato) {
    scores[campoExato] = 1;
    return scores;
  }

  if (apelidosHorarioSet.has(chave)) {
    scores.turno = 0.88;
    return scores;
  }

  const tokensCab = texto.split(' ').filter(Boolean);
  for (const campo of TODOS_OS_CAMPOS) {
    let melhor = 0;
    for (const apelido of COLUNAS_IMPORTACAO[campo]) {
      const textoApelido = normalizarTexto(apelido);
      const tokensApelido = textoApelido.split(' ').filter(Boolean);
      const sim = calcularSimilaridade(cabecalhoBruto, apelido);

      // Verifica se todos os tokens do apelido estão presentes no cabeçalho
      const contemTodosTokens =
        tokensApelido.length > 0 &&
        tokensApelido.every(ta => tokensCab.some(tc => tc === ta || (ta.length >= 4 && tc.startsWith(ta))));

      let candidato = sim;
      if (contemTodosTokens) {
        candidato = Math.max(candidato, 0.82 + 0.12 * (tokensApelido.length / Math.max(tokensCab.length, 1)));
      }
      if (candidato > melhor) melhor = candidato;
    }

    // Evita falsos positivos cruzados entre id_turma vs codigo_turma e local_sala vs sala
    if (campo === 'codigo_turma' && tokensCab.includes('id')) melhor *= 0.4;
    if (campo === 'sala' && tokensCab.some(t => ['local', 'unidade', 'polo', 'campus'].includes(t))) melhor *= 0.4;

    scores[campo] = melhor >= 0.55 ? Number(Math.min(0.95, melhor).toFixed(2)) : 0;
  }

  // Checa similaridade com apelidos de horário para turno
  for (const apelidoHor of APELIDOS_HORARIO_TURNO) {
    const sim = calcularSimilaridade(cabecalhoBruto, apelidoHor);
    if (sim >= 0.72) {
      scores.turno = Math.max(scores.turno, Number(Math.min(0.86, sim * 0.9).toFixed(2)));
    }
  }

  return scores;
}

const REGEX_PALAVRAS_SALA = /\b(sala|lab|laboratorio|auditorio|multiuso|oficina|atelie|ambiente)\b/i;
const REGEX_PALAVRAS_CURSO =
  /\b(curso|tecnico|aprendizagem|assistente|formacao|qualificacao|informatica|administracao|marketing|programacao|desenvolvimento|cabeleireiro|barbeiro|maquiador|maquiagem|costureiro|modelista|secretariado|secretaria|contabilidade|office|power\s*bi|excel|windows|cilios|manicure|colorimetria)\b/i;
const REGEX_PALAVRAS_LOCAL =
  /\b(cep|polo|unidade|recanto|talal|ceilandia|taguatinga|gama|campus|centro|filial|sede|local)\b/i;

function pontuarConteudoColuna(
  valoresBrutos: string[],
  catalogo?: CatalogoImportacao,
  temCabecalho = true
): Record<CampoImportacao, number> {
  const scores = Object.fromEntries(TODOS_OS_CAMPOS.map(c => [c, 0])) as Record<CampoImportacao, number>;
  const valores = valoresBrutos.map(v => v.trim()).filter(Boolean).slice(0, 30);
  if (!valores.length) return scores;

  const total = valores.length;
  let qtdDatas = 0;
  let qtdTurnosDiretos = 0;
  let qtdHorarios = 0;
  let qtdCodigosPadrao = 0;
  let qtdCodigosCurto = 0;
  let qtdDiasSemana = 0;
  let qtdIntPequeno = 0; // 1..60
  let qtdIntGrande = 0; // >= 80
  let qtdSalaCat = 0;
  let qtdCursoCat = 0;
  let qtdInstrutorCat = 0;
  let qtdLocalCat = 0;
  let qtdTextoNomePessoa = 0;

  const nomesCursos = (catalogo?.cursos ?? []).map(c => normalizarTexto(c.nome_curso)).filter(Boolean);
  const nomesSalas = (catalogo?.salas ?? []).map(s => normalizarTexto(s.nome_sala)).filter(Boolean);
  const nomesLocais = [
    ...new Set((catalogo?.salas ?? []).map(s => normalizarTexto(s.local ?? '')).filter(Boolean))
  ];
  const nomesInstrutores = (catalogo?.instrutores ?? []).map(i => normalizarTexto(i.nome_instrutor)).filter(Boolean);

  for (const val of valores) {
    const valNorm = normalizarTexto(val);
    const dataNorm = normalizarData(val);
    if (dataNorm !== null) {
      qtdDatas++;
      continue;
    }

    const turnoNorm = normalizarTurnoOuHorario(val);
    if (turnoNorm !== null) {
      if (turnoNorm.inferido) qtdHorarios++;
      else qtdTurnosDiretos++;
      continue;
    }

    if (/^\d{4}\.\d{2}\.\d+$/.test(val) || /^[a-z]{2,5}[-.]\d+/i.test(val)) {
      qtdCodigosPadrao++;
      continue;
    }

    if (/^\d+$/.test(val)) {
      const n = Number(val);
      if (n >= 1 && n <= 60) qtdIntPequeno++;
      else if (n >= 80 && n <= 3000) qtdIntGrande++;
      continue;
    }

    // Dias da semana (com pelo menos uma vírgula, espaço/hífen de faixa ou nome de dia)
    if (
      (/[,;/\s-]/.test(val) || /^(seg|ter|qua|qui|sex|sab|dom)/i.test(valNorm)) &&
      normalizarDiasSemana(val) !== null
    ) {
      qtdDiasSemana++;
      continue;
    }

    const bateCursoCat = nomesCursos.some(c => c === valNorm || calcularSimilaridade(valNorm, c) >= 0.8);
    const bateSalaCat = nomesSalas.some(s => s === valNorm || calcularSimilaridade(valNorm, s) >= 0.82);
    const bateLocalCat = nomesLocais.some(l => l === valNorm || calcularSimilaridade(valNorm, l) >= 0.8);
    const bateInstrutorCat = nomesInstrutores.some(i => i === valNorm || calcularSimilaridade(valNorm, i) >= 0.82);

    const bateSalaRegex = REGEX_PALAVRAS_SALA.test(valNorm);
    const bateCursoRegex = REGEX_PALAVRAS_CURSO.test(valNorm);
    const bateLocalRegex = REGEX_PALAVRAS_LOCAL.test(valNorm);

    if (bateSalaCat || bateSalaRegex) qtdSalaCat++;
    if (bateCursoCat || bateCursoRegex) qtdCursoCat++;
    if (bateLocalCat || (bateLocalRegex && !bateSalaRegex)) qtdLocalCat++;
    if (bateInstrutorCat) {
      qtdInstrutorCat++;
    } else if (
      /^[a-zA-ZÀ-ÿ\s.'-]+$/.test(val) &&
      !bateSalaRegex &&
      !bateCursoRegex &&
      !bateLocalRegex &&
      val.length >= 3
    ) {
      qtdTextoNomePessoa++;
    }

    if (/^[a-zA-Z0-9._-]{1,12}$/.test(val) && !bateSalaRegex && !bateCursoRegex) {
      qtdCodigosCurto++;
    }
  }

  scores.data_inicio = Number(((qtdDatas / total) * 0.98).toFixed(2));
  if (qtdTurnosDiretos > 0 || qtdHorarios > 0) {
    const propTurno = (qtdTurnosDiretos * 0.98 + qtdHorarios * 0.88) / total;
    scores.turno = Number(propTurno.toFixed(2));
  }
  if (qtdCodigosPadrao > 0) {
    scores.codigo_turma = Number(((qtdCodigosPadrao / total) * 0.98).toFixed(2));
  } else if (qtdCodigosCurto > 0) {
    scores.codigo_turma = Number(((qtdCodigosCurto / total) * (temCabecalho ? 0.45 : 0.72)).toFixed(2));
  }

  if (qtdDiasSemana > 0) {
    scores.dias_semana = Number(((qtdDiasSemana / total) * 0.94).toFixed(2));
  }

  if (qtdIntGrande > 0) {
    scores.carga_horaria = Number(((qtdIntGrande / total) * 0.9).toFixed(2));
  }
  if (qtdIntPequeno > 0) {
    scores.alunos = Number(((qtdIntPequeno / total) * 0.82).toFixed(2));
    scores.id_turma = Number(((qtdIntPequeno / total) * 0.48).toFixed(2));
    scores.carga_horaria = Math.max(scores.carga_horaria, Number(((qtdIntPequeno / total) * 0.4).toFixed(2)));
  }

  if (qtdSalaCat > 0) scores.sala = Number(((qtdSalaCat / total) * 0.94).toFixed(2));
  if (qtdCursoCat > 0) scores.curso = Number(((qtdCursoCat / total) * 0.92).toFixed(2));
  if (qtdLocalCat > 0) scores.local_sala = Number(((qtdLocalCat / total) * 0.9).toFixed(2));
  if (qtdInstrutorCat > 0) {
    scores.instrutor = Number(((qtdInstrutorCat / total) * 0.94).toFixed(2));
  } else if (qtdTextoNomePessoa > 0) {
    scores.instrutor = Number(((qtdTextoNomePessoa / total) * (temCabecalho ? 0.38 : 0.76)).toFixed(2));
  }

  return scores;
}

function detectarLinhaCabecalho(tabela: unknown[][]): number | null {
  const limite = Math.min(20, tabela.length);
  let melhorLinha: number | null = null;
  let melhorPontuacao = 0;

  for (let r = 0; r < limite; r++) {
    const celulas = (tabela[r] ?? []).map(c => String(c ?? '').trim());
    const naoVazias = celulas.filter(Boolean);
    if (naoVazias.length < 2) continue;

    let somaScores = 0;
    let colunasReconhecidas = 0;
    let celulasComCaraDeDado = 0;
    for (const celula of naoVazias) {
      if (
        /\d/.test(celula) ||
        normalizarData(celula) !== null ||
        normalizarTurnoOuHorario(celula) !== null
      ) {
        celulasComCaraDeDado++;
      }
      const scores = pontuarCabecalhoPorCampo(celula);
      const maxCampo = Math.max(...Object.values(scores));
      if (maxCampo >= 0.65) {
        colunasReconhecidas++;
        somaScores += maxCampo;
      }
    }

    if (celulasComCaraDeDado >= 2 && celulasComCaraDeDado >= colunasReconhecidas) continue;

    if (colunasReconhecidas >= 2 && somaScores > melhorPontuacao) {
      melhorPontuacao = somaScores;
      melhorLinha = r + 1; // 1-indexed
    }
  }

  return melhorLinha;
}

function analisarAba(
  nomeAba: string,
  abas: string[],
  tabela: unknown[][],
  opcoes?: OpcoesLeituraPlanilha,
  catalogo?: CatalogoImportacao
): AnalisePlanilha & { _scoreTotalAba: number } {
  const linhaCabecalho =
    opcoes?.linha_cabecalho !== undefined ? opcoes.linha_cabecalho : detectarLinhaCabecalho(tabela);

  const indiceInicioDados = linhaCabecalho != null ? linhaCabecalho : 0;
  const cabecalhosBrutos =
    linhaCabecalho != null ? (tabela[linhaCabecalho - 1] ?? []).map(c => String(c ?? '').trim()) : [];
  const linhasDados = tabela
    .slice(indiceInicioDados)
    .filter(linha => (linha ?? []).some(celula => String(celula ?? '').trim() !== ''));

  const numColunas = Math.max(
    cabecalhosBrutos.length,
    ...linhasDados.map(l => (l ?? []).length),
    0
  );

  const matrizScores: Array<Record<CampoImportacao, number>> = [];
  const exemplosPorColuna: string[][] = [];

  for (let col = 0; col < numColunas; col++) {
    const cabecalho = cabecalhosBrutos[col] ?? '';
    const valoresColuna = linhasDados.map(l => String((l ?? [])[col] ?? '').trim());
    const exemplos = [...new Set(valoresColuna.filter(Boolean))].slice(0, 3);
    exemplosPorColuna.push(exemplos);

    const scoreCab = linhaCabecalho != null ? pontuarCabecalhoPorCampo(cabecalho) : null;
    const scoreCont = pontuarConteudoColuna(valoresColuna, catalogo, linhaCabecalho != null);

    const combinado = Object.fromEntries(TODOS_OS_CAMPOS.map(c => [c, 0])) as Record<CampoImportacao, number>;
    for (const campo of TODOS_OS_CAMPOS) {
      if (scoreCab) {
        const sc = scoreCab[campo];
        const st = scoreCont[campo];
        if (sc >= 0.85) {
          combinado[campo] = Number(Math.min(1, sc * 0.85 + st * 0.25).toFixed(2));
        } else if (sc > 0) {
          combinado[campo] = Number(Math.min(1, sc * 0.65 + st * 0.45).toFixed(2));
        } else {
          // Sem match no cabeçalho: só aceita se o conteúdo for muito forte (ex.: data, turno, código padrão)
          combinado[campo] = st >= 0.85 ? Number((st * 0.72).toFixed(2)) : 0;
        }
      } else {
        combinado[campo] = scoreCont[campo];
      }
    }
    matrizScores.push(combinado);
  }

  // Atribuição global: cada campo do sistema vai para no máximo uma coluna, pela maior pontuação
  const paresCandidatos: Array<{ col: number; campo: CampoImportacao; score: number }> = [];
  for (let col = 0; col < numColunas; col++) {
    for (const campo of TODOS_OS_CAMPOS) {
      const score = matrizScores[col]![campo];
      if (score >= LIMIAR_MINIMO_DETECCAO) {
        paresCandidatos.push({ col, campo, score });
      }
    }
  }
  paresCandidatos.sort((a, b) => b.score - a.score || a.col - b.col);

  const campoPorColuna = new Map<number, { campo: CampoImportacao; confianca: number }>();
  const colunaPorCampo = new Map<CampoImportacao, { col: number; confianca: number }>();

  if (opcoes?.mapeamento) {
    for (const [campoStr, colIdx] of Object.entries(opcoes.mapeamento)) {
      const campo = campoStr as CampoImportacao;
      if (colIdx != null && colIdx >= 0 && colIdx < numColunas && TODOS_OS_CAMPOS.includes(campo)) {
        const conf = Math.max(matrizScores[colIdx]?.[campo] ?? 0, 1);
        campoPorColuna.set(colIdx, { campo, confianca: conf });
        colunaPorCampo.set(campo, { col: colIdx, confianca: conf });
      }
    }
  } else {
    for (const par of paresCandidatos) {
      if (campoPorColuna.has(par.col) || colunaPorCampo.has(par.campo)) continue;
      campoPorColuna.set(par.col, { campo: par.campo, confianca: par.score });
      colunaPorCampo.set(par.campo, { col: par.col, confianca: par.score });
    }
  }

  const colunas: AnaliseColuna[] = [];
  const colunasIgnoradas: ColunaIgnorada[] = [];
  const mapeamentoSugerido: Partial<Record<CampoImportacao, number>> = {};

  for (let col = 0; col < numColunas; col++) {
    const cabecalho = linhaCabecalho != null ? (cabecalhosBrutos[col] || `Coluna ${col + 1}`) : `Coluna ${col + 1}`;
    const atribuido = campoPorColuna.get(col) ?? null;
    const scoresCol = matrizScores[col]!;

    const ordenados = TODOS_OS_CAMPOS
      .map(campo => ({ campo, confianca: scoresCol[campo] }))
      .filter(x => x.confianca >= 0.35)
      .sort((a, b) => b.confianca - a.confianca);

    const alternativas = ordenados.filter(x => x.campo !== atribuido?.campo).slice(0, 3);

    let ambiguo = false;
    if (atribuido && !opcoes?.mapeamento) {
      // 1) Confiança baixa
      if (atribuido.confianca < LIMIAR_ALTA_CONFIANCA) {
        ambiguo = true;
      }
      // 2) Outra coluna empatou ou ficou muito próxima para o mesmo campo
      for (let outraCol = 0; outraCol < numColunas; outraCol++) {
        if (outraCol === col) continue;
        const outroScore = matrizScores[outraCol]![atribuido.campo];
        if (outroScore >= LIMIAR_MINIMO_DETECCAO && Math.abs(atribuido.confianca - outroScore) < MARGEM_AMBIGUIDADE) {
          ambiguo = true;
        }
      }
      // 3) Nesta mesma coluna, um segundo campo disponível ficou muito próximo
      const melhorAlternativa = alternativas[0];
      if (melhorAlternativa && Math.abs(atribuido.confianca - melhorAlternativa.confianca) < MARGEM_AMBIGUIDADE) {
        ambiguo = true;
      }
    } else if (!atribuido && !opcoes?.mapeamento && ordenados.length > 0) {
      // Coluna que competiu por um campo já atribuído com pontuação quase idêntica
      const top = ordenados[0]!;
      const vencedor = colunaPorCampo.get(top.campo);
      if (vencedor && Math.abs(vencedor.confianca - top.confianca) < MARGEM_AMBIGUIDADE) {
        ambiguo = true;
      }
    }

    if (atribuido) {
      mapeamentoSugerido[atribuido.campo] = col;
    } else {
      colunasIgnoradas.push({
        indice: col,
        cabecalho,
        exemplos: exemplosPorColuna[col]!
      });
    }

    colunas.push({
      indice: col,
      cabecalho,
      campo_sugerido: atribuido?.campo ?? null,
      confianca: atribuido?.confianca ?? 0,
      ambiguo,
      exemplos: exemplosPorColuna[col]!,
      alternativas
    });
  }

  const camposObrigatoriosAusentes = COLUNAS_OBRIGATORIAS.filter(
    campo => mapeamentoSugerido[campo] === undefined
  );

  const assinaturaCabecalhos =
    linhaCabecalho != null
      ? cabecalhosBrutos.map(normalizarChave).join('|')
      : `sem_cabecalho:${numColunas}`;

  const temAmbiguidade = colunas.some(c => c.ambiguo);
  const prontoParaSimular =
    camposObrigatoriosAusentes.length === 0 &&
    !temAmbiguidade &&
    linhasDados.length > 0 &&
    COLUNAS_OBRIGATORIAS.every(c => {
      const idx = mapeamentoSugerido[c];
      return idx !== undefined && (colunas[idx]?.confianca ?? 0) >= LIMIAR_ALTA_CONFIANCA;
    });

  const somaConfianca = colunas.reduce((acc, c) => acc + c.confianca, 0);
  const bonusObrigatorias = (COLUNAS_OBRIGATORIAS.length - camposObrigatoriosAusentes.length) * 2;
  const bonusDados = linhasDados.length > 0 ? 1 : -5;

  return {
    abas,
    aba_selecionada: nomeAba,
    linha_cabecalho: linhaCabecalho,
    colunas,
    campos_obrigatorios_ausentes: [...camposObrigatoriosAusentes],
    colunas_ignoradas: colunasIgnoradas,
    mapeamento_sugerido: mapeamentoSugerido,
    assinatura_cabecalhos: assinaturaCabecalhos,
    pronto_para_simular: prontoParaSimular,
    _scoreTotalAba: somaConfianca + bonusObrigatorias + bonusDados
  };
}

function abrirWorkbook(arquivo: Buffer): { workbook: xlsx.WorkBook; isXlsx: boolean } {
  try {
    const isXlsx = arquivo.subarray(0, 2).toString() === 'PK';
    const workbook = isXlsx
      ? xlsx.read(arquivo, { type: 'buffer', cellDates: false })
      : xlsx.read(arquivo.toString('utf8').replace(/^\uFEFF/, ''), { type: 'string', raw: true });
    if (!workbook.SheetNames.length) throw new Error('Planilha vazia');
    return { workbook, isXlsx };
  } catch {
    throw new HttpError(400, 'Arquivo inválido: envie CSV ou XLSX legível.');
  }
}

function extrairTabelaDaAba(workbook: xlsx.WorkBook, nomeAba: string, isXlsx: boolean): unknown[][] {
  const folha = workbook.Sheets[nomeAba];
  if (!folha) throw new HttpError(400, `Aba "${nomeAba}" não encontrada na planilha.`);
  return xlsx.utils.sheet_to_json<unknown[]>(folha, {
    header: 1,
    raw: isXlsx,
    defval: ''
  });
}

export function analisarPlanilha(
  arquivo: Buffer,
  opcoes?: OpcoesLeituraPlanilha,
  catalogo?: CatalogoImportacao
): AnalisePlanilha {
  const { workbook, isXlsx } = abrirWorkbook(arquivo);
  const abas = workbook.SheetNames;

  if (opcoes?.aba) {
    if (!abas.includes(opcoes.aba)) {
      throw new HttpError(400, `Aba "${opcoes.aba}" não encontrada na planilha.`);
    }
    const tabela = extrairTabelaDaAba(workbook, opcoes.aba, isXlsx);
    const { _scoreTotalAba: _, ...analise } = analisarAba(opcoes.aba, abas, tabela, opcoes, catalogo);
    return analise;
  }

  let melhorAnalise: (AnalisePlanilha & { _scoreTotalAba: number }) | null = null;
  for (const nomeAba of abas) {
    const tabela = extrairTabelaDaAba(workbook, nomeAba, isXlsx);
    const candidata = analisarAba(nomeAba, abas, tabela, opcoes, catalogo);
    if (!melhorAnalise || candidata._scoreTotalAba > melhorAnalise._scoreTotalAba) {
      melhorAnalise = candidata;
    }
  }

  if (!melhorAnalise) {
    throw new HttpError(400, 'Arquivo inválido: envie CSV ou XLSX legível.');
  }

  const { _scoreTotalAba: _, ...resultado } = melhorAnalise;
  return resultado;
}

const dataSchema = z.string().transform((valor, ctx) => {
  if (!valor) return undefined;
  const iso = normalizarData(valor);
  if (!iso) {
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

const diasSemanaOpcional = z.string().transform((valor, ctx) => {
  if (!valor) return undefined;
  const dias = normalizarDiasSemana(valor);
  if (!dias) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Dias da semana inválidos' });
    return z.NEVER;
  }
  return dias;
});

export type LinhaImportacao = {
  linha: number;
  id_turma?: number;
  codigo_turma: string;
  curso: string;
  carga_horaria?: number;
  instrutor: string;
  sala: string;
  local_sala: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  turno_inferido?: boolean;
  data_inicio?: string;
  alunos?: number;
  dias_semana?: string[];
};

export type ErroLinha = {
  linha: number;
  codigo_turma: string;
  operacao: 'ERRO';
  mensagem: string;
  criados: 0;
  alterados: 0;
  mantidos: 0;
};

const linhaBaseSchema = z.object({
  id_turma: numeroOpcional,
  codigo_turma: z.string().min(1, 'Código da turma obrigatório'),
  curso: z.string().min(1, 'Curso obrigatório'),
  carga_horaria: numeroOpcional,
  instrutor: z.string(),
  sala: z.string().min(1, 'Sala obrigatória'),
  local_sala: z.string(),
  data_inicio: dataSchema,
  alunos: numeroOpcional,
  dias_semana: diasSemanaOpcional
});

export function lerPlanilha(
  arquivo: Buffer,
  opcoes?: OpcoesLeituraPlanilha,
  catalogo?: CatalogoImportacao
): { linhas: LinhaImportacao[]; erros: ErroLinha[]; analise: AnalisePlanilha } {
  const { workbook, isXlsx } = abrirWorkbook(arquivo);
  const analise = analisarPlanilha(arquivo, opcoes, catalogo);
  const tabela = extrairTabelaDaAba(workbook, analise.aba_selecionada, isXlsx);

  const linhaCabecalho = analise.linha_cabecalho;
  const indiceInicioDados = linhaCabecalho != null ? linhaCabecalho : 0;

  if (tabela.length === 0 || (linhaCabecalho != null && tabela.length <= linhaCabecalho)) {
    throw new HttpError(400, 'A planilha precisa ter cabeçalho e pelo menos uma linha.');
  }

  // Verifica se algum cabeçalho explícito foi duplicado quando não há mapeamento manual
  if (!opcoes?.mapeamento && linhaCabecalho != null) {
    const cabecalhosLinha = (tabela[linhaCabecalho - 1] ?? []).map(c => normalizarChave(String(c ?? '')));
    const vistos = new Map<CampoImportacao, number>();
    for (const cab of cabecalhosLinha) {
      const exato = apelidosExatos.get(cab);
      if (!exato) continue;
      vistos.set(exato, (vistos.get(exato) ?? 0) + 1);
    }
    for (const [campo, qtd] of vistos.entries()) {
      if (qtd > 1) {
        throw new HttpError(400, `Cabeçalho duplicado: ${campo}.`);
      }
    }
  }

  const mapeamento = analise.mapeamento_sugerido;
  const ausentes = COLUNAS_OBRIGATORIAS.filter(coluna => mapeamento[coluna] === undefined);
  if (ausentes.length) {
    throw new HttpError(400, `Colunas obrigatórias ausentes: ${ausentes.join(', ')}.`);
  }

  const linhas: LinhaImportacao[] = [];
  const erros: ErroLinha[] = [];

  tabela.slice(indiceInicioDados).forEach((celulas, indiceRelativo) => {
    if (!celulas.some(celula => String(celula ?? '').trim())) return;
    const numeroLinha = indiceInicioDados + indiceRelativo + 1;

    const bruto = Object.fromEntries(
      TODOS_OS_CAMPOS.map(coluna => {
        const idx = mapeamento[coluna];
        const valorCelula = idx !== undefined ? celulas[idx] : '';
        return [coluna, String(valorCelula ?? '').trim()];
      })
    ) as Record<CampoImportacao, string>;

    const issues: string[] = [];
    const parsedBase = linhaBaseSchema.safeParse(bruto);
    if (!parsedBase.success) {
      for (const issue of parsedBase.error.issues) {
        issues.push(`${issue.path.join('.')}: ${issue.message}`);
      }
    }

    const turnoInfo = normalizarTurnoOuHorario(bruto.turno);
    if (!turnoInfo) {
      issues.push('turno: Turno ou horário inválido (use Manhã, Tarde, Noite ou faixa horária como 14:00 às 18:00)');
    }

    if (issues.length === 0 && parsedBase.success && turnoInfo) {
      linhas.push({
        ...parsedBase.data,
        turno: turnoInfo.turno,
        ...(turnoInfo.inferido ? { turno_inferido: true } : {}),
        linha: numeroLinha
      });
    } else {
      erros.push({
        linha: numeroLinha,
        codigo_turma: bruto.codigo_turma ?? '',
        operacao: 'ERRO',
        mensagem: issues.join('; '),
        criados: 0,
        alterados: 0,
        mantidos: 0
      });
    }
  });

  if (!linhas.length && !erros.length) {
    throw new HttpError(400, 'A planilha não contém turmas.');
  }

  return { linhas, erros, analise };
}
