import React, { useState } from 'react';
import { AllocationModal, CursoPayload } from '../components/AllocationModal';
import { InstrutorModal, InstrutorPayload } from '../components/InstrutorModal';
import { useAppContext, Curso, Instrutor } from '../context/AppContext';
import { CursoService, InstrutorService } from '../api/client';
import { Plus, Edit, Trash2, BookOpen, Users, School } from 'lucide-react';

type Tab = 'cursos' | 'instrutores' | 'salas';

export function ManageSystemPage() {
  const { cursos, instrutores, salas, tipoSalas, refreshCursos, refreshInstrutores } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('cursos');

  // --- Estados do Curso ---
  const [cursoModalOpen, setCursoModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [cursoForm, setCursoForm] = useState<CursoPayload>({
    nome: '', instrutorId: '', unidade: '', diasSemanaLetiva: ['1', '3', '5'], diasRemotos: [], codigoTurmaPadrao: '', turnoPadrao: 'Manhã', modalidade: 'Presencial'
  });
  const [cursoError, setCursoError] = useState<string | null>(null);

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
      } else {
        await CursoService.create(apiPayload);
      }
      refreshCursos();
      setCursoModalOpen(false);
    } catch (err) {
      setCursoError('Erro ao salvar no backend.');
    }
  }

  async function removeCurso(id?: string) {
    if (!id || !window.confirm('Deseja excluir permanentemente este curso?')) return;
    try { await CursoService.delete(Number(id)); refreshCursos(); } catch { alert('Erro ao excluir.'); }
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
      } else {
        await InstrutorService.create(payload);
      }
      refreshInstrutores();
      setInstrutorModalOpen(false);
    } catch (err) {
      setInstrutorError('Erro ao salvar no backend.');
    }
  }

  async function removeInstrutor(id?: string) {
    if (!id || !window.confirm('Deseja excluir permanentemente este instrutor?')) return;
    try { await InstrutorService.delete(Number(id)); refreshInstrutores(); } catch { alert('Erro ao excluir.'); }
  }

  // Helpers
  function getNomeInstrutor(id?: string) { return instrutores.find(i => i.id === id)?.nome ?? id ?? '-'; }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Título e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-primary tracking-tight">Gerenciamento Educacional</h1>
          <p className="text-text-muted text-sm mt-1 font-medium">Gestão unificada de Cursos, Instrutores e Ambientes.</p>
        </div>
        
        <div className="shrink-0">
          {activeTab === 'cursos' && (
            <button 
              onClick={openCursoCreate} 
              className="w-full sm:w-auto bg-primary text-white font-black py-2.5 px-5 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Plus size={16} /> Adicionar Curso
            </button>
          )}
          {activeTab === 'instrutores' && (
            <button 
              onClick={openInstrutorCreate} 
              className="w-full sm:w-auto bg-primary text-white font-black py-2.5 px-5 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Plus size={16} /> Adicionar Instrutor
            </button>
          )}
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="bg-card rounded-2xl border border-border p-2 shadow-sm flex flex-wrap gap-2 overflow-x-auto scrollbar-none transition-colors duration-300">
        <button 
          onClick={() => setActiveTab('cursos')} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'cursos' 
              ? 'bg-primary/5 text-primary shadow-sm border border-primary/10' 
              : 'text-text-muted hover:text-text-main hover:bg-surface'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Cursos
        </button>
        <button 
          onClick={() => setActiveTab('instrutores')} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'instrutores' 
              ? 'bg-primary/5 text-primary shadow-sm border border-primary/10' 
              : 'text-text-muted hover:text-text-main hover:bg-surface'
          }`}
        >
          <Users className="w-4 h-4" /> Instrutores
        </button>
        <button 
          onClick={() => setActiveTab('salas')} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'salas' 
              ? 'bg-primary/5 text-primary shadow-sm border border-primary/10' 
              : 'text-text-muted hover:text-text-main hover:bg-surface'
          }`}
        >
          <School className="w-4 h-4" /> Salas e Ambientes
        </button>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto custom-scrollbar">
          
          {activeTab === 'cursos' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Nome do Curso</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Instrutor Principal</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Unidade</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Modalidade</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cursos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-text-muted font-medium">Nenhum curso cadastrado.</td>
                  </tr>
                ) : (
                  cursos.map(c => (
                    <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-text-main">{c.nome}</td>
                      <td className="px-6 py-4 text-sm text-text-muted font-semibold">{getNomeInstrutor(c.instrutorId)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-surface border border-border text-text-muted font-bold px-2.5 py-1 rounded-lg text-xs">
                          {c.unidade || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          c.modalidade === 'Presencial' 
                            ? 'bg-primary/5 text-primary border-primary/20'
                            : c.modalidade === 'Remoto'
                              ? 'bg-accent/10 text-accent border-accent/20 dark:text-light-accent'
                              : 'bg-green-50 dark:bg-green-950/20 text-green-705 dark:text-green-400 border-green-100 dark:border-green-900/30'
                        }`}>
                          {c.modalidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openCursoEdit(c)}
                            className="bg-card border border-border text-text-muted hover:bg-surface hover:text-text-main font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            <Edit size={12} /> Editar
                          </button>
                          <button 
                            onClick={() => removeCurso(c.id)}
                            className="bg-red-50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-200/40 text-red-600 dark:text-red-400 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'instrutores' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Nome do Instrutor</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {instrutores.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-text-muted font-medium">Nenhum instrutor cadastrado.</td>
                  </tr>
                ) : (
                  instrutores.map(i => (
                    <tr key={i.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-text-muted font-mono">#{i.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-text-main">{i.nome}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openInstrutorEdit(i)}
                            className="bg-card border border-border text-text-muted hover:bg-surface hover:text-text-main font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            <Edit size={12} /> Editar
                          </button>
                          <button 
                            onClick={() => removeInstrutor(i.id)}
                            className="bg-red-50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-200/40 text-red-600 dark:text-red-400 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'salas' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Nome do Ambiente</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Tipo</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">Capacidade Máxima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-text-muted font-medium">Nenhuma sala cadastrada.</td>
                  </tr>
                ) : (
                  salas.map(s => (
                    <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-text-muted font-mono">#{s.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-text-main">{s.nome}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-text-muted">
                        <span className="bg-surface px-2 py-0.5 rounded border border-border text-xs text-text-main">{s.tipo}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-main font-bold">{s.capacidade} alunos</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

        </div>
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
