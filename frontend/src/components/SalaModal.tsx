import React, { useEffect } from 'react';
import { TipoSala } from '../context/AppContext';
import { Loader2 } from 'lucide-react';
import { useDialogFocus } from '../utils/useDialogFocus';

export type SalaPayload = {
  id?: string;
  nome: string;
  capacidade: number;
  idTipoSala?: number;
  local?: string;
  recursosEspeciais?: string;
};

type Props = {
  open: boolean;
  title: string;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  form: SalaPayload;
  setForm: React.Dispatch<React.SetStateAction<SalaPayload>>;
  tiposSala: TipoSala[];
  isSaving?: boolean;
};

export function SalaModal({
  open,
  title,
  error,
  onClose,
  onSave,
  form,
  setForm,
  tiposSala,
  isSaving = false
}: Props) {
  const dialogRef = useDialogFocus(open, onClose, isSaving);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSaving) onSave();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onSave, isSaving]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[999] overflow-hidden">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sala-modal-title"
        className="glass-panel rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] transition-all"
      >
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-border/60 flex justify-between items-start bg-surface/40 shrink-0">
          <div>
            <h2 id="sala-modal-title" className="text-lg font-black text-text-main tracking-tight font-display">{title}</h2>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Configure as propriedades e capacidade do ambiente.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar modal de sala"
            disabled={isSaving}
            onClick={onClose}
            className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all font-black text-lg leading-none btn-tactile cursor-pointer disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Corpo do Modal */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* Nome da Sala */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
              Nome da Sala / Ambiente
            </label>
            <input
              data-dialog-initial-focus
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Laboratório de Informática 01"
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Capacidade */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Capacidade Máxima
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.capacidade || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, capacidade: Math.max(1, Number(e.target.value)) }))}
                placeholder="Ex: 35"
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
                required
              />
            </div>

            {/* Tipo de Sala */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Tipo de Sala
              </label>
              <select
                value={form.idTipoSala || (tiposSala[0]?.id ? Number(tiposSala[0].id) : '')}
                onChange={(e) => setForm((prev) => ({ ...prev, idTipoSala: Number(e.target.value) }))}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                required
              >
                {tiposSala.map((tipo) => (
                  <option key={tipo.id} value={tipo.id} className="bg-card text-text-main">
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Local / Bloco */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
              Localização / Bloco <span className="text-[10px] lowercase font-normal text-text-muted">(opcional)</span>
            </label>
            <input
              value={form.local || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, local: e.target.value }))}
              placeholder="Ex: Bloco Principal - 2º Andar"
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
            />
          </div>

          {/* Recursos Especiais */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
              Recursos Especiais <span className="text-[10px] lowercase font-normal text-text-muted">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={form.recursosEspeciais || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, recursosEspeciais: e.target.value }))}
              placeholder="Ex: 30 computadores, projetor interativo, lousa digital..."
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main resize-none"
            />
          </div>

          {/* Tratamento de Erros */}
          {error && (
            <div role="alert" className="bg-red-50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 p-4 rounded-xl shrink-0">
              <p className="text-xs font-bold text-red-750 dark:text-red-400 leading-normal">{error}</p>
            </div>
          )}

          {/* Ações do Modal */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
            <button 
              type="button" 
              disabled={isSaving}
              onClick={onClose} 
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full sm:w-auto justify-center bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:bg-primary/90 btn-tactile cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar Sala'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
