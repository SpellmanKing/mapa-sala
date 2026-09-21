import React, { useEffect } from 'react';
import { BookOpen, X, Lightbulb, Trash2, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onRequestDelete: () => void;
  turma: any;
  dadosEdicao: {
    salaId: string;
    dataInicio: string;
    turno: string;
    diasSemana: string[];
    instrutorId: string;
  };
  setDadosEdicao: React.Dispatch<React.SetStateAction<any>>;
  instrutores: any[];
  disponibilidadeEdicao: {
    salasLivres: any[];
    sugestoesTurnos: { turno: string; vagas: number }[];
  };
  isSavingAlocacao: boolean;
  isDeletingAlocacao: boolean;
}

export function EditTurmaModal({
  open,
  onClose,
  onSave,
  onRequestDelete,
  turma,
  dadosEdicao,
  setDadosEdicao,
  instrutores,
  disponibilidadeEdicao,
  isSavingAlocacao,
  isDeletingAlocacao
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSavingAlocacao && !isDeletingAlocacao) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, isSavingAlocacao, isDeletingAlocacao]);

  if (!open || !turma) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col transition-all max-h-[90vh]">
        <div className="p-6 border-b border-border/60 flex justify-between items-center bg-surface/40 shrink-0">
          <h2 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2 font-display">
            <BookOpen className="w-5 h-5 text-primary" />
            Editar Alocação: {turma.codigo}
          </h2>
          <button 
            type="button"
            disabled={isSavingAlocacao || isDeletingAlocacao}
            onClick={onClose} 
            className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all btn-tactile cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* Data e Turno */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Nova Data Início</label>
              <input 
                type="date" 
                value={dadosEdicao.dataInicio}
                onChange={e => setDadosEdicao({ ...dadosEdicao, dataInicio: e.target.value })}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Novo Turno</label>
              <select 
                value={dadosEdicao.turno}
                onChange={e => setDadosEdicao({ ...dadosEdicao, turno: e.target.value })}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              >
                <option value="Manhã" className="bg-card text-text-main">Manhã</option>
                <option value="Tarde" className="bg-card text-text-main">Tarde</option>
                <option value="Noite" className="bg-card text-text-main">Noite</option>
              </select>
            </div>
          </div>

          {/* Dias da Semana */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Dias de Execução da Turma</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: '1', label: 'Seg' },
                { id: '2', label: 'Ter' },
                { id: '3', label: 'Qua' },
                { id: '4', label: 'Qui' },
                { id: '5', label: 'Sex' },
                { id: '6', label: 'Sáb' }
              ].map((dia) => {
                const checked = dadosEdicao.diasSemana.includes(dia.id);
                return (
                  <button
                    type="button"
                    key={dia.id}
                    onClick={() => {
                      setDadosEdicao((prev: any) => {
                        const prevSet = new Set(prev.diasSemana);
                        if (prevSet.has(dia.id)) prevSet.delete(dia.id);
                        else prevSet.add(dia.id);
                        return { ...prev, diasSemana: Array.from(prevSet) };
                      });
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border border-border/80 btn-tactile cursor-pointer ${
                      checked 
                        ? 'bg-primary text-white border-primary shadow-xs font-black' 
                        : 'bg-input text-text-muted hover:bg-surface/50'
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELETOR DE SALA COM FILTRO DE DISPONIBILIDADE NA EDIÇÃO */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest">
                Ambiente / Sala
              </label>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {disponibilidadeEdicao.salasLivres.length} salas disponíveis
              </span>
            </div>

            <select 
              value={dadosEdicao.salaId}
              onChange={e => setDadosEdicao({ ...dadosEdicao, salaId: e.target.value })}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              required
            >
              {disponibilidadeEdicao.salasLivres.map(s => (
                <option key={s.id} value={s.id} className="bg-card text-text-main">
                  📍 {s.nome} (Capacidade: {s.capacidade} - {s.tipo})
                </option>
              ))}
            </select>

            {/* Sugestões de Turno caso não haja salas livres */}
            {disponibilidadeEdicao.salasLivres.length === 0 && (
              <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  <Lightbulb size={15} /> Sugestão de Turnos Livres
                </div>
                <p className="text-xs text-text-muted">
                  Não há salas disponíveis no turno da {dadosEdicao.turno} para essas novas datas.
                </p>
                {disponibilidadeEdicao.sugestoesTurnos.map(sug => (
                  <button
                    key={sug.turno}
                    type="button"
                    onClick={() => setDadosEdicao((prev: any) => ({ ...prev, turno: sug.turno }))}
                    className="bg-card hover:bg-surface border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center justify-between btn-tactile cursor-pointer"
                  >
                    <span>Mudar para <strong>{sug.turno}</strong></span>
                    <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-md font-mono font-black">
                      {sug.vagas} vagas
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Instrutor */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 flex justify-between items-center">
              <span>Instrutor da Turma</span>
              <span className="text-[10px] text-primary lowercase normal-case font-bold">
                💡 Atribuição opcional
              </span>
            </label>
            <select 
              value={dadosEdicao.instrutorId}
              onChange={e => setDadosEdicao({ ...dadosEdicao, instrutorId: e.target.value })}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
            >
              <option value="" className="bg-card text-text-main">Sem Instrutor / Definir Depois</option>
              {instrutores.map(i => <option key={i.id} value={i.id} className="bg-card text-text-main">{i.nome}</option>)}
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
            <button 
              type="button" 
              disabled={isSavingAlocacao || isDeletingAlocacao}
              onClick={onRequestDelete}
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all btn-tactile cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} /> Excluir Alocação
            </button>

            <div className="flex justify-end gap-3 w-full sm:w-auto shrink-0">
              <button 
                type="button" 
                disabled={isSavingAlocacao || isDeletingAlocacao}
                onClick={onClose} 
                className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSavingAlocacao || isDeletingAlocacao}
                className="bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 btn-tactile cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingAlocacao ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
