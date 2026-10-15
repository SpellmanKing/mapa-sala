import { useState } from 'react';
import { ImportacaoPlanilhaService, type ResultadoImportacao } from '../api/client';
import { getApiErrorMessage } from '../api/errorMessage.js';
import { useDialogFocus } from '../utils/useDialogFocus';

type Props = { open: boolean; onClose: () => void; onConfirmed: () => Promise<void> };

export function ImportacaoPlanilhaModal({ open, onClose, onConfirmed }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const dialogRef = useDialogFocus(open, onClose, ocupado);

  async function executar(confirmar: boolean) {
    if (!arquivo) return;
    setOcupado(true);
    setErro('');
    try {
      const resposta = confirmar
        ? await ImportacaoPlanilhaService.confirmar(arquivo)
        : await ImportacaoPlanilhaService.simular(arquivo);
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

  if (!open) return null;
  const temErros = resultado?.linhas.some(linha => linha.operacao === 'ERRO');
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-2 sm:p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="importacao-title" className="glass-panel flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h2 id="importacao-title" className="text-lg font-black text-text-main">Importar turmas por planilha</h2>
            <p className="text-sm text-text-muted">Simule antes de confirmar. Nenhuma linha é aplicada se houver erro.</p>
          </div>
          <button type="button" onClick={onClose} disabled={ocupado} aria-label="Fechar importação" className="rounded-lg p-2 text-text-muted hover:bg-surface disabled:opacity-50">×</button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <label className="block text-sm font-bold text-text-main" htmlFor="arquivo-importacao">Arquivo CSV ou XLSX</label>
          <input id="arquivo-importacao" data-dialog-initial-focus type="file" accept=".csv,.xlsx" disabled={ocupado} className="block w-full text-sm text-text-main file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white" onChange={event => { setArquivo(event.target.files?.[0] ?? null); setResultado(null); setErro(''); }} />
          <p className="text-xs text-text-muted">Colunas obrigatórias: codigo_turma, curso, sala, local_sala, turno e data_inicio. Para turma existente, data_inicio pode ficar vazia.</p>
          {erro && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{erro}</p>}
          {resultado && <>
            <p className="text-sm font-bold text-text-main">Data efetiva: {resultado.data_corte_efetiva} · Aulas a criar: {resultado.totais.criados} · a alterar: {resultado.totais.alterados} · mantidas: {resultado.totais.mantidos}</p>
            <div className="max-w-full overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[680px] text-left text-xs text-text-main">
                <thead className="bg-surface"><tr><th className="p-2">Linha</th><th className="p-2">Turma</th><th className="p-2">Operação</th><th className="p-2">Criadas</th><th className="p-2">Alteradas</th><th className="p-2">Mantidas</th><th className="p-2">Resultado</th></tr></thead>
                <tbody>{resultado.linhas.map(linha => <tr key={linha.linha} className="border-t border-border"><td className="p-2">{linha.linha}</td><td className="p-2">{linha.codigo_turma}</td><td className="p-2">{linha.operacao}</td><td className="p-2">{linha.criados}</td><td className="p-2">{linha.alterados}</td><td className="p-2">{linha.mantidos}</td><td className="p-2">{linha.mensagem}</td></tr>)}</tbody>
              </table>
            </div>
          </>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={ocupado} className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-text-main disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={() => void executar(false)} disabled={!arquivo || ocupado} className="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary disabled:opacity-50">Simular</button>
          <button type="button" onClick={() => void executar(true)} disabled={!resultado || temErros || ocupado} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Confirmar importação</button>
        </div>
      </div>
    </div>
  );
}
