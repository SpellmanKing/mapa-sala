import { useState } from 'react';
import {
  ImportacaoPlanilhaService,
  type AnalisePlanilha,
  type CampoImportacao,
  type MapeamentoColunas,
  type OpcoesImportacaoPlanilha,
  type ResultadoImportacao
} from '../api/client';
import { getApiErrorMessage } from '../api/errorMessage.js';
import { useDialogFocus } from '../utils/useDialogFocus';

type Props = { open: boolean; onClose: () => void; onConfirmed: () => Promise<void> };

const STORAGE_MAPEAMENTO_KEY = 'sgst_importacao_mapeamento_v1';

const CAMPOS_SISTEMA: Array<{ id: CampoImportacao; label: string; obrigatorio: boolean }> = [
  { id: 'codigo_turma', label: 'Código da Turma', obrigatorio: true },
  { id: 'curso', label: 'Curso', obrigatorio: true },
  { id: 'sala', label: 'Sala / Ambiente', obrigatorio: true },
  { id: 'turno', label: 'Turno / Horário', obrigatorio: true },
  { id: 'data_inicio', label: 'Data de Início', obrigatorio: true },
  { id: 'local_sala', label: 'Local / Unidade (opcional se sala única)', obrigatorio: false },
  { id: 'instrutor', label: 'Instrutor / Docente', obrigatorio: false },
  { id: 'carga_horaria', label: 'Carga Horária', obrigatorio: false },
  { id: 'alunos', label: 'Total de Alunos', obrigatorio: false },
  { id: 'dias_semana', label: 'Dias da Semana', obrigatorio: false },
  { id: 'id_turma', label: 'ID Interno da Turma', obrigatorio: false }
];

const CAMPOS_OBRIGATORIOS: CampoImportacao[] = ['codigo_turma', 'curso', 'sala', 'turno', 'data_inicio'];

function labelCampo(campo: CampoImportacao): string {
  return CAMPOS_SISTEMA.find(c => c.id === campo)?.label ?? campo;
}

function carregarMapeamentoSalvo(assinatura: string): Partial<Record<CampoImportacao, number>> | null {
  if (!assinatura) return null;
  try {
    const raw = localStorage.getItem(STORAGE_MAPEAMENTO_KEY);
    if (!raw) return null;
    const todos = JSON.parse(raw) as Record<string, Partial<Record<CampoImportacao, number>>>;
    return todos[assinatura] ?? null;
  } catch {
    return null;
  }
}

function salvarMapeamentoNoNavegador(assinatura: string, mapeamento: MapeamentoColunas) {
  if (!assinatura) return;
  try {
    const raw = localStorage.getItem(STORAGE_MAPEAMENTO_KEY);
    const todos = raw ? (JSON.parse(raw) as Record<string, MapeamentoColunas>) : {};
    todos[assinatura] = mapeamento;
    localStorage.setItem(STORAGE_MAPEAMENTO_KEY, JSON.stringify(todos));
  } catch {
    // Ignora falha de localStorage em modo restrito
  }
}

export function ImportacaoPlanilhaModal({ open, onClose, onConfirmed }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [analise, setAnalise] = useState<AnalisePlanilha | null>(null);
  const [abaSelecionada, setAbaSelecionada] = useState<string>('');
  const [colunaParaCampo, setColunaParaCampo] = useState<Record<number, CampoImportacao | ''>>({});
  const [mostrarMapeamento, setMostrarMapeamento] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const dialogRef = useDialogFocus(open, onClose, ocupado);

  function construirMapeamentoAtual(mapaColunas = colunaParaCampo): MapeamentoColunas {
    const mapeamento: MapeamentoColunas = {};
    for (const [colIdxStr, campo] of Object.entries(mapaColunas)) {
      if (campo) {
        mapeamento[campo] = Number(colIdxStr);
      }
    }
    return mapeamento;
  }

  function construirOpcoes(
    aba = abaSelecionada,
    linhaCab = analise?.linha_cabecalho,
    mapaColunas = colunaParaCampo
  ): OpcoesImportacaoPlanilha {
    return {
      ...(aba ? { aba } : {}),
      ...(linhaCab !== undefined ? { linha_cabecalho: linhaCab } : {}),
      mapeamento: construirMapeamentoAtual(mapaColunas)
    };
  }

  async function analisarArquivo(file: File, abaForcada?: string) {
    setOcupado(true);
    setErro('');
    setResultado(null);
    try {
      const dadosAnalise = await ImportacaoPlanilhaService.analisar(
        file,
        abaForcada ? { aba: abaForcada } : undefined
      );
      setAnalise(dadosAnalise);
      setAbaSelecionada(dadosAnalise.aba_selecionada);

      const salvo = carregarMapeamentoSalvo(dadosAnalise.assinatura_cabecalhos);
      const mapaBase = salvo ?? dadosAnalise.mapeamento_sugerido;

      const novoColunaParaCampo: Record<number, CampoImportacao | ''> = {};
      for (const col of dadosAnalise.colunas) {
        novoColunaParaCampo[col.indice] = '';
      }
      for (const [campoStr, idx] of Object.entries(mapaBase)) {
        if (idx !== undefined && idx >= 0 && idx < dadosAnalise.colunas.length) {
          novoColunaParaCampo[idx] = campoStr as CampoImportacao;
        }
      }
      setColunaParaCampo(novoColunaParaCampo);

      const prontoAuto = dadosAnalise.pronto_para_simular;
      if (prontoAuto) {
        setMostrarMapeamento(false);
        const opcoesSimulacao = construirOpcoes(
          dadosAnalise.aba_selecionada,
          dadosAnalise.linha_cabecalho,
          novoColunaParaCampo
        );
        const simulacao = await ImportacaoPlanilhaService.simular(file, opcoesSimulacao);
        setResultado(simulacao);
      } else {
        setMostrarMapeamento(true);
      }
    } catch (causa) {
      setErro(getApiErrorMessage(causa, 'Não foi possível analisar a planilha.'));
    } finally {
      setOcupado(false);
    }
  }

  async function executar(confirmar: boolean) {
    if (!arquivo) return;
    setOcupado(true);
    setErro('');
    try {
      const opcoes = construirOpcoes();
      if (analise?.assinatura_cabecalhos && opcoes.mapeamento) {
        salvarMapeamentoNoNavegador(analise.assinatura_cabecalhos, opcoes.mapeamento);
      }
      const resposta = confirmar
        ? await ImportacaoPlanilhaService.confirmar(arquivo, opcoes)
        : await ImportacaoPlanilhaService.simular(arquivo, opcoes);
      setResultado(resposta);
      if (confirmar) {
        await onConfirmed();
        onClose();
      }
    } catch (causa) {
      setErro(getApiErrorMessage(causa, 'Não foi possível processar a planilha.'));
    } finally {
      setOcupado(false);
    }
  }

  function alterarCampoDaColuna(indiceColuna: number, novoCampo: CampoImportacao | '') {
    setColunaParaCampo(atual => {
      const proximo: Record<number, CampoImportacao | ''> = { ...atual };
      if (novoCampo) {
        // Garante que cada campo seja atribuído a no máximo uma coluna
        for (const [idxStr, campoAtual] of Object.entries(proximo)) {
          if (campoAtual === novoCampo) {
            proximo[Number(idxStr)] = '';
          }
        }
      }
      proximo[indiceColuna] = novoCampo;
      return proximo;
    });
    setResultado(null);
  }

  if (!open) return null;

  const mapeamentoAtual = construirMapeamentoAtual();
  const obrigatoriosFaltando = CAMPOS_OBRIGATORIOS.filter(c => mapeamentoAtual[c] === undefined);
  const temErros = resultado?.linhas.some(linha => linha.operacao === 'ERRO');
  const colunasMapeadasResumo =
    analise?.colunas.filter(col => Boolean(colunaParaCampo[col.indice])) ?? [];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-2 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="importacao-title"
        className="glass-panel flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-6">
          <div>
            <h2 id="importacao-title" className="text-lg font-black text-text-main">
              Importar turmas por planilha
            </h2>
            <p className="text-sm text-text-muted">
              Detecção inteligente de colunas e simulação antes de confirmar. Nenhuma linha é aplicada se houver erro.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={ocupado}
            aria-label="Fechar importação"
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-text-muted hover:bg-surface disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-bold text-text-main" htmlFor="arquivo-importacao">
                Arquivo CSV ou XLSX
              </label>
              <input
                id="arquivo-importacao"
                data-dialog-initial-focus
                type="file"
                accept=".csv,.xlsx"
                disabled={ocupado}
                className="block w-full text-sm text-text-main file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-bold file:text-white"
                onChange={event => {
                  const file = event.target.files?.[0] ?? null;
                  setArquivo(file);
                  setAnalise(null);
                  setResultado(null);
                  setErro('');
                  if (file) {
                    void analisarArquivo(file);
                  }
                }}
              />
            </div>

            {analise && analise.abas.length > 1 && (
              <div className="sm:w-56">
                <label className="mb-1 block text-xs font-bold uppercase text-text-muted" htmlFor="seletor-aba-importacao">
                  Aba da planilha
                </label>
                <select
                  id="seletor-aba-importacao"
                  value={abaSelecionada}
                  disabled={ocupado}
                  onChange={e => {
                    const novaAba = e.target.value;
                    setAbaSelecionada(novaAba);
                    if (arquivo) void analisarArquivo(arquivo, novaAba);
                  }}
                  className="min-h-[44px] w-full rounded-xl border border-border bg-input px-3 py-2 text-sm font-semibold text-text-main"
                >
                  {analise.abas.map(aba => (
                    <option key={aba} value={aba}>
                      {aba}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-xs text-text-muted">
            Campos obrigatórios: código da turma, curso, sala, turno (ou horário) e data de início. Local da sala é opcional quando o nome da sala é único.
          </p>

          {erro && (
            <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
              {erro}
            </p>
          )}

          {analise && !mostrarMapeamento && (
            <details className="rounded-xl border border-border bg-surface/50 p-3 text-xs text-text-main">
              <summary className="cursor-pointer font-bold">
                Colunas identificadas automaticamente ({colunasMapeadasResumo.length} mapeadas
                {analise.linha_cabecalho != null
                  ? ` · cabeçalho na linha ${analise.linha_cabecalho}`
                  : ' · detectadas pelo conteúdo'}
                )
              </summary>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {colunasMapeadasResumo.map(col => {
                    const campo = colunaParaCampo[col.indice];
                    return (
                      <span
                        key={col.indice}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 font-semibold"
                      >
                        <span className="text-text-muted">{col.cabecalho}:</span>
                        <span className="text-primary">{campo ? labelCampo(campo) : 'Ignorada'}</span>
                        <span className="text-[10px] text-text-muted">({Math.round(col.confianca * 100)}%)</span>
                      </span>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarMapeamento(true)}
                  className="min-h-[44px] rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface"
                >
                  Revisar ou alterar mapeamento de colunas
                </button>
              </div>
            </details>
          )}

          {analise && mostrarMapeamento && (
            <div className="space-y-3 rounded-xl border border-border bg-surface/40 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-text-main">Mapeamento de Colunas da Planilha</h3>
                  <p className="text-xs text-text-muted">
                    {analise.linha_cabecalho != null
                      ? `Cabeçalho detectado na linha ${analise.linha_cabecalho}.`
                      : 'Planilha sem cabeçalho detectado (colunas sugeridas pelo conteúdo).'}{' '}
                    Confirme ou ajuste o campo correspondente a cada coluna.
                  </p>
                </div>
                {analise.pronto_para_simular && (
                  <button
                    type="button"
                    onClick={() => setMostrarMapeamento(false)}
                    className="min-h-[44px] rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text-main"
                  >
                    Ocultar mapeamento
                  </button>
                )}
              </div>

              {obrigatoriosFaltando.length > 0 && (
                <p role="alert" className="rounded-lg bg-amber-500/10 p-2.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  Mapeie os campos obrigatórios pendentes: {obrigatoriosFaltando.map(labelCampo).join(', ')}.
                </p>
              )}

              <div className="max-h-64 max-w-full overflow-x-auto overflow-y-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] text-left text-xs text-text-main">
                  <thead className="sticky top-0 bg-surface">
                    <tr>
                      <th className="p-2.5">Coluna da Planilha</th>
                      <th className="p-2.5">Exemplos de Conteúdo</th>
                      <th className="p-2.5">Confiança</th>
                      <th className="p-2.5">Campo do Sistema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analise.colunas.map(col => {
                      const selecionado = colunaParaCampo[col.indice] ?? '';
                      return (
                        <tr key={col.indice} className="border-t border-border">
                          <td className="p-2.5 font-bold">
                            #{col.indice + 1} · {col.cabecalho}
                          </td>
                          <td className="max-w-[220px] truncate p-2.5 text-text-muted" title={col.exemplos.join(' | ')}>
                            {col.exemplos.length > 0 ? col.exemplos.join(', ') : '—'}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                                col.ambiguo
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : col.confianca >= 0.7
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-500/15 text-text-muted'
                              }`}
                            >
                              {Math.round(col.confianca * 100)}%{col.ambiguo ? ' · Ambíguo' : ''}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <select
                              aria-label={`Campo para coluna ${col.cabecalho}`}
                              value={selecionado}
                              disabled={ocupado}
                              onChange={e =>
                                alterarCampoDaColuna(col.indice, e.target.value as CampoImportacao | '')
                              }
                              className="min-h-[44px] w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs font-semibold text-text-main"
                            >
                              <option value="">Ignorar coluna</option>
                              {CAMPOS_SISTEMA.map(campo => (
                                <option key={campo.id} value={campo.id}>
                                  {campo.label}
                                  {campo.obrigatorio ? ' *' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultado && (
            <>
              <p className="text-sm font-bold text-text-main">
                Data efetiva: {resultado.data_corte_efetiva} · Aulas a criar: {resultado.totais.criados} · a alterar:{' '}
                {resultado.totais.alterados} · mantidas: {resultado.totais.mantidos}
              </p>
              <div className="max-h-72 max-w-full overflow-x-auto overflow-y-auto rounded-xl border border-border">
                <table className="w-full min-w-[680px] text-left text-xs text-text-main">
                  <thead className="sticky top-0 bg-surface">
                    <tr>
                      <th className="p-2">Linha</th>
                      <th className="p-2">Turma</th>
                      <th className="p-2">Operação</th>
                      <th className="p-2">Criadas</th>
                      <th className="p-2">Alteradas</th>
                      <th className="p-2">Mantidas</th>
                      <th className="p-2">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.linhas.map(linha => (
                      <tr key={linha.linha} className="border-t border-border">
                        <td className="p-2">{linha.linha}</td>
                        <td className="p-2">{linha.codigo_turma}</td>
                        <td className="p-2">
                          {linha.operacao}
                          {linha.turno_inferido ? ' (inferido)' : ''}
                        </td>
                        <td className="p-2">{linha.criados}</td>
                        <td className="p-2">{linha.alterados}</td>
                        <td className="p-2">{linha.mantidos}</td>
                        <td className="p-2">{linha.mensagem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={ocupado}
            className="min-h-[44px] rounded-xl border border-border px-4 py-2 text-sm font-bold text-text-main disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void executar(false)}
            disabled={!arquivo || ocupado || obrigatoriosFaltando.length > 0}
            className="min-h-[44px] rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary disabled:opacity-50"
          >
            Simular
          </button>
          <button
            type="button"
            onClick={() => void executar(true)}
            disabled={!resultado || temErros || ocupado || obrigatoriosFaltando.length > 0}
            className="min-h-[44px] rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Confirmar importação
          </button>
        </div>
      </div>
    </div>
  );
}
