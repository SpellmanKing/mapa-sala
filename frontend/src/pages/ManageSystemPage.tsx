import React, { useState } from 'react';
import { AllocationModal, CursoPayload } from '../components/AllocationModal';
import { InstrutorModal, InstrutorPayload } from '../components/InstrutorModal';
import { useAppContext, Curso, Instrutor } from '../context/AppContext';
import { CursoService, InstrutorService } from '../api/client';
import { Plus, Edit, Trash2, BookOpen, Users, School } from 'lucide-react';

type Tab = 'cursos' | 'instrutores' | 'salas';

export function ManageSystemPage() {
  const { cursos, instrutores, salas, tipoSalas, refreshCursos, refreshInstrutores, showToast } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('cursos');

  // --- Estados do Curso ---
  const [cursoModalOpen, setCursoModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [cursoForm, setCursoForm] = useState<CursoPayload>({
    nome: '', instrutorId: '', unidade: '', diasSemanaLetiva: ['1', '3', '5'], diasRemotos: [], codigoTurmaPadrao: '', turnoPadrao: 'Manhã', modalidade: 'Presencial'
  });
  const [cursoError, setCursoError] = useState<string | null>(null);
  const [searchCurso, setSearchCurso] = useState('');
  const [searchInstrutor, setSearchInstrutor] = useState('');

  // --- Estados do Instrutor ---
  const [instrutorModalOpen, setInstrutorModalOpen] = useState(false);
  const [editingInstrutor, setEditingInstrutor] = useState<Instrutor | null>(null);
  const [instrutorForm, setInstrutorForm] = useState<InstrutorPayload>({ nome: '' });
  const [instrutorError, setInstrutorError] = useState<string | null>(null);

  // === MÉTODOS DE CURSO ===
  function openCursoCreate() {
    setEditingCurso(null);
    setCursoError(null);
    setCursoForm({ nome: '', instrutorId: instrutores[0]?.id ?? '', unidade: '', diasSemanaLetiva: ['1', '3', '5'], diasRemotos: [], codigoTurmaPadrao: '', turnoPadrao: 'Manhã', modalidade: 'Presencial' });
    setCursoModalOpen(true);
  }

  function openCursoEdit(curso: Curso) {
    setEditingCurso(curso);
    setCursoError(null);
    setCursoForm({ id: curso.id, nome: curso.nome, instrutorId: curso.instrutorId ?? '', unidade: curso.unidade ?? '', diasSemanaLetiva: curso.diasSemana ?? ['1', '3', '5'], diasRemotos: curso.diasRemotos ?? [], codigoTurmaPadrao: curso.codigoTurmaPadrao ?? '', turnoPadrao: curso.turnoPadrao ?? 'Manhã', modalidade: curso.modalidade });
    setCursoModalOpen(true);
  }

  async function saveCurso() {
    if (!cursoForm.nome.trim()) return setCursoError('Nome é obrigatório.');
    if (!cursoForm.instrutorId) return setCursoError('Instrutor é obrigatório.');
    if (!cursoForm.unidade) return setCursoError('Unidade é obrigatória.');

    try {
      const apiPayload = {
        nome_curso: cursoForm.nome,
        segmento: 'Geral',
        modalidade: cursoForm.modalidade,
        carga_horaria: 100,
        valor: 0,
        curso_tem: false,
        bolsa_compativel: true,
        unidade: cursoForm.unidade,
        id_instrutor_padrao: Number(cursoForm.instrutorId) || undefined,
        codigo_turma_padrao: cursoForm.codigoTurmaPadrao,
        turno_padrao: cursoForm.turnoPadrao,
        dias_letivos_padrao: cursoForm.diasSemanaLetiva.join(','),
        dias_remotos_padrao: cursoForm.diasRemotos.join(',')
      };

      if (editingCurso?.id) {
        await CursoService.update(Number(editingCurso.id), apiPayload);
        showToast('Curso atualizado com sucesso!', 'success');
      } else {
        await CursoService.create(apiPayload);
        showToast('Curso criado com sucesso!', 'success');
      }
      refreshCursos();
      setCursoModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar no backend.';
      setCursoError(msg);
      showToast(msg, 'error');
    }
  }

  async function removeCurso(id?: string) {
    if (!id || !window.confirm('Deseja excluir permanentemente este curso?')) return;
    try { 
      await CursoService.delete(Number(id)); 
      refreshCursos(); 
      showToast('Curso excluído com sucesso!', 'success');
    } catch { 
      showToast('Erro ao excluir curso.', 'error'); 
    }
  }

  // === MÉTODOS DE INSTRUTOR ===
  function openInstrutorCreate() {
    setEditingInstrutor(null);
    setInstrutorError(null);
    setInstrutorForm({ nome: '' });
    setInstrutorModalOpen(true);
  }

  function openInstrutorEdit(instrutor: Instrutor) {
    setEditingInstrutor(instrutor);
    setInstrutorError(null);
    setFormValues(instrutor);
  }

  function setFormValues(instrutor: Instrutor) {
    setInstrutorForm({ id: instrutor.id, nome: instrutor.nome });
    setInstrutorModalOpen(true);
  }

  async function saveInstrutor() {
    if (!instrutorForm.nome.trim()) return setInstrutorError('Nome é obrigatório.');

    try {
      const payload = { nome_instrutor: instrutorForm.nome };
      if (editingInstrutor?.id) {
        await InstrutorService.update(Number(editingInstrutor.id), payload);
        showToast('Instrutor atualizado com sucesso!', 'success');
      } else {
        await InstrutorService.create(payload);
        showToast('Instrutor criado com sucesso!', 'success');
      }
      refreshInstrutores();
      setInstrutorModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar no backend.';
      setInstrutorError(msg);
      showToast(msg, 'error');
    }
  }

  async function removeInstrutor(id?: string) {
    if (!id || !window.confirm('Deseja excluir permanentemente este instrutor?')) return;
    try { 
      await InstrutorService.delete(Number(id)); 
      refreshInstrutores(); 
      showToast('Instrutor excluído com sucesso!', 'success');
    } catch { 
      showToast('Erro ao excluir instrutor.', 'error'); 
    }
  }

  // Helpers
  function getNomeInstrutor(id?: string) { return instrutores.find(i => i.id === id)?.nome ?? id ?? '-'; }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-350">
      
      {/* Título e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-primary tracking-tight">Gerenciamento Educacional</h1>
          <p className="text-text-muted text-sm mt-1 font-medium">Gestão unificada de Cursos, Instrutores e Ambientes.</p>
        </div>
        
        <div className="shrink-0">
          {activeTab === 'cursos' && (
            <button 
              onClick={openCursoCreate} 
              className="w-full sm:w-auto bg-primary text-white font-black py-2.5 px-5 rounded-xl shadow-md btn-tactile hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Plus size={16} /> Adicionar Curso
            </button>
          )}
          {activeTab === 'instrutores' && (
            <button 
              onClick={openInstrutorCreate} 
              className="w-full sm:w-auto bg-primary text-white font-black py-2.5 px-5 rounded-xl shadow-md btn-tactile hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Plus size={16} /> Adicionar Instrutor
            </button>
          )}
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="glass-panel rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1.5 overflow-x-auto scrollbar-none transition-colors duration-300">
        <button 
          onClick={() => setActiveTab('cursos')} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all btn-tactile cursor-pointer border ${
            activeTab === 'cursos' 
              ? 'bg-primary/10 text-primary border-primary/20 shadow-sm font-black' 
              : 'text-text-muted hover:text-text-main hover:bg-surface border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Cursos
        </button>
        <button 
          onClick={() => setActiveTab('instrutores')} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all btn-tactile cursor-pointer border ${
            activeTab === 'instrutores' 
              ? 'bg-primary/10 text-primary border-primary/20 shadow-sm font-black' 
              : 'text-text-muted hover:text-text-main hover:bg-surface border-transparent'
          }`}
        >
          <Users className="w-4 h-4" /> Instrutores
        </button>
        <button 
          onClick={() => setActiveTab('salas')} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all btn-tactile cursor-pointer border ${
            activeTab === 'salas' 
              ? 'bg-primary/10 text-primary border-primary/20 shadow-sm font-black' 
              : 'text-text-muted hover:text-text-main hover:bg-surface border-transparent'
          }`}
        >
          <School className="w-4 h-4" /> Salas e Ambientes
        </button>
      </div>

      {/* Listagens em Grids de Cards Premium */}
      <div className="relative z-10 transition-all duration-300">
        
        {activeTab === 'cursos' && (() => {
          const filteredCursos = cursos.filter(c => 
            c.nome.toLowerCase().includes(searchCurso.toLowerCase()) || 
            (c.codigoTurmaPadrao && c.codigoTurmaPadrao.toLowerCase().includes(searchCurso.toLowerCase())) ||
            (c.unidade && c.unidade.toLowerCase().includes(searchCurso.toLowerCase()))
          );
          return (
            <div className="flex flex-col gap-6 w-full">
              <div className="glass-panel rounded-2xl p-4 border border-border/75 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 Pesquisar cursos por nome, código da turma ou unidade..."
                  value={searchCurso}
                  onChange={e => setSearchCurso(e.target.value)}
                  className="w-full bg-input text-text-main text-sm font-semibold outline-none border border-border rounded-xl p-3 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCursos.length === 0 ? (
                  <div className="col-span-full glass-panel rounded-3xl py-12 text-center text-sm text-text-muted font-medium border border-border/80">
                    Nenhum curso encontrado.
                  </div>
                ) : (
                  filteredCursos.map(c => {
                    const instrutorNome = getNomeInstrutor(c.instrutorId);
                    const iniciais = instrutorNome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                    
                    return (
                      <div key={c.id} className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-5 border border-border/70 hover-glow-primary transition-all duration-300 group/card relative overflow-hidden">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border tracking-wider uppercase ${
                            c.modalidade === 'Presencial' 
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : c.modalidade === 'Remoto'
                                ? 'bg-accent/10 text-accent border-accent/20 dark:text-light-accent'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                            {c.modalidade}
                          </span>
                          {c.unidade && (
                            <span className="bg-surface/50 border border-border/80 text-text-muted font-bold px-2.5 py-0.5 rounded-lg text-[9px] tracking-wide uppercase">
                              {c.unidade}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Nome do Curso</span>
                          <h3 className="text-base font-black text-text-main leading-snug tracking-tight font-display group-hover/card:text-primary transition-colors">
                            {c.nome}
                          </h3>
                          {c.codigoTurmaPadrao && (
                            <span className="text-[10px] font-bold text-text-muted font-mono mt-1">
                              Cód. Padrão: {c.codigoTurmaPadrao}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-3.5 border-t border-border/50">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-xs flex items-center justify-center tracking-tight shadow-xs uppercase shrink-0">
                            {iniciais || '?'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold text-text-muted uppercase leading-none">Instrutor Principal</span>
                            <span className="text-xs font-black text-text-main truncate mt-0.5">{instrutorNome}</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 mt-1 pt-3.5 border-t border-border/50">
                          <button 
                            onClick={() => openCursoEdit(c)}
                            className="bg-card hover:bg-surface border border-border text-text-muted hover:text-text-main font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Edit size={12} /> Editar
                          </button>
                          <button 
                            onClick={() => removeCurso(c.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-655 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'instrutores' && (() => {
          const filteredInstrutores = instrutores.filter(i => 
            i.nome.toLowerCase().includes(searchInstrutor.toLowerCase())
          );
          return (
            <div className="flex flex-col gap-6 w-full">
              <div className="glass-panel rounded-2xl p-4 border border-border/75 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 Pesquisar instrutores pelo nome..."
                  value={searchInstrutor}
                  onChange={e => setSearchInstrutor(e.target.value)}
                  className="w-full bg-input text-text-main text-sm font-semibold outline-none border border-border rounded-xl p-3 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInstrutores.length === 0 ? (
                  <div className="col-span-full glass-panel rounded-3xl py-12 text-center text-sm text-text-muted font-medium border border-border/80">
                    Nenhum instrutor encontrado.
                  </div>
                ) : (
                  filteredInstrutores.map(i => {
                    const nameParts = i.nome.split(' ');
                    const iniciais = nameParts.length > 1 
                      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
                      : nameParts[0].slice(0, 2).toUpperCase();

                    return (
                      <div key={i.id} className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-5 border border-border/70 hover-glow-primary transition-all duration-300 group/card">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 text-primary font-black text-sm flex items-center justify-center shadow-xs shrink-0 uppercase font-display">
                            {iniciais || '?'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest font-mono">ID #{i.id}</span>
                            <h3 className="text-base font-black text-text-main tracking-tight font-display truncate mt-0.5 group-hover/card:text-primary transition-colors">
                              {i.nome}
                            </h3>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3.5 border-t border-border/50">
                          <button 
                            onClick={() => openInstrutorEdit(i)}
                            className="bg-card hover:bg-surface border border-border text-text-muted hover:text-text-main font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Edit size={12} /> Editar
                          </button>
                          <button 
                            onClick={() => removeInstrutor(i.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-655 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'salas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {salas.length === 0 ? (
              <div className="col-span-full glass-panel rounded-3xl py-12 text-center text-sm text-text-muted font-medium border border-border/80">
                Nenhuma sala cadastrada.
              </div>
            ) : (
              salas.map(s => (
                <div key={s.id} className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-5 border border-border/70 hover-glow-primary transition-all duration-300 group/card">
                  
                  <div className="flex flex-col gap-3.5">
                    {/* Topo / Tipo de Sala */}
                    <div className="flex justify-between items-center">
                      <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase font-mono">
                        {s.tipo}
                      </span>
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest font-mono">ID #{s.id}</span>
                    </div>

                    {/* Nome do Ambiente */}
                    <div>
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">Nome do Ambiente</span>
                      <h3 className="text-lg font-black text-text-main tracking-tight font-display mt-0.5 group-hover/card:text-primary transition-colors">
                        {s.nome}
                      </h3>
                    </div>
                  </div>

                  {/* Capacidade */}
                  <div className="pt-3.5 border-t border-border/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-text-muted">Capacidade Máxima</span>
                      <span className="text-text-main font-black">{s.capacidade} alunos</span>
                    </div>
                    
                    {/* Barra de Progresso de Capacidade */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-border/40 relative">
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary/70 rounded-full" 
                        style={{ width: `${Math.min(100, (s.capacidade / 45) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      <AllocationModal
        open={cursoModalOpen}
        title={editingCurso ? 'Editar Curso' : 'Adicionar Curso'}
        error={cursoError}
        onClose={() => setCursoModalOpen(false)}
        onSave={saveCurso}
        form={cursoForm}
        setForm={setCursoForm}
        ambientes={tipoSalas}
        instrutores={instrutores}
      />

      <InstrutorModal
        open={instrutorModalOpen}
        title={editingInstrutor ? 'Editar Instrutor' : 'Adicionar Instrutor'}
        error={instrutorError}
        onClose={() => setInstrutorModalOpen(false)}
        onSave={saveInstrutor}
        form={instrutorForm}
        setForm={setInstrutorForm}
      />
    </div>
  );
}
