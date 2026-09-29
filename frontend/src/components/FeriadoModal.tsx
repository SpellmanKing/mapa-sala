import React, { useEffect } from 'react';
import { CalendarDays, Loader2, X } from 'lucide-react';
import type { FeriadoTipo } from '../api/client';
import { useDialogFocus } from '../utils/useDialogFocus';

export type FeriadoForm = {
  data_feriado: string;
  descricao: string;
  fk_id_tipo_feriado: string;
};

type Props = {
  open: boolean;
  title: string;
  error: string | null;
  form: FeriadoForm;
  tipos: FeriadoTipo[];
  isSaving: boolean;
  setForm: React.Dispatch<React.SetStateAction<FeriadoForm>>;
  onClose: () => void;
  onSave: () => void;
};

export function FeriadoModal({
  open,
  title,
  error,
  form,
  tipos,
  isSaving,
  setForm,
  onClose,
  onSave
}: Props) {
  const dialogRef = useDialogFocus(open, onClose, isSaving);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !isSaving) onSave();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isSaving, onSave]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-slate-950/60 p-2 backdrop-blur-md sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feriado-modal-title"
        className="glass-panel flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex items-start justify-between border-b border-border/60 bg-surface/40 p-5">
          <div>
            <h2 id="feriado-modal-title" className="flex items-center gap-2 text-lg font-black text-text-main">
              <CalendarDays className="h-5 w-5 text-primary" />
              {title}
            </h2>
            <p className="mt-1 text-xs font-medium text-text-muted">
              A data será desconsiderada automaticamente nos cronogramas calculados.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar modal de feriado"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-xl p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-main disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="flex flex-col gap-5 overflow-y-auto p-5"
          onSubmit={event => {
            event.preventDefault();
            onSave();
          }}
        >
          <div>
            <label htmlFor="feriado-data" className="mb-1.5 block text-xs font-black uppercase tracking-widest text-text-muted">
              Data
            </label>
            <input
              id="feriado-data"
              data-dialog-initial-focus
              type="date"
              required
              value={form.data_feriado}
              onChange={event => setForm(previous => ({ ...previous, data_feriado: event.target.value }))}
              className="w-full rounded-xl border border-border bg-input p-3 text-sm font-semibold text-text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="feriado-descricao" className="mb-1.5 block text-xs font-black uppercase tracking-widest text-text-muted">
              Descrição
            </label>
            <input
              id="feriado-descricao"
              required
              maxLength={200}
              value={form.descricao}
              onChange={event => setForm(previous => ({ ...previous, descricao: event.target.value }))}
              placeholder="Ex: Dia da Independência"
              className="w-full rounded-xl border border-border bg-input p-3 text-sm font-semibold text-text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="feriado-tipo" className="mb-1.5 block text-xs font-black uppercase tracking-widest text-text-muted">
              Tipo
            </label>
            <select
              id="feriado-tipo"
              required
              disabled={tipos.length === 0}
              value={form.fk_id_tipo_feriado}
              onChange={event => setForm(previous => ({ ...previous, fk_id_tipo_feriado: event.target.value }))}
              className="w-full cursor-pointer rounded-xl border border-border bg-input p-3 text-sm font-semibold text-text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" disabled>Selecione o tipo...</option>
              {tipos.map(tipo => (
                <option key={tipo.id_tipo_feriado} value={tipo.id_tipo_feriado}>
                  {tipo.nome_tipo}
                </option>
              ))}
            </select>
          </div>

          {tipos.length === 0 && (
            <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-700 dark:text-amber-300">
              Nenhum tipo de feriado está cadastrado. O registro não pode ser salvo.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="w-full rounded-xl px-5 py-2.5 text-sm font-bold text-text-muted hover:bg-surface hover:text-text-main disabled:opacity-50 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || tipos.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-black text-white shadow-md hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar feriado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
