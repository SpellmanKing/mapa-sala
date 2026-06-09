import React, { useEffect, useMemo } from 'react';
import { TipoSala, Instrutor, Modality } from '../context/AppContext';
import Select from 'react-select';

export type CursoPayload = {
  id?: string;
  nome: string;
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
};

export function AllocationModal({
  open,
  title,
  error,
  onClose,
  onSave,
  form,
  setForm,
  ambientes,
  instrutores
}: Props) {

  const instrutorOptions = useMemo(() => {
    return instrutores.map(i => ({ value: i.id, label: i.nome }));
  }, [instrutores]);

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

            {/* Dias da semana letiva (Presenciais) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">
                Dias da Semana Letiva (Presenciais)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: '1', label: 'Segunda' },
                  { id: '2', label: 'Terça' },
                  { id: '3', label: 'Quarta' },
                  { id: '4', label: 'Quinta' },
                  { id: '5', label: 'Sexta' }
                ].map((dia) => {
                  const checked = form.diasSemanaLetiva.includes(dia.id);
                  return (
                    <button
                      type="button"
                      key={dia.id}
                      onClick={() => {
                        setForm((prev) => {
                          const prevSet = new Set(prev.diasSemanaLetiva);
                          if (prevSet.has(dia.id)) prevSet.delete(dia.id);
                          else prevSet.add(dia.id);
                          return { ...prev, diasSemanaLetiva: Array.from(prevSet) };
                        });
                      }}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl border border-border/80 btn-tactile cursor-pointer ${
                        checked 
                          ? 'bg-primary/10 border-primary text-primary shadow-xs font-black' 
                          : 'bg-input text-text-muted hover:bg-surface/50 hover:text-text-main'
                      }`}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dias da semana letiva (Remotos) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">
                Dias da Semana Letiva (Remotos)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: '1', label: 'Segunda' },
                  { id: '2', label: 'Terça' },
                  { id: '3', label: 'Quarta' },
                  { id: '4', label: 'Quinta' },
                  { id: '5', label: 'Sexta' }
                ].map((dia) => {
                  const checked = form.diasRemotos.includes(dia.id);
                  return (
                    <button
                      type="button"
                      key={dia.id}
                      onClick={() => {
                        setForm((prev) => {
                          const prevSet = new Set(prev.diasRemotos);
                          if (prevSet.has(dia.id)) prevSet.delete(dia.id);
                          else prevSet.add(dia.id);
                          return { ...prev, diasRemotos: Array.from(prevSet) };
                        });
                      }}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl border border-border/80 btn-tactile cursor-pointer ${
                        checked 
                          ? 'bg-accent/10 border-accent text-accent dark:text-light-accent shadow-xs font-black' 
                          : 'bg-input text-text-muted hover:bg-surface/50 hover:text-text-main'
                      }`}
                    >
                      {dia.label}
                    </button>
                  );
                })}
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
                Modalidade
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
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 btn-tactile cursor-pointer text-sm"
            >
              Salvar Curso
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
