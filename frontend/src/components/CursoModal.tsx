import React, { useEffect, useMemo } from 'react';
import { TipoSala, Instrutor, Modality } from '../context/AppContext';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';

export type CursoPayload = {
  id?: string;
  nome: string;
  cargaHoraria: number;
  segmento: string;
  instrutorId: string;
  unidade: string;
  diasSemanaLetiva: string[];
  diasRemotos: string[];
  codigoTurmaPadrao: string;
  turnoPadrao: string;
  modalidade: Modality;
};

type Props = {
  open: boolean;
  title: string;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  form: CursoPayload;
  setForm: React.Dispatch<React.SetStateAction<CursoPayload>>;
  ambientes: TipoSala[];
  instrutores: Instrutor[];
  isSaving?: boolean;
};

export function CursoModal({
  open,
  title,
  error,
  onClose,
  onSave,
  form,
  setForm,
  ambientes,
  instrutores,
  isSaving = false
}: Props) {

  const instrutorOptions = useMemo(() => {
    return instrutores.map(i => ({ value: i.id, label: i.nome }));
  }, [instrutores]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSaving) onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSaving) onSave();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onSave, isSaving]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[999] overflow-hidden"
    >
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all duration-300">
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-border/60 flex justify-between items-start bg-surface/40 shrink-0">
          <div>
            <h2 className="text-lg font-black text-text-main tracking-tight font-display">{title}</h2>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Todos os campos são obrigatórios para a criação do curso.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all font-black text-lg leading-none btn-tactile cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Corpo do Modal com Scroll Interno */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nome do Curso */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Nome do Curso
              </label>
              <input
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Desenvolvimento de Sistemas"
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
                required
              />
            </div>

            {/* Instrutor */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Instrutor Principal
              </label>
              <Select
                options={instrutorOptions}
                value={instrutorOptions.find(opt => opt.value === form.instrutorId) || null}
                onChange={(selected) => setForm(prev => ({ ...prev, instrutorId: selected?.value || '' }))}
                placeholder="Selecione ou pesquise..."
                noOptionsMessage={() => "Nenhum instrutor encontrado"}
                className="text-sm cursor-pointer"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '12px',
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-input)',
                    color: 'var(--color-text-main)',
                    padding: '2px',
                    boxShadow: 'none',
                    fontWeight: 600,
                    '&:hover': { borderColor: 'var(--color-border)' }
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'var(--color-text-main)',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: 'var(--color-text-muted)',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    zIndex: 50
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected 
                      ? 'var(--color-primary)' 
                      : state.isFocused 
                        ? 'var(--color-surface)' 
                        : 'transparent',
                    color: state.isSelected 
                      ? 'white' 
                      : 'var(--color-text-main)',
                    fontWeight: state.isSelected ? 700 : 500
                  })
                }}
              />
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Unidade
              </label>
              <select
                value={form.unidade}
                onChange={(e) => setForm((prev) => ({ ...prev, unidade: e.target.value }))}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                required
              >
                <option value="" disabled className="bg-card text-text-main">Selecione a unidade...</option>
                {['Cep Talal', 'Polo Recanto', 'Colégio CED 308', 'Colégio CEM 111', 'Colégio CEM 12', 'Colégio CED 11', 'Colégio CED 7'].map(u => (
                  <option key={u} value={u} className="bg-card text-text-main">{u}</option>
                ))}
              </select>
            </div>

            {/* Carga Horária */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Carga Horária (Horas)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.cargaHoraria || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, cargaHoraria: Math.max(1, Number(e.target.value)) }))}
                placeholder="Ex: 160"
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
                required
              />
            </div>

            {/* Segmento */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Segmento / Área
              </label>
              <select
                value={form.segmento || 'Tecnologia da Informação'}
                onChange={(e) => setForm((prev) => ({ ...prev, segmento: e.target.value }))}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                required
              >
                {[
                  'Tecnologia da Informação',
                  'Gestão e Negócios',
                  'Saúde',
                  'Beleza e Estética',
                  'Gastronomia',
                  'Moda',
                  'Design e Artes',
                  'Idiomas',
                  'Educacional / Geral'
                ].map(s => (
                  <option key={s} value={s} className="bg-card text-text-main">{s}</option>
                ))}
              </select>
            </div>

            {/* Seletor Unificado de Dias da Semana (Presencial / Remoto) */}
            <div className="md:col-span-2 bg-surface/50 border border-border/80 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-black text-text-main uppercase tracking-widest">
                    Dias de Aula & Formato
                  </label>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Clique no dia para alternar o formato da aula.
                  </p>
                </div>

                {/* Legenda visual interativa */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20">
                    <span className="w-2 h-2 rounded-full bg-primary"></span> 1º Clique: Presencial
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> 2º Clique: Remoto
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-input text-text-muted border border-border">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> 3º: Desmarcar
                  </span>
                </div>
              </div>

              {/* Grid dos botões de dias */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { id: '1', label: 'Segunda', abrev: 'Seg' },
                  { id: '2', label: 'Terça', abrev: 'Ter' },
                  { id: '3', label: 'Quarta', abrev: 'Qua' },
                  { id: '4', label: 'Quinta', abrev: 'Qui' },
                  { id: '5', label: 'Sexta', abrev: 'Sex' },
                  { id: '6', label: 'Sábado', abrev: 'Sáb' }
                ].map((dia) => {
                  const isPresencial = form.diasSemanaLetiva.includes(dia.id);
                  const isRemoto = form.diasRemotos.includes(dia.id);

                  let estiloBotao = 'bg-input text-text-muted border-border hover:bg-surface/80 hover:text-text-main';
                  let badgeTexto = 'Sem aula';
                  let badgeEstilo = 'bg-slate-200/50 dark:bg-slate-800 text-text-muted';

                  if (isPresencial) {
                    estiloBotao = 'bg-primary text-white border-primary shadow-sm hover:brightness-105';
                    badgeTexto = 'Presencial';
                    badgeEstilo = 'bg-white/20 text-white';
                  } else if (isRemoto) {
                    estiloBotao = 'bg-amber-500 dark:bg-amber-600 text-white border-amber-600 shadow-sm hover:brightness-105';
                    badgeTexto = 'Remoto';
                    badgeEstilo = 'bg-white/20 text-white';
                  }

                  const handleDayClick = () => {
                    setForm((prev) => {
                      const curPres = prev.diasSemanaLetiva.includes(dia.id);
                      const curRem = prev.diasRemotos.includes(dia.id);

                      let nextPres = [...prev.diasSemanaLetiva];
                      let nextRem = [...prev.diasRemotos];

                      if (!curPres && !curRem) {
                        // 1º Clique: Presencial
                        nextPres.push(dia.id);
                      } else if (curPres) {
                        // 2º Clique: Remoto
                        nextPres = nextPres.filter(id => id !== dia.id);
                        nextRem.push(dia.id);
                      } else {
                        // 3º Clique: Desmarcado
                        nextRem = nextRem.filter(id => id !== dia.id);
                      }

                      nextPres.sort();
                      nextRem.sort();

                      // Calcula modalidade automaticamente
                      let autoMod: Modality = prev.modalidade;
                      const hasPres = nextPres.length > 0;
                      const hasRem = nextRem.length > 0;

                      if (hasPres && hasRem) {
                        autoMod = 'Semi-Presencial';
                      } else if (hasPres && !hasRem) {
                        autoMod = 'Presencial';
                      } else if (!hasPres && hasRem) {
                        autoMod = 'Remoto';
                      }

                      return {
                        ...prev,
                        diasSemanaLetiva: nextPres,
                        diasRemotos: nextRem,
                        modalidade: autoMod
                      };
                    });
                  };

                  return (
                    <button
                      type="button"
                      key={dia.id}
                      onClick={handleDayClick}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer font-bold select-none ${estiloBotao}`}
                      title={`Clique para alternar ${dia.label}: Sem aula -> Presencial -> Remoto`}
                    >
                      <span className="text-xs uppercase tracking-wider font-black">{dia.label}</span>
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-black ${badgeEstilo}`}>
                        {badgeTexto}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Resumo Dinâmico em tempo real */}
              <div className="text-[11px] font-medium text-text-muted pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-1">
                <span>
                  {form.diasSemanaLetiva.length === 0 && form.diasRemotos.length === 0 ? (
                    <span className="text-amber-500 font-semibold">⚠️ Nenhum dia selecionado</span>
                  ) : (
                    <span>
                      {form.diasSemanaLetiva.length > 0 && (
                        <strong className="text-primary font-bold">
                          {form.diasSemanaLetiva.length} dia{form.diasSemanaLetiva.length > 1 ? 's' : ''} presencial
                        </strong>
                      )}
                      {form.diasSemanaLetiva.length > 0 && form.diasRemotos.length > 0 && ' • '}
                      {form.diasRemotos.length > 0 && (
                        <strong className="text-amber-600 dark:text-amber-400 font-bold">
                          {form.diasRemotos.length} dia{form.diasRemotos.length > 1 ? 's' : ''} remoto
                        </strong>
                      )}
                    </span>
                  )}
                </span>

                <span className="text-[11px] font-bold text-text-main flex items-center gap-1">
                  Modalidade selecionada: <span className="px-2 py-0.5 rounded-md bg-surface border border-border font-black text-secondary dark:text-primary">{form.modalidade}</span>
                </span>
              </div>
            </div>

            {/* Código da Turma */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Código da Turma (Padrão)
              </label>
              <input
                value={form.codigoTurmaPadrao}
                onChange={(e) => setForm((prev) => ({ ...prev, codigoTurmaPadrao: e.target.value }))}
                placeholder="Ex: 2026.29.10"
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
              />
            </div>

            {/* Turno Padrão */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Turno Padrão
              </label>
              <select
                value={form.turnoPadrao}
                onChange={(e) => setForm((prev) => ({ ...prev, turnoPadrao: e.target.value }))}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              >
                <option value="Manhã" className="bg-card text-text-main">Manhã</option>
                <option value="Tarde" className="bg-card text-text-main">Tarde</option>
                <option value="Noite" className="bg-card text-text-main">Noite</option>
              </select>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Modalidade <span className="text-[10px] lowercase font-normal text-text-muted">(definida automaticamente)</span>
              </label>
              <select
                value={form.modalidade}
                onChange={(e) => setForm((prev) => ({ ...prev, modalidade: e.target.value as Modality }))}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              >
                <option value="Presencial" className="bg-card text-text-main">Presencial</option>
                <option value="Semi-Presencial" className="bg-card text-text-main">Semi-Presencial</option>
                <option value="Remoto" className="bg-card text-text-main">Remoto</option>
              </select>
            </div>
          </div>

          {/* Tratamento de Erros */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 p-4 rounded-xl shrink-0">
              <p className="text-xs font-bold text-red-750 dark:text-red-400 leading-normal">{error}</p>
            </div>
          )}

          {/* Ações do Modal */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
            <button 
              type="button" 
              disabled={isSaving}
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 btn-tactile cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar Curso'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export const AllocationModal = CursoModal;
