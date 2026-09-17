import React, { useState, useMemo } from 'react';
import { AllocationModal, CursoPayload } from '../components/AllocationModal';
import { InstrutorModal, InstrutorPayload } from '../components/InstrutorModal';
import { SalaModal, SalaPayload } from '../components/SalaModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useAppContext, Curso, Instrutor, Sala } from '../context/AppContext';
import { CursoService, InstrutorService, SalaService } from '../api/client';
import { Plus, Edit, Trash2, BookOpen, Users, School, Search, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

type Tab = 'cursos' | 'instrutores' | 'salas';

export function ManageSystemPage() {
  const { 
    cursos, 
    instrutores, 
    salas, 
    turmas, 
    tipoSalas, 
    isLoading,
    refreshCursos, 
    refreshInstrutores, 
    refreshSalas, 
    refreshTurmas, 
    showToast 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<Tab>('cursos');

  // --- Estados do Curso ---
  const [cursoModalOpen, setCursoModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [isSavingCurso, setIsSavingCurso] = useState(false);
  const [cursoForm, setCursoForm] = useState<CursoPayload>({
    nome: '', 
    cargaHoraria: 160,
    segmento: 'Tecnologia da Informação',
    instrutorId: '', 
    unidade: '', 
    diasSemanaLetiva: ['1', '3', '5'], 
    diasRemotos: [], 
    codigoTurmaPadrao: '', 
    turnoPadrao: 'Manhã', 
    modalidade: 'Presencial'
  });
  const [cursoError, setCursoError] = useState<string | null>(null);
  const [searchCurso, setSearchCurso] = useState('');
  const [filtroModalidadeCurso, setFiltroModalidadeCurso] = useState<string>('Todas');
  const [filtroUnidadeCurso, setFiltroUnidadeCurso] = useState<string>('Todas');
  const [pageCursos, setPageCursos] = useState(1);

  // --- Estados do Instrutor ---
  const [instrutorModalOpen, setInstrutorModalOpen] = useState(false);
  const [editingInstrutor, setEditingInstrutor] = useState<Instrutor | null>(null);
  const [isSavingInstrutor, setIsSavingInstrutor] = useState(false);
  const [instrutorForm, setInstrutorForm] = useState<InstrutorPayload>({ nome: '' });
  const [instrutorError, setInstrutorError] = useState<string | null>(null);
  const [searchInstrutor, setSearchInstrutor] = useState('');
  const [pageInstrutores, setPageInstrutores] = useState(1);

  // --- Estados da Sala ---
  const [salaModalOpen, setSalaModalOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [isSavingSala, setIsSavingSala] = useState(false);
  const [salaForm, setSalaForm] = useState<SalaPayload>({
    nome: '',
    capacidade: 35,
    idTipoSala: undefined,
    local: '',
    recursosEspeciais: ''
  });
  const [salaError, setSalaError] = useState<string | null>(null);
  const [searchSala, setSearchSala] = useState('');
  const [filtroTipoSala, setFiltroTipoSala] = useState<string>('Todos');
  const [pageSalas, setPageSalas] = useState(1);

  // --- Estado do Modal de Exclusão Segura ---
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string;
    name: string;
    type: 'curso' | 'instrutor' | 'sala';
    turmasCount: number;
    isDeleting: boolean;
  }>({
    open: false,
    id: '',
    name: '',
    type: 'curso',
    turmasCount: 0,
    isDeleting: false
  });

  const ITEMS_PER_PAGE = 12;

  // === MÉTODOS DE CURSO ===
  function openCursoCreate() {
    setEditingCurso(null);
    setCursoError(null);
    setCursoForm({ 
      nome: '', 
      cargaHoraria: 160,
      segmento: 'Tecnologia da Informação',
      instrutorId: instrutores[0]?.id ?? '', 
      unidade: 'Cep Talal', 
      diasSemanaLetiva: ['1', '3', '5'], 
      diasRemotos: [], 
      codigoTurmaPadrao: '', 
      turnoPadrao: 'Manhã', 
      modalidade: 'Presencial' 
    });
    setCursoModalOpen(true);
  }

  function openCursoEdit(curso: Curso) {
    setEditingCurso(curso);
    setCursoError(null);
    setCursoForm({ 
      id: curso.id, 
      nome: curso.nome, 
      cargaHoraria: curso.cargaHoraria || 160,
      segmento: curso.segmento || 'Tecnologia da Informação',
      instrutorId: curso.instrutorId ?? '', 
      unidade: curso.unidade ?? 'Cep Talal', 
      diasSemanaLetiva: curso.diasSemana ?? ['1', '3', '5'], 
      diasRemotos: curso.diasRemotos ?? [], 
      codigoTurmaPadrao: curso.codigoTurmaPadrao ?? '', 
      turnoPadrao: curso.turnoPadrao ?? 'Manhã', 
      modalidade: curso.modalidade 
    });
    setCursoModalOpen(true);
  }

  async function saveCurso() {
    if (!cursoForm.nome.trim()) return setCursoError('Nome do curso é obrigatório.');
    if (!cursoForm.cargaHoraria || Number(cursoForm.cargaHoraria) <= 0) return setCursoError('Carga Horária deve ser um número positivo.');
    if (!cursoForm.instrutorId) return setCursoError('Instrutor principal é obrigatório.');
    if (!cursoForm.unidade) return setCursoError('Unidade é obrigatória.');

    setIsSavingCurso(true);
    setCursoError(null);

    try {
      const apiPayload = {
        nome_curso: cursoForm.nome.trim(),
        segmento: cursoForm.segmento || 'Tecnologia da Informação',
        modalidade: cursoForm.modalidade,
        carga_horaria: Number(cursoForm.cargaHoraria) || 160,
        valor: 0,
        curso_tem: false,
        bolsa_compativel: true,
        unidade: cursoForm.unidade,
        id_instrutor_padrao: Number(cursoForm.instrutorId) || undefined,
        codigo_turma_padrao: cursoForm.codigoTurmaPadrao?.trim(),
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
    } finally {
      setIsSavingCurso(false);
    }
  }

  function requestDeleteCurso(curso: Curso) {
    const count = turmas.filter(t => 
      t.cursoNome.toLowerCase() === curso.nome.toLowerCase() || 
      (curso.codigoTurmaPadrao && t.codigo?.startsWith(curso.codigoTurmaPadrao))
    ).length;

    setDeleteModal({
      open: true,
      id: curso.id,
      name: curso.nome,
      type: 'curso',
      turmasCount: count,
      isDeleting: false
    });
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
    setInstrutorForm({ id: instrutor.id, nome: instrutor.nome });
    setInstrutorModalOpen(true);
  }

  async function saveInstrutor() {
    if (!instrutorForm.nome.trim()) return setInstrutorError('Nome do instrutor é obrigatório.');

    setIsSavingInstrutor(true);
    setInstrutorError(null);

    try {
      const payload = { nome_instrutor: instrutorForm.nome.trim() };
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
    } finally {
      setIsSavingInstrutor(false);
    }
  }

  function requestDeleteInstrutor(instrutor: Instrutor) {
    const count = turmas.filter(t => 
      t.instrutorNome.toLowerCase() === instrutor.nome.toLowerCase() || 
      t.instrutorId === instrutor.id
    ).length;

    setDeleteModal({
      open: true,
      id: instrutor.id,
      name: instrutor.nome,
      type: 'instrutor',
      turmasCount: count,
      isDeleting: false
    });
  }

  // === MÉTODOS DE SALA ===
  function openSalaCreate() {
    setEditingSala(null);
    setSalaError(null);
    setSalaForm({
      nome: '',
      capacidade: 35,
      idTipoSala: tipoSalas[0]?.id ? Number(tipoSalas[0].id) : undefined,
      local: '',
      recursosEspeciais: ''
    });
    setSalaModalOpen(true);
  }

  function openSalaEdit(sala: Sala) {
    setEditingSala(sala);
    setSalaError(null);
    setSalaForm({
      id: sala.id,
      nome: sala.nome,
      capacidade: sala.capacidade,
      idTipoSala: sala.idTipoSala || (tipoSalas.find(t => t.nome === sala.tipo)?.id ? Number(tipoSalas.find(t => t.nome === sala.tipo)?.id) : undefined),
      local: (sala as any).local || '',
      recursosEspeciais: sala.recursosEspeciais || ''
    });
    setSalaModalOpen(true);
  }

  async function saveSala() {
    if (!salaForm.nome.trim()) return setSalaError('Nome da sala é obrigatório.');
    if (!salaForm.capacidade || Number(salaForm.capacidade) <= 0) return setSalaError('Capacidade deve ser maior que zero.');

    setIsSavingSala(true);
    setSalaError(null);

    try {
      const payload = {
        nome_sala: salaForm.nome.trim(),
        capacidade_maxima: Number(salaForm.capacidade),
        idTipo_sala: salaForm.idTipoSala ? Number(salaForm.idTipoSala) : undefined,
        local: salaForm.local?.trim() || null,
        recursos_especiais: salaForm.recursosEspeciais?.trim() || null
      };

      if (editingSala?.id) {
        await SalaService.update(Number(editingSala.id), payload);
        showToast('Sala atualizada com sucesso!', 'success');
      } else {
        await SalaService.create(payload);
        showToast('Sala criada com sucesso!', 'success');
      }
      refreshSalas();
      setSalaModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar sala no backend.';
      setSalaError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSavingSala(false);
    }
  }

  function requestDeleteSala(sala: Sala) {
    const count = turmas.filter(t => t.salaId === sala.id).length;

    setDeleteModal({
      open: true,
      id: sala.id,
      name: sala.nome,
      type: 'sala',
      turmasCount: count,
      isDeleting: false
    });
  }

  async function executeDelete() {
    if (!deleteModal.id) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      if (deleteModal.type === 'curso') {
        await CursoService.delete(Number(deleteModal.id));
        showToast('Curso excluído com sucesso!', 'success');
        refreshCursos();
        refreshTurmas();
      } else if (deleteModal.type === 'instrutor') {
        await InstrutorService.delete(Number(deleteModal.id));
        showToast('Instrutor excluído com sucesso!', 'success');
        refreshInstrutores();
      } else if (deleteModal.type === 'sala') {
        await SalaService.delete(Number(deleteModal.id));
        showToast('Sala excluída com sucesso!', 'success');
        refreshSalas();
        refreshTurmas();
      }
      setDeleteModal(prev => ({ ...prev, open: false, isDeleting: false }));
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || `Erro ao excluir ${deleteModal.type}.`;
      showToast(msg, 'error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  }

  // Helpers
  function getNomeInstrutor(id?: string) { 
    return instrutores.find(i => i.id === id)?.nome ?? id ?? 'Instrutor Padrão'; 
  }

  function getInitials(name: string) {
    if (!name || name === '-') return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  // Listas Filtradas
  const filteredCursos = useMemo(() => {
    return cursos.filter(c => {
      const matchText = 
        c.nome.toLowerCase().includes(searchCurso.toLowerCase()) || 
        (c.codigoTurmaPadrao && c.codigoTurmaPadrao.toLowerCase().includes(searchCurso.toLowerCase())) ||
        (c.unidade && c.unidade.toLowerCase().includes(searchCurso.toLowerCase())) ||
        (c.segmento && c.segmento.toLowerCase().includes(searchCurso.toLowerCase()));

      const matchModality = filtroModalidadeCurso === 'Todas' || c.modalidade === filtroModalidadeCurso;
      const matchUnidade = filtroUnidadeCurso === 'Todas' || c.unidade === filtroUnidadeCurso;

      return matchText && matchModality && matchUnidade;
    });
  }, [cursos, searchCurso, filtroModalidadeCurso, filtroUnidadeCurso]);

  const filteredInstrutores = useMemo(() => {
    return instrutores.filter(i => 
      i.nome.toLowerCase().includes(searchInstrutor.toLowerCase())
    );
  }, [instrutores, searchInstrutor]);

  const filteredSalas = useMemo(() => {
    return salas.filter(s => {
      const matchText = s.nome.toLowerCase().includes(searchSala.toLowerCase()) ||
        s.tipo.toLowerCase().includes(searchSala.toLowerCase()) ||
        (s.recursosEspeciais && s.recursosEspeciais.toLowerCase().includes(searchSala.toLowerCase()));
      const matchTipo = filtroTipoSala === 'Todos' || s.tipo === filtroTipoSala;
      return matchText && matchTipo;
    });
  }, [salas, searchSala, filtroTipoSala]);

  // Paginação
  const paginatedCursos = useMemo(() => {
    const start = (pageCursos - 1) * ITEMS_PER_PAGE;
    return filteredCursos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCursos, pageCursos]);

  const totalPagesCursos = Math.max(1, Math.ceil(filteredCursos.length / ITEMS_PER_PAGE));

  const paginatedInstrutores = useMemo(() => {
    const start = (pageInstrutores - 1) * ITEMS_PER_PAGE;
    return filteredInstrutores.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInstrutores, pageInstrutores]);

  const totalPagesInstrutores = Math.max(1, Math.ceil(filteredInstrutores.length / ITEMS_PER_PAGE));

  const paginatedSalas = useMemo(() => {
    const start = (pageSalas - 1) * ITEMS_PER_PAGE;
    return filteredSalas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSalas, pageSalas]);

  const totalPagesSalas = Math.max(1, Math.ceil(filteredSalas.length / ITEMS_PER_PAGE));

  // Lista de unidades únicas para filtro
  const unidadesDisponiveis = useMemo(() => {
    const setU = new Set<string>();
    cursos.forEach(c => { if (c.unidade) setU.add(c.unidade); });
    return Array.from(setU);
  }, [cursos]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-350">
      
      {/* Título e Ação Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-primary tracking-tight">Gerenciamento Educacional</h1>
          <p className="text-text-muted text-sm mt-1 font-medium">Gestão unificada de Cursos, Instrutores e Ambientes.</p>
        </div>
        
        <div className="shrink-0 flex items-center gap-2">
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
          {activeTab === 'salas' && (
            <button 
              onClick={openSalaCreate} 
              className="w-full sm:w-auto bg-primary text-white font-black py-2.5 px-5 rounded-xl shadow-md btn-tactile hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Plus size={16} /> Adicionar Sala
            </button>
          )}
        </div>
      </div>

      {/* Navegação de Abas com Contadores Numéricos */}
      <div className="glass-panel rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1.5 overflow-x-auto scrollbar-none transition-colors duration-300">
        <button 
          onClick={() => { setActiveTab('cursos'); setPageCursos(1); }} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all btn-tactile cursor-pointer border ${
            activeTab === 'cursos' 
              ? 'bg-primary/10 text-primary border-primary/20 shadow-sm font-black' 
              : 'text-text-muted hover:text-text-main hover:bg-surface border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4" /> 
          <span>Cursos</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
            activeTab === 'cursos' ? 'bg-primary text-white' : 'bg-surface text-text-muted border border-border'
          }`}>
            {cursos.length}
          </span>
        </button>

        <button 
          onClick={() => { setActiveTab('instrutores'); setPageInstrutores(1); }} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all btn-tactile cursor-pointer border ${
            activeTab === 'instrutores' 
              ? 'bg-primary/10 text-primary border-primary/20 shadow-sm font-black' 
              : 'text-text-muted hover:text-text-main hover:bg-surface border-transparent'
          }`}
        >
          <Users className="w-4 h-4" /> 
          <span>Instrutores</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
            activeTab === 'instrutores' ? 'bg-primary text-white' : 'bg-surface text-text-muted border border-border'
          }`}>
            {instrutores.length}
          </span>
        </button>

        <button 
          onClick={() => { setActiveTab('salas'); setPageSalas(1); }} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all btn-tactile cursor-pointer border ${
            activeTab === 'salas' 
              ? 'bg-primary/10 text-primary border-primary/20 shadow-sm font-black' 
              : 'text-text-muted hover:text-text-main hover:bg-surface border-transparent'
          }`}
        >
          <School className="w-4 h-4" /> 
          <span>Salas e Ambientes</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
            activeTab === 'salas' ? 'bg-primary text-white' : 'bg-surface text-text-muted border border-border'
          }`}>
            {salas.length}
          </span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="relative z-10 transition-all duration-300">
        
        {/* ================= ABA DE CURSOS ================= */}
        {activeTab === 'cursos' && (
          <div className="flex flex-col gap-6 w-full">
            
            {/* Barra de Busca e Filtros Rápidos */}
            <div className="glass-panel rounded-2xl p-4 border border-border/75 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, código da turma, segmento ou unidade..."
                  value={searchCurso}
                  onChange={e => { setSearchCurso(e.target.value); setPageCursos(1); }}
                  className="w-full bg-input text-text-main text-sm font-semibold outline-none border border-border rounded-xl pl-10 pr-10 py-2.5 focus:border-primary transition-all"
                />
                {searchCurso && (
                  <button
                    onClick={() => { setSearchCurso(''); setPageCursos(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1 rounded-md"
                    title="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Pílulas de Filtro por Modalidade */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Todas', 'Presencial', 'Semi-Presencial', 'Remoto'].map(mod => (
                  <button
                    key={mod}
                    onClick={() => { setFiltroModalidadeCurso(mod); setPageCursos(1); }}
                    className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                      filtroModalidadeCurso === mod
                        ? 'bg-primary text-white border-primary shadow-xs font-black'
                        : 'bg-surface text-text-muted hover:text-text-main border-border'
                    }`}
                  >
                    {mod}
                  </button>
                ))}

                {/* Dropdown de Unidades */}
                {unidadesDisponiveis.length > 0 && (
                  <select
                    value={filtroUnidadeCurso}
                    onChange={e => { setFiltroUnidadeCurso(e.target.value); setPageCursos(1); }}
                    className="bg-surface text-text-main border border-border text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="Todas">Todas Unidades</option>
                    {unidadesDisponiveis.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Skeleton Loading ou Grid de Cursos */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="glass-panel rounded-3xl p-5 border border-border/60 animate-pulse flex flex-col gap-4">
                    <div className="h-5 bg-border/50 rounded-lg w-1/3"></div>
                    <div className="h-6 bg-border/50 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-border/30 rounded-lg w-1/2"></div>
                    <div className="h-10 bg-border/40 rounded-xl mt-4"></div>
                  </div>
                ))}
              </div>
            ) : filteredCursos.length === 0 ? (
              <div className="glass-panel rounded-3xl py-14 px-6 text-center flex flex-col items-center justify-center gap-3 border border-border/80">
                <BookOpen className="w-10 h-10 text-text-muted/60" />
                <h3 className="text-base font-black text-text-main">Nenhum curso encontrado</h3>
                <p className="text-xs text-text-muted max-w-md">
                  {searchCurso || filtroModalidadeCurso !== 'Todas' || filtroUnidadeCurso !== 'Todas'
                    ? 'Tente ajustar os filtros ou o termo de pesquisa digitado.'
                    : 'Cadastre o primeiro curso para iniciar o planejamento das turmas.'}
                </p>
                <button
                  onClick={openCursoCreate}
                  className="mt-2 bg-primary text-white text-xs font-black py-2 px-4 rounded-xl shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Cadastrar Curso
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCursos.map(c => {
                    const instrutorNome = getNomeInstrutor(c.instrutorId);
                    const iniciais = getInitials(instrutorNome);
                    
                    return (
                      <div key={c.id} className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-5 border border-border/70 hover-glow-primary transition-all duration-300 group/card relative overflow-hidden">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border tracking-wider uppercase ${
                            c.modalidade === 'Presencial' 
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : c.modalidade === 'Remoto'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                            {c.modalidade}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="bg-surface/70 border border-border/80 text-primary font-black px-2 py-0.5 rounded-lg text-[9px] tracking-wide font-mono">
                              {c.cargaHoraria || 160}h
                            </span>
                            {c.unidade && (
                              <span className="bg-surface/50 border border-border/80 text-text-muted font-bold px-2 py-0.5 rounded-lg text-[9px] tracking-wide uppercase">
                                {c.unidade}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          {c.segmento && (
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{c.segmento}</span>
                          )}
                          <h3 className="text-base font-black text-text-main leading-snug tracking-tight font-display group-hover/card:text-primary transition-colors">
                            {c.nome}
                          </h3>
                          {c.codigoTurmaPadrao && (
                            <span className="text-[10px] font-bold text-text-muted font-mono mt-0.5">
                              Cód. Padrão: {c.codigoTurmaPadrao}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-3.5 border-t border-border/50">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-xs flex items-center justify-center tracking-tight shadow-xs uppercase shrink-0">
                            {iniciais}
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
                            onClick={() => requestDeleteCurso(c)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-655 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginação de Cursos */}
                {totalPagesCursos > 1 && (
                  <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-border/70 text-xs font-bold">
                    <span className="text-text-muted">
                      Mostrando {paginatedCursos.length} de {filteredCursos.length} cursos
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={pageCursos === 1}
                        onClick={() => setPageCursos(p => Math.max(1, p - 1))}
                        className="p-2 rounded-xl border border-border hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-text-main font-black px-2">
                        Página {pageCursos} de {totalPagesCursos}
                      </span>
                      <button
                        disabled={pageCursos === totalPagesCursos}
                        onClick={() => setPageCursos(p => Math.min(totalPagesCursos, p + 1))}
                        className="p-2 rounded-xl border border-border hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= ABA DE INSTRUTORES ================= */}
        {activeTab === 'instrutores' && (
          <div className="flex flex-col gap-6 w-full">
            
            {/* Barra de Busca de Instrutores */}
            <div className="glass-panel rounded-2xl p-4 border border-border/75 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Pesquisar instrutores pelo nome..."
                  value={searchInstrutor}
                  onChange={e => { setSearchInstrutor(e.target.value); setPageInstrutores(1); }}
                  className="w-full bg-input text-text-main text-sm font-semibold outline-none border border-border rounded-xl pl-10 pr-10 py-2.5 focus:border-primary transition-all"
                />
                {searchInstrutor && (
                  <button
                    onClick={() => { setSearchInstrutor(''); setPageInstrutores(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1 rounded-md"
                    title="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Skeleton Loading ou Grid de Instrutores */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="glass-panel rounded-3xl p-5 border border-border/60 animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-border/50 shrink-0"></div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 bg-border/50 rounded w-1/3"></div>
                      <div className="h-5 bg-border/50 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredInstrutores.length === 0 ? (
              <div className="glass-panel rounded-3xl py-14 px-6 text-center flex flex-col items-center justify-center gap-3 border border-border/80">
                <Users className="w-10 h-10 text-text-muted/60" />
                <h3 className="text-base font-black text-text-main">Nenhum instrutor encontrado</h3>
                <p className="text-xs text-text-muted max-w-md">
                  {searchInstrutor ? 'Nenhum instrutor corresponde ao termo digitado.' : 'Cadastre instrutores para atribuí-los aos cursos e turmas.'}
                </p>
                <button
                  onClick={openInstrutorCreate}
                  className="mt-2 bg-primary text-white text-xs font-black py-2 px-4 rounded-xl shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Cadastrar Instrutor
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedInstrutores.map(i => {
                    const iniciais = getInitials(i.nome);

                    return (
                      <div key={i.id} className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-5 border border-border/70 hover-glow-primary transition-all duration-300 group/card">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 text-primary font-black text-sm flex items-center justify-center shadow-xs shrink-0 uppercase font-display">
                            {iniciais}
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
                            onClick={() => requestDeleteInstrutor(i)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-655 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginação de Instrutores */}
                {totalPagesInstrutores > 1 && (
                  <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-border/70 text-xs font-bold">
                    <span className="text-text-muted">
                      Mostrando {paginatedInstrutores.length} de {filteredInstrutores.length} instrutores
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={pageInstrutores === 1}
                        onClick={() => setPageInstrutores(p => Math.max(1, p - 1))}
                        className="p-2 rounded-xl border border-border hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-text-main font-black px-2">
                        Página {pageInstrutores} de {totalPagesInstrutores}
                      </span>
                      <button
                        disabled={pageInstrutores === totalPagesInstrutores}
                        onClick={() => setPageInstrutores(p => Math.min(totalPagesInstrutores, p + 1))}
                        className="p-2 rounded-xl border border-border hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= ABA DE SALAS ================= */}
        {activeTab === 'salas' && (
          <div className="flex flex-col gap-6 w-full">
            
            {/* Barra de Busca e Filtro de Salas */}
            <div className="glass-panel rounded-2xl p-4 border border-border/75 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome da sala, tipo ou recursos..."
                  value={searchSala}
                  onChange={e => { setSearchSala(e.target.value); setPageSalas(1); }}
                  className="w-full bg-input text-text-main text-sm font-semibold outline-none border border-border rounded-xl pl-10 pr-10 py-2.5 focus:border-primary transition-all"
                />
                {searchSala && (
                  <button
                    onClick={() => { setSearchSala(''); setPageSalas(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1 rounded-md"
                    title="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtro por Tipo de Sala */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  value={filtroTipoSala}
                  onChange={e => { setFiltroTipoSala(e.target.value); setPageSalas(1); }}
                  className="bg-surface text-text-main border border-border text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="Todos">Todos os Tipos de Sala</option>
                  {tipoSalas.map(t => (
                    <option key={t.id} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skeleton Loading ou Grid de Salas */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="glass-panel rounded-3xl p-5 border border-border/60 animate-pulse flex flex-col gap-4">
                    <div className="h-5 bg-border/50 rounded-lg w-1/3"></div>
                    <div className="h-6 bg-border/50 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-border/30 rounded-lg w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredSalas.length === 0 ? (
              <div className="glass-panel rounded-3xl py-14 px-6 text-center flex flex-col items-center justify-center gap-3 border border-border/80">
                <School className="w-10 h-10 text-text-muted/60" />
                <h3 className="text-base font-black text-text-main">Nenhuma sala encontrada</h3>
                <p className="text-xs text-text-muted max-w-md">
                  {searchSala || filtroTipoSala !== 'Todos'
                    ? 'Tente ajustar os filtros ou a pesquisa de salas.'
                    : 'Cadastre a primeira sala para permitir alocações no calendário.'}
                </p>
                <button
                  onClick={openSalaCreate}
                  className="mt-2 bg-primary text-white text-xs font-black py-2 px-4 rounded-xl shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Cadastrar Sala
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedSalas.map(s => (
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

                        {/* Recursos Especiais */}
                        {s.recursosEspeciais && (
                          <div className="bg-surface/60 border border-border/60 rounded-xl p-2 text-[11px] text-text-muted font-medium line-clamp-2">
                            💡 {s.recursosEspeciais}
                          </div>
                        )}
                      </div>

                      {/* Capacidade e Ações */}
                      <div className="pt-3.5 border-t border-border/50 flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
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

                        {/* Botões de Ação da Sala */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                          <button 
                            onClick={() => openSalaEdit(s)}
                            className="bg-card hover:bg-surface border border-border text-text-muted hover:text-text-main font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Edit size={12} /> Editar
                          </button>
                          <button 
                            onClick={() => requestDeleteSala(s)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-655 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 btn-tactile cursor-pointer shadow-xs"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação de Salas */}
                {totalPagesSalas > 1 && (
                  <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-border/70 text-xs font-bold">
                    <span className="text-text-muted">
                      Mostrando {paginatedSalas.length} de {filteredSalas.length} salas
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={pageSalas === 1}
                        onClick={() => setPageSalas(p => Math.max(1, p - 1))}
                        className="p-2 rounded-xl border border-border hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-text-main font-black px-2">
                        Página {pageSalas} de {totalPagesSalas}
                      </span>
                      <button
                        disabled={pageSalas === totalPagesSalas}
                        onClick={() => setPageSalas(p => Math.min(totalPagesSalas, p + 1))}
                        className="p-2 rounded-xl border border-border hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* Modal de Cursos */}
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
        isSaving={isSavingCurso}
      />

      {/* Modal de Instrutores */}
      <InstrutorModal
        open={instrutorModalOpen}
        title={editingInstrutor ? 'Editar Instrutor' : 'Adicionar Instrutor'}
        error={instrutorError}
        onClose={() => setInstrutorModalOpen(false)}
        onSave={saveInstrutor}
        form={instrutorForm}
        setForm={setInstrutorForm}
        isSaving={isSavingInstrutor}
      />

      {/* Modal de Salas */}
      <SalaModal
        open={salaModalOpen}
        title={editingSala ? 'Editar Sala' : 'Adicionar Sala'}
        error={salaError}
        onClose={() => setSalaModalOpen(false)}
        onSave={saveSala}
        form={salaForm}
        setForm={setSalaForm}
        tiposSala={tipoSalas}
        isSaving={isSavingSala}
      />

      {/* Modal de Confirmação Segura de Exclusão */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        title={`Excluir ${deleteModal.type === 'curso' ? 'Curso' : deleteModal.type === 'instrutor' ? 'Instrutor' : 'Ambiente'}`}
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        activeTurmasCount={deleteModal.turmasCount}
        onConfirm={executeDelete}
        onClose={() => setDeleteModal(prev => ({ ...prev, open: false }))}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}
