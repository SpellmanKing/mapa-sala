import React, { useEffect } from 'react';
import { Calendar as CalendarIcon, X, Users, AlertTriangle, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  novoAgendamento: {
    cursoId: string;
    salaId: string;
    dataInicio: string;
    turno: string;
    codigoTurma: string;
    diasSemana: string[];
    instrutorId: string;
    totalAlunos: number;
  };
  setNovoAgendamento: React.Dispatch<React.SetStateAction<any>>;
  handleCursoChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  cursos: any[];
  instrutores: any[];
  disponibilidadeNovo: {
    salasLivres: any[];
    sugestoesTurnos: { turno: string; vagas: number }[];
  };
  salaSelecionadaNovo?: any;
  capacidadeExcedidaNovo: boolean;
  isSavingAlocacao: boolean;
}

export function NovoAgendamentoModal({
  open,
  onClose,
  onSave,
  novoAgendamento,
  setNovoAgendamento,
  handleCursoChange,
  cursos,
  instrutores,
  disponibilidadeNovo,
  salaSelecionadaNovo,
  capacidadeExcedidaNovo,
  isSavingAlocacao
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSavingAlocacao) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, isSavingAlocacao]);

  if (!open) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col transition-all max-h-[90vh]">
        <div className="p-6 border-b border-border/60 flex justify-between items-center bg-surface/40 shrink-0">
          <h2 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2 font-display">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Nova Alocação de Turma
          </h2>
          <button 
            type="button"
            disabled={isSavingAlocacao}
            onClick={onClose} 
            className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all btn-tactile cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* Curso */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Curso</label>
            <select 
              value={novoAgendamento.cursoId}
              onChange={handleCursoChange}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              required
            >
              <option value="" disabled className="bg-card text-text-main">Selecione um curso...</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id} className="bg-card text-text-main">
                  {c.nome} ({c.cargaHoraria || 160}h)
                </option>
              ))}
            </select>
          </div>

          {/* Data de Início e Turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Data de Início</label>
              <input 
                type="date" 
                value={novoAgendamento.dataInicio}
                onChange={e => setNovoAgendamento({ ...novoAgendamento, dataInicio: e.target.value })}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Turno</label>
              <select 
                value={novoAgendamento.turno}
                onChange={e => setNovoAgendamento({ ...novoAgendamento, turno: e.target.value, salaId: '' })}
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
                const checked = novoAgendamento.diasSemana.includes(dia.id);
                return (
                  <button
                    type="button"
                    key={dia.id}
                    onClick={() => {
                      setNovoAgendamento((prev: any) => {
                        const prevSet = new Set(prev.diasSemana);
                        if (prevSet.has(dia.id)) prevSet.delete(dia.id);
                        else prevSet.add(dia.id);
                        return { ...prev, diasSemana: Array.from(prevSet), salaId: '' };
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

          {/* SELETOR DE SALA FILTRADO POR DISPONIBILIDADE */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest">
                Ambiente / Sala Disponível
              </label>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {disponibilidadeNovo.salasLivres.length} salas livres no turno
              </span>
            </div>

            <select 
              value={novoAgendamento.salaId}
              onChange={e => setNovoAgendamento({ ...novoAgendamento, salaId: e.target.value })}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              required
            >
              <option value="" disabled className="bg-card text-text-main">
                {disponibilidadeNovo.salasLivres.length > 0 
                  ? 'Selecione uma sala livre...' 
                  : 'Nenhuma sala disponível para este horário'}
              </option>
              {disponibilidadeNovo.salasLivres.map(s => (
                <option key={s.id} value={s.id} className="bg-card text-text-main">
                  📍 {s.nome} (Capacidade: {s.capacidade} alunos - {s.tipo})
                </option>
              ))}
            </select>

            {/* SUGESTÃO DE TURNOS ALTERNATIVOS SE 0 SALAS LIVRES */}
            {disponibilidadeNovo.salasLivres.length === 0 && (
              <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  <Lightbulb size={15} /> Sugestão de Horários Alternativos
                </div>
                <p className="text-xs text-text-muted">
                  Todas as salas estão ocupadas no turno da <strong>{novoAgendamento.turno}</strong> para as datas selecionadas.
                </p>
                {disponibilidadeNovo.sugestoesTurnos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {disponibilidadeNovo.sugestoesTurnos.map(sug => (
                      <button
                        key={sug.turno}
                        type="button"
                        onClick={() => setNovoAgendamento((prev: any) => ({ ...prev, turno: sug.turno, salaId: '' }))}
                        className="bg-card hover:bg-surface border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 btn-tactile cursor-pointer shadow-xs"
                      >
                        <span>Mudar para <strong>{sug.turno}</strong></span>
                        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-md font-mono font-black">
                          {sug.vagas} vagas
                        </span>
                        <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantidade Prevista de Alunos */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Users size={14} className="text-primary" /> Total de Alunos Previsto
              </label>
              {salaSelecionadaNovo && (
                <span className={`text-[11px] font-mono font-bold ${capacidadeExcedidaNovo ? 'text-red-500 font-black' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  Capacidade da Sala: {salaSelecionadaNovo.capacidade} vagas
                </span>
              )}
            </div>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={novoAgendamento.totalAlunos}
              onChange={e => setNovoAgendamento({ ...novoAgendamento, totalAlunos: Number(e.target.value) || 0 })}
              className={`w-full border rounded-xl p-3 focus:ring-2 outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer ${
                capacidadeExcedidaNovo 
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                  : 'border-border focus:ring-primary/20 focus:border-primary'
              }`}
              placeholder="Ex: 25"
              required
            />
            {capacidadeExcedidaNovo && (
              <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in">
                <AlertTriangle size={15} className="shrink-0" />
                <span>Capacidade da sala excedida! A sala comporta no máximo {salaSelecionadaNovo?.capacidade} alunos.</span>
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
              value={novoAgendamento.instrutorId}
              onChange={e => setNovoAgendamento({ ...novoAgendamento, instrutorId: e.target.value })}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
            >
              <option value="" className="bg-card text-text-main">Sem Instrutor / Definir Depois</option>
              {instrutores.map(i => <option key={i.id} value={i.id} className="bg-card text-text-main">{i.nome}</option>)}
            </select>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
            <button 
              type="button" 
              disabled={isSavingAlocacao}
              onClick={onClose} 
              className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSavingAlocacao || !novoAgendamento.salaId || capacidadeExcedidaNovo}
              className="bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 btn-tactile cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSavingAlocacao ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Alocando Turma...
                </>
              ) : (
                'Confirmar Alocação'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
