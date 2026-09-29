import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useDialogFocus } from '../utils/useDialogFocus';

export type InstrutorPayload = {
  id?: string;
  nome: string;
};

type Props = {
  open: boolean;
  title: string;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  form: InstrutorPayload;
  setForm: React.Dispatch<React.SetStateAction<InstrutorPayload>>;
  isSaving?: boolean;
};

export function InstrutorModal({ open, title, error, onClose, onSave, form, setForm, isSaving = false }: Props) {
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
        aria-labelledby="instrutor-modal-title"
        className="glass-panel rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-1rem)] transition-all"
      >
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-border/60 flex justify-between items-start bg-surface/40 shrink-0">
          <div>
            <h2 id="instrutor-modal-title" className="text-lg font-black text-text-main tracking-tight font-display">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Fechar modal de instrutor"
            disabled={isSaving}
            onClick={onClose}
            className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all font-black text-lg leading-none btn-tactile cursor-pointer disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Corpo do Modal */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="p-6 flex flex-col gap-5">
          
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
              Nome do Instrutor
            </label>
            <input
              data-dialog-initial-focus
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Carlos Alberto"
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
              required
            />
          </div>

          {/* Tratamento de Erros */}
          {error && (
            <div role="alert" className="bg-red-50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 p-4 rounded-xl">
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
                'Salvar Instrutor'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
