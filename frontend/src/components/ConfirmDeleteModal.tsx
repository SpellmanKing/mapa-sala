import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  itemName: string;
  itemType: 'curso' | 'instrutor' | 'sala' | 'turma' | 'alocação' | 'item';
  activeTurmasCount?: number;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  open,
  title,
  itemName,
  itemType,
  activeTurmasCount = 0,
  onConfirm,
  onClose,
  isDeleting = false
}: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isDeleting) onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, isDeleting]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[1000] overflow-hidden"
    >
      <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col border border-red-500/20 bg-card transition-all">
        
        {/* Cabeçalho de Alerta */}
        <div className="p-5 border-b border-border/60 flex justify-between items-center bg-red-500/10 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-text-main tracking-tight font-display">{title}</h2>
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Ação Irreversível</span>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="text-text-muted hover:text-text-main hover:bg-surface p-2 rounded-xl transition-all font-black text-lg leading-none cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Informativo */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-text-main font-medium leading-relaxed">
            Você está prestes a excluir permanentemente o {itemType}:
          </p>

          <div className="p-3.5 rounded-2xl bg-surface/80 border border-border flex items-center gap-3">
            <div className="w-2 h-8 rounded-full bg-red-500 shrink-0"></div>
            <span className="text-sm font-black text-text-main font-display truncate">
              {itemName}
            </span>
          </div>

          {/* Alerta de Impacto em Vínculos / Turmas */}
          {activeTurmasCount > 0 ? (
            <div className="bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider">
                <AlertTriangle size={14} className="shrink-0" />
                Atenção: Vínculos Encontrados
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">
                Este {itemType} possui <strong>{activeTurmasCount} turma{activeTurmasCount > 1 ? 's' : ''}</strong> associada{activeTurmasCount > 1 ? 's' : ''}. A exclusão removerá todas as alocações e horários vinculados a ele no calendário de salas.
              </p>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Esta ação não pode ser desfeita e removerá este registro do banco de dados.
            </p>
          )}

          {/* Ações */}
          <div className="flex justify-end items-center gap-3 mt-3 pt-4 border-t border-border/60">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-text-muted hover:text-text-main hover:bg-surface rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-red-600/20 transition-all cursor-pointer text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={14} /> Confirmar Exclusão
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
