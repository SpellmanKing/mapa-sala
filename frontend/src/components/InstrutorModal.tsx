import React, { useEffect } from 'react';

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
};

export function InstrutorModal({ open, title, error, onClose, onSave, form, setForm }: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSave();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onSave]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[999] overflow-hidden"
    >
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col transition-all duration-300">
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-border/60 flex justify-between items-start bg-surface/40 shrink-0">
          <div>
            <h2 className="text-lg font-black text-text-main tracking-tight font-display">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all font-black text-lg leading-none btn-tactile cursor-pointer"
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
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Carlos Alberto"
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
              required
            />
          </div>

          {/* Tratamento de Erros */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 p-4 rounded-xl">
              <p className="text-xs font-bold text-red-750 dark:text-red-400 leading-normal">{error}</p>
            </div>
          )}

          {/* Ações do Modal */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 btn-tactile cursor-pointer text-sm"
            >
              Salvar Instrutor
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
