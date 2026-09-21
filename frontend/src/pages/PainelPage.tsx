import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Users, 
  BookOpen, 
  Tv, 
  Minimize2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Building,
  MapPin,
  Sparkles,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { useAppContext, Sala, TurmaDetalhada } from '../context/AppContext';
import { TurmaService } from '../api/client';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { DigitalClock } from '../components/painel/DigitalClock';
import { NovoAgendamentoModal } from '../components/painel/NovoAgendamentoModal';
import { EditTurmaModal } from '../components/painel/EditTurmaModal';

export function PainelPage() {
  const { salas, turmas, cursos, instrutores, refreshTurmas, showToast } = useAppContext();

  // Preferências Persistidas em LocalStorage
  const [filtroTipo, setFiltroTipo] = useState(() => {
    return localStorage.getItem('sgst_painel_tipo_sala') || 'Todos';
  });

  const [filtroModalidade, setFiltroModalidade] = useState<'Todas' | 'Presencial' | 'Remoto'>(() => {
    return (localStorage.getItem('sgst_painel_modalidade') as 'Todas' | 'Presencial' | 'Remoto') || 'Todas';
  });

  const [modoVisualizacao, setModoVisualizacao] = useState<'semanal' | 'diario'>(() => {
    return (localStorage.getItem('sgst_painel_modo') as 'semanal' | 'diario') || 'semanal';
  });

  const handleSetFiltroTipo = (tipo: string) => {
    setFiltroTipo(tipo);
    localStorage.setItem('sgst_painel_tipo_sala', tipo);
  };

  const handleSetFiltroModalidade = (mod: 'Todas' | 'Presencial' | 'Remoto') => {
    setFiltroModalidade(mod);
    localStorage.setItem('sgst_painel_modalidade', mod);
  };

  const handleSetModoVisualizacao = (modo: 'semanal' | 'diario') => {
    setModoVisualizacao(modo);
    localStorage.setItem('sgst_painel_modo', modo);
  };

  // Controle Temporal: Data Diária & Data Base da Semana
  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataBaseSemana, setDataBaseSemana] = useState(() => new Date().toISOString().split('T')[0]);

  // Filtros de Pesquisa e Unidade
  const [searchTurma, setSearchTurma] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('Todas');

  // Estados do Modo TV e Escala
  const [modoTV, setModoTV] = useState(false);
  const [autoZoom, setAutoZoom] = useState(() => {
    const saved = localStorage.getItem('sgst_tv_zoom');
    return saved ? Number(saved) : 63;
  });

  const handleSetTvZoom = (newZoom: number) => {
    const clamped = Math.max(30, Math.min(100, newZoom));
    setAutoZoom(clamped);
    localStorage.setItem('sgst_tv_zoom', String(clamped));
  };

  // Estados de Salvamento e Exclusão Segura
  const [isSavingAlocacao, setIsSavingAlocacao] = useState(false);
  const [isDeletingAlocacao, setIsDeletingAlocacao] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; turma: any | null }>({
    open: false,
    turma: null
  });

  // Navegação de Semanas no Modo Semanal
  const getWeekRangeInfo = (dateStr: string) => {
    const baseDate = new Date(dateStr + 'T12:00:00');
    const day = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5);

    const f = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const year = endOfWeek.getFullYear();
    return {
      startOfWeek,
      endOfWeek,
      label: `Semana de ${f(startOfWeek)} a ${f(endOfWeek)}/${year}`
    };
  };

  const navSemanaAnterior = () => {
    const d = new Date(dataBaseSemana + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setDataBaseSemana(d.toISOString().split('T')[0]);
  };

  const navProximaSemana = () => {
    const d = new Date(dataBaseSemana + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setDataBaseSemana(d.toISOString().split('T')[0]);
  };

  const navHoje = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataBaseSemana(hoje);
    setDataFiltro(hoje);
  };

  // Lista de Unidades Disponíveis
  const unidadesDisponiveis = useMemo(() => {
    const setU = new Set<string>();
    turmas.forEach(t => { if (t.unidade) setU.add(t.unidade); });
    cursos.forEach(c => { if (c.unidade) setU.add(c.unidade); });
    return Array.from(setU);
  }, [turmas, cursos]);

  // Sincronizar Modo TV com fullscreen do navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement !== null;
      setModoTV(isFullscreen);
      if (isFullscreen) {
        document.documentElement.classList.add('modo-tv-active');
      } else {
        document.documentElement.classList.remove('modo-tv-active');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.documentElement.classList.remove('modo-tv-active');
    };
  }, []);

  // Alternar modo TV e Fullscreen
  const handleToggleModoTV = async () => {
    if (!modoTV) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          document.documentElement.classList.add('modo-tv-active');
        }
      } catch (err) {
        console.error("Erro ao entrar em tela cheia:", err);
        setModoTV(true);
        document.documentElement.classList.add('modo-tv-active');
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          document.documentElement.classList.remove('modo-tv-active');
        }
      } catch (err) {
        console.error("Erro ao sair da tela cheia:", err);
        setModoTV(false);
        document.documentElement.classList.remove('modo-tv-active');
      }
    }
  };

  // --- LÓGICA DO MODAL DE NOVO AGENDAMENTO ---
  const [modalOpen, setModalOpen] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({ 
    cursoId: '', 
    salaId: '', 
    dataInicio: new Date().toISOString().split('T')[0], 
    turno: 'Manhã',
    codigoTurma: '',
    diasSemana: ['1', '3', '5'] as string[],
    instrutorId: '',
    totalAlunos: 25
  });

  // --- LÓGICA DO MODAL DE EDIÇÃO E REALOCAÇÃO ---
  const [editTurmaModalOpen, setEditTurmaModalOpen] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<any>(null);
  const [dadosEdicao, setDadosEdicao] = useState({
    salaId: '',
    dataInicio: '',
    turno: 'Manhã',
    diasSemana: [] as string[],
    instrutorId: ''
  });

  // Atalhos Globais de Teclado (T = Modo TV, N = Nova Alocação, Esc = Sair)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';
      if (isInput) return;

      if ((e.key === 't' || e.key === 'T') && !modalOpen && !editTurmaModalOpen && !deleteModal.open) {
        e.preventDefault();
        handleToggleModoTV();
      } else if ((e.key === 'n' || e.key === 'N') && !modalOpen && !editTurmaModalOpen && !deleteModal.open) {
        e.preventDefault();
        setModalOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modoTV, modalOpen, editTurmaModalOpen, deleteModal.open]);

  // Helper: Verifica se a turma está ativa na semana selecionada
  const isTurmaActive = (dataInicioStr: string, dataFimStr: string) => {
    if (!dataInicioStr || !dataFimStr) return true;
    const inicio = new Date(dataInicioStr + 'T00:00:00');
    const fim = new Date(dataFimStr + 'T23:59:59');
    
    const baseDate = new Date(dataBaseSemana + 'T12:00:00');
    const day = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return (inicio <= endOfWeek && fim >= startOfWeek);
  };

  // Helper: Verifica se a turma está ativa presencialmente em uma data específica
  const isTurmaActiveOnDate = (turma: any, dateStr: string) => {
    if (!turma.dataInicio || !turma.dataFim) return true;
    const targetDate = new Date(dateStr + 'T00:00:00');
    const start = new Date(turma.dataInicio + 'T00:00:00');
    const end = new Date(turma.dataFim + 'T23:59:59');
    
    if (targetDate < start || targetDate > end) return false;
    
    const dayOfWeek = targetDate.getDay().toString();
    return turma.diasSemana.includes(dayOfWeek);
  };

  // Helper: Verifica se a turma atende à busca rápida
  const isTurmaMatchingSearch = (turma: any) => {
    if (!searchTurma.trim()) return true;
    const q = searchTurma.toLowerCase();
    return (
      (turma.codigo && turma.codigo.toLowerCase().includes(q)) ||
      (turma.cursoNome && turma.cursoNome.toLowerCase().includes(q)) ||
      (turma.instrutorNome && turma.instrutorNome.toLowerCase().includes(q)) ||
      (turma.unidade && turma.unidade.toLowerCase().includes(q))
    );
  };

  // Helper para buscar informações de uma sala
  const getSalaInfo = (salaId: string): Sala | undefined => {
    return salas.find(s => s.id === salaId);
  };

  // Helper para formatar data curta
  const formatDataCurta = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  // Formatação separada de dias presenciais e remotos
  const formatDiasSemanaSeparados = (presenciais: string[], remotos: string[]) => {
    const MAP_DIAS: { [key: string]: string } = { 
      '1': 'Seg', '2': 'Ter', '3': 'Qua', '4': 'Qui', '5': 'Sex', '6': 'Sáb', '0': 'Dom' 
    };
    
    const formataLista = (lista: string[]) => {
      if (!lista || lista.length === 0) return '';
      const sorted = [...lista].sort();
      
      const isSequencia = sorted.length > 2 && sorted.every((val, index) => {
        if (index === 0) return true;
        return Number(val) === Number(sorted[index - 1]) + 1;
      });
      
      if (isSequencia) {
        return `${MAP_DIAS[sorted[0]]} a ${MAP_DIAS[sorted[sorted.length - 1]]}`;
      }
      
      if (sorted.length === 1) return MAP_DIAS[sorted[0]];
      
      const todosMenosUltimo = sorted.slice(0, -1).map(d => MAP_DIAS[d]).join(', ');
      const ultimo = MAP_DIAS[sorted[sorted.length - 1]];
      return `${todosMenosUltimo} e ${ultimo}`;
    };

    const presStr = formataLista(presenciais);
    const remStr = formataLista(remotos);

    return {
      presencial: presStr || (remStr ? '' : 'Dias letivos padrão'),
      remoto: remStr
    };
  };

  // Cálculo Detalhado do Progresso das Aulas
  const calcularProgressoAulas = (dataInicioStr: string, dataFimStr: string, diasSemana: string[]) => {
    if (!dataInicioStr || !dataFimStr || !diasSemana || diasSemana.length === 0) {
      return { concluidas: 0, total: 0, porcentagem: 0 };
    }

    const inicio = new Date(dataInicioStr + 'T12:00:00');
    const fim = new Date(dataFimStr + 'T12:00:00');
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    let total = 0;
    let concluidas = 0;

    const current = new Date(inicio);
    while (current <= fim) {
      const dayOfWeek = current.getDay().toString();
      if (diasSemana.includes(dayOfWeek)) {
        total++;
        if (current <= hoje) {
          concluidas++;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (total === 0) total = 1;
    const porcentagem = Math.min(100, Math.round((concluidas / total) * 100));

    return { concluidas, total, porcentagem };
  };

  // =========================================================================
  // MOTOR DE DISPONIBILIDADE DE SALAS EM TEMPO REAL
  // =========================================================================
  const verificarDisponibilidadeSalas = (
    targetTurno: string,
    targetDataInicio: string,
    targetDiasSemana: string[],
    targetCursoId: string,
    ignoreTurmaId?: string
  ) => {
    if (!targetDataInicio || targetDiasSemana.length === 0) {
      return {
        salasLivres: salas,
        salasOcupadas: [],
        sugestoesTurnos: []
      };
    }

    const curso = cursos.find(c => c.id === targetCursoId);
    const cargaHoraria = curso?.cargaHoraria || 160;
    const classesNeeded = Math.ceil(cargaHoraria / 4);

    // Projeta as datas de aula da turma
    const targetDates: string[] = [];
    const current = new Date(targetDataInicio + 'T12:00:00');
    let count = 0;
    let safety = 0;
    while (count < classesNeeded && safety < 1000) {
      safety++;
      const dayOfWeek = current.getDay().toString();
      if (targetDiasSemana.includes(dayOfWeek)) {
        targetDates.push(current.toISOString().split('T')[0]);
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    const targetDateSet = new Set(targetDates);

    // Helper para verificar conflito de uma sala em um determinado turno
    const checarConflitoSala = (salaId: string, turno: string) => {
      for (const t of turmas) {
        if (ignoreTurmaId && t.id === ignoreTurmaId) continue;
        if (t.salaId !== salaId) continue;
        if (t.turno !== turno) continue;

        // Verifica sobreposição de datas com a turma t
        const tInicio = new Date(t.dataInicio + 'T12:00:00');
        const tFim = new Date(t.dataFim + 'T12:00:00');
        const tDias = t.diasSemana || [];

        const tDate = new Date(tInicio);
        while (tDate <= tFim) {
          const dayOfWeek = tDate.getDay().toString();
          const dateIso = tDate.toISOString().split('T')[0];
          if (tDias.includes(dayOfWeek) && targetDateSet.has(dateIso)) {
            return {
              conflito: true,
              turmaConflito: t,
              dataConflito: dateIso
            };
          }
          tDate.setDate(tDate.getDate() + 1);
        }
      }
      return { conflito: false };
    };

    const salasLivres: Sala[] = [];
    const salasOcupadas: Array<{ sala: Sala; motivo: string }> = [];

    salas.forEach(sala => {
      const res = checarConflitoSala(sala.id, targetTurno);
      if (res.conflito && res.turmaConflito) {
        salasOcupadas.push({
          sala,
          motivo: `Ocupada por ${res.turmaConflito.codigo}`
        });
      } else {
        salasLivres.push(sala);
      }
    });

    // Sugestões de outros turnos se salasLivres for vazio
    const sugestoesTurnos: Array<{ turno: string; vagas: number }> = [];
    if (salasLivres.length === 0) {
      const outrosTurnos = ['Manhã', 'Tarde', 'Noite'].filter(t => t !== targetTurno);
      outrosTurnos.forEach(outroTurno => {
        const livres = salas.filter(sala => !checarConflitoSala(sala.id, outroTurno).conflito);
        if (livres.length > 0) {
          sugestoesTurnos.push({ turno: outroTurno, vagas: livres.length });
        }
      });
    }

    return { salasLivres, salasOcupadas, sugestoesTurnos };
  };

  // Disponibilidade em tempo real para o Modal de Nova Alocação
  const disponibilidadeNovo = useMemo(() => {
    return verificarDisponibilidadeSalas(
      novoAgendamento.turno,
      novoAgendamento.dataInicio,
      novoAgendamento.diasSemana,
      novoAgendamento.cursoId
    );
  }, [novoAgendamento.turno, novoAgendamento.dataInicio, novoAgendamento.diasSemana, novoAgendamento.cursoId, salas, turmas, cursos]);

  // Disponibilidade em tempo real para o Modal de Edição (ignora a própria turma)
  const disponibilidadeEdicao = useMemo(() => {
    if (!turmaEditando) return { salasLivres: salas, salasOcupadas: [], sugestoesTurnos: [] };
    const curso = cursos.find(c => c.nome === turmaEditando.cursoNome);
    return verificarDisponibilidadeSalas(
      dadosEdicao.turno,
      dadosEdicao.dataInicio,
      dadosEdicao.diasSemana,
      curso?.id || '',
      turmaEditando.id
    );
  }, [dadosEdicao.turno, dadosEdicao.dataInicio, dadosEdicao.diasSemana, turmaEditando, salas, turmas, cursos]);

  const salaSelecionadaNovo = useMemo(() => {
    return salas.find(s => s.id === novoAgendamento.salaId);
  }, [salas, novoAgendamento.salaId]);

  const capacidadeExcedidaNovo = Boolean(
    salaSelecionadaNovo && Number(novoAgendamento.totalAlunos) > salaSelecionadaNovo.capacidade
  );

  const handleCursoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    const curso = cursos.find(c => c.id === cid);
    if (curso) {
      setNovoAgendamento(prev => ({
        ...prev,
        cursoId: cid,
        codigoTurma: curso.codigoTurmaPadrao || '',
        turno: curso.turnoPadrao || 'Manhã',
        diasSemana: curso.diasSemana && curso.diasSemana.length > 0 ? curso.diasSemana : ['1', '2', '3', '4', '5'],
        instrutorId: curso.instrutorId || ''
      }));
    } else {
      setNovoAgendamento(prev => ({ ...prev, cursoId: cid }));
    }
  };

  const handleCriarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    const cursoSelecionado = cursos.find(c => c.id === novoAgendamento.cursoId);
    if (!cursoSelecionado || !novoAgendamento.dataInicio || !novoAgendamento.salaId) return;

    if (novoAgendamento.diasSemana.length === 0) {
      showToast("Selecione pelo menos um dia letivo presencial para a turma.", "error");
      return;
    }

    const salaObj = salas.find(s => s.id === novoAgendamento.salaId);
    const totalAlunosNum = Number(novoAgendamento.totalAlunos) || 25;
    if (salaObj && totalAlunosNum > salaObj.capacidade) {
      showToast(`A sala ${salaObj.nome} comporta no máximo ${salaObj.capacidade} alunos. Total informado: ${totalAlunosNum}.`, "error");
      return;
    }

    setIsSavingAlocacao(true);
    try {
      await TurmaService.alocar({
        id_cursos: Number(cursoSelecionado.id),
        id_salas: Number(novoAgendamento.salaId),
        data_inicio: novoAgendamento.dataInicio,
        fk_id_turno: novoAgendamento.turno === 'Manhã' ? 1 : novoAgendamento.turno === 'Tarde' ? 2 : 3,
        total_alunos: totalAlunosNum,
        codigo_turma: novoAgendamento.codigoTurma,
        dias_semana: novoAgendamento.diasSemana,
        id_instrutores: novoAgendamento.instrutorId ? Number(novoAgendamento.instrutorId) : undefined
      });

      refreshTurmas();
      showToast("Turma alocada com sucesso!", "success");
      setModalOpen(false);
      setNovoAgendamento({ 
        cursoId: '', 
        salaId: '', 
        dataInicio: new Date().toISOString().split('T')[0], 
        turno: 'Manhã', 
        codigoTurma: '', 
        diasSemana: ['1', '3', '5'], 
        instrutorId: '',
        totalAlunos: 25
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao alocar turma.';
      showToast(msg, "error");
    } finally {
      setIsSavingAlocacao(false);
    }
  };

  const handleEditClick = (turma: any) => {
    setTurmaEditando(turma);
    setDadosEdicao({
      salaId: turma.salaId,
      dataInicio: turma.dataInicio,
      turno: turma.turno,
      diasSemana: turma.diasSemana && turma.diasSemana.length > 0 ? turma.diasSemana : ['1', '2', '3', '4', '5'],
      instrutorId: turma.instrutorId || ''
    });
    setEditTurmaModalOpen(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaEditando) return;
    
    setIsSavingAlocacao(true);
    try {
      await TurmaService.reallocar(Number(turmaEditando.id), {
        id_salas: Number(dadosEdicao.salaId),
        data_inicio: dadosEdicao.dataInicio,
        fk_id_turno: dadosEdicao.turno === 'Manhã' ? 1 : dadosEdicao.turno === 'Tarde' ? 2 : 3,
        dias_semana: dadosEdicao.diasSemana,
        id_instrutores: dadosEdicao.instrutorId ? Number(dadosEdicao.instrutorId) : undefined
      });
      refreshTurmas();
      showToast("Turma realocada com sucesso!", "success");
      setEditTurmaModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao realocar turma.';
      showToast(msg, "error");
    } finally {
      setIsSavingAlocacao(false);
    }
  };

  const requestDeleteTurma = () => {
    if (!turmaEditando) return;
    setDeleteModal({
      open: true,
      turma: turmaEditando
    });
  };

  const executeDeleteTurma = async () => {
    if (!deleteModal.turma) return;
    setIsDeletingAlocacao(true);

    try {
      await TurmaService.delete(Number(deleteModal.turma.id));
      refreshTurmas();
      showToast(`Alocação da turma ${deleteModal.turma.codigo} cancelada e excluída com sucesso!`, "success");
      setDeleteModal({ open: false, turma: null });
      setEditTurmaModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao excluir alocação.';
      showToast(msg, "error");
    } finally {
      setIsDeletingAlocacao(false);
    }
  };

  // Filtragem de Turmas por Turno
  const TURNOS = ['Manhã', 'Tarde', 'Noite'];

  const getTurmasPorTurno = (turno: string) => {
    return turmas.filter(t => {
      if (t.turno !== turno) return false;

      const matchModo = modoVisualizacao === 'semanal' 
        ? isTurmaActive(t.dataInicio, t.dataFim)
        : isTurmaActiveOnDate(t, dataFiltro);

      const matchUnidade = filtroUnidade === 'Todas' || t.unidade === filtroUnidade;
      const matchBusca = isTurmaMatchingSearch(t);

      // Filtro de modalidade (Presencial / Remoto)
      let matchModalidade = true;
      if (filtroModalidade === 'Presencial') {
        matchModalidade = t.modalidade !== 'Remoto';
      } else if (filtroModalidade === 'Remoto') {
        matchModalidade = t.modalidade === 'Remoto';
      }

      // Filtro de tipo de sala da turma
      let matchTipoSala = true;
      if (filtroTipo !== 'Todos') {
        const s = getSalaInfo(t.salaId);
        if (s) {
          if (filtroTipo === 'Inovadora') matchTipoSala = s.tipo.toLowerCase().includes('inovadora');
          else if (filtroTipo === 'TI') {
            const tp = s.tipo.toLowerCase();
            matchTipoSala = (tp.includes('ti') || tp.includes('t.i.')) && !tp.includes('multiuso');
          } else if (filtroTipo === 'Imagem') {
            const tp = s.tipo.toLowerCase();
            matchTipoSala = tp.includes('imagem') || tp.includes('moda') || tp.includes('multiuso');
          } else if (filtroTipo === 'Auditorio') {
            matchTipoSala = s.tipo.toLowerCase().includes('auditório') || s.tipo.toLowerCase().includes('auditorio');
          } else {
            matchTipoSala = s.tipo === filtroTipo;
          }
        }
      }

      return matchModo && matchUnidade && matchBusca && matchTipoSala && matchModalidade;
    });
  };

  // Contadores globais de turmas
  const { totalTurmasVisiveis, totalPresenciaisVisiveis, totalRemotasVisiveis } = useMemo(() => {
    let total = 0;
    let pres = 0;
    let rem = 0;
    TURNOS.forEach(turno => {
      const lista = getTurmasPorTurno(turno);
      total += lista.length;
      lista.forEach(t => {
        if (t.modalidade === 'Remoto') {
          rem++;
        } else {
          pres++;
        }
      });
    });
    return { totalTurmasVisiveis: total, totalPresenciaisVisiveis: pres, totalRemotasVisiveis: rem };
  }, [turmas, modoVisualizacao, dataBaseSemana, dataFiltro, filtroUnidade, searchTurma, filtroTipo, filtroModalidade]);

  const content = (
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${
      modoTV 
        ? 'fixed inset-0 z-50 bg-bg text-text-main p-0' 
        : 'relative bg-card border border-border rounded-2xl shadow-sm'
    }`}>
      
      {modoTV ? (
        /* ================= CABEÇALHO MODO TV ================= */
        <div className="flex justify-between items-center p-4 shrink-0 bg-card/40 border-b border-border/30 relative z-20 gap-3">
          {/* Relógio Digital Modularizado (Horário de Brasília) + Data */}
          <DigitalClock variant="tv" />

          {/* Título Central */}
          <div className="hidden md:flex items-center gap-2">
            <span className="font-display font-black text-sm uppercase tracking-widest text-secondary dark:text-primary">
              Senac Ceilândia
            </span>
            <span className="text-text-muted text-xs font-bold">•</span>
            <span className="font-display font-black text-sm uppercase tracking-widest text-text-main">
              Quadro de Ocupação & Mapa de Salas
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Total de Turmas em Andamento com Divisão Presencial e Remoto */}
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-xl text-primary shadow-xs text-xs font-black uppercase tracking-wider">
                Total: {totalTurmasVisiveis}
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-xl text-red-600 dark:text-red-400 shadow-xs text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-xs shadow-red-500/50"></span>
                Presenciais: {totalPresenciaisVisiveis}
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl text-blue-600 dark:text-blue-400 shadow-xs text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50"></span>
                Remotas: {totalRemotasVisiveis}
              </div>
            </div>

            {/* Seletor Rápido de Calibragem TV */}
            <div className="flex items-center gap-1 bg-surface/80 border border-border px-2 py-1 rounded-xl shadow-xs text-xs font-bold">
              <span className="text-text-muted text-[10px] uppercase font-black px-1">Escala TV:</span>
              <button 
                onClick={() => handleSetTvZoom(60)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${autoZoom === 60 ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main'}`}
                title="Ideal para TV 55 polegadas"
              >
                55" (60%)
              </button>
              <button 
                onClick={() => handleSetTvZoom(63)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${autoZoom === 63 ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main'}`}
                title="Ideal para TV 60 polegadas"
              >
                60" (63%)
              </button>
              <button 
                onClick={() => handleSetTvZoom(68)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${autoZoom === 68 ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main'}`}
                title="Ideal para TV 65 polegadas"
              >
                65" (68%)
              </button>
              <div className="flex items-center border-l border-border/60 pl-1 ml-1 gap-0.5">
                <button
                  onClick={() => handleSetTvZoom(autoZoom - 2)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-card text-text-muted hover:text-text-main font-black cursor-pointer"
                  title="Diminuir Zoom (-2%)"
                >
                  -
                </button>
                <span className="text-[10px] font-mono font-black text-primary px-1 min-w-[28px] text-center">
                  {autoZoom}%
                </span>
                <button
                  onClick={() => handleSetTvZoom(autoZoom + 2)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-card text-text-muted hover:text-text-main font-black cursor-pointer"
                  title="Aumentar Zoom (+2%)"
                >
                  +
                </button>
              </div>
            </div>
            
            <button
              onClick={handleToggleModoTV}
              title="Sair do Modo TV (Esc)"
              className="p-2 px-4 rounded-xl border flex items-center gap-1.5 text-xs font-black active:scale-95 transition-all shadow-sm cursor-pointer bg-input border-border text-text-main hover:bg-surface"
            >
              <Minimize2 size={14} /> Sair TV
            </button>
          </div>
        </div>
      ) : (
        /* ================= CABEÇALHO MODO PADRÃO ================= */
        <div className="p-6 border-b flex flex-col gap-4 shrink-0 transition-colors bg-card border-border">
          
          {/* Linha Superior: Título, Ações Principais e Relógio */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight text-secondary dark:text-primary transition-colors">
                <CalendarIcon className="text-primary w-6 h-6 shrink-0" /> 
                Quadro de Alocações
              </h1>
              <p className="text-sm mt-0.5 font-medium text-text-muted transition-colors">
                {modoVisualizacao === 'semanal' 
                  ? `${getWeekRangeInfo(dataBaseSemana).label} • Cursos em andamento` 
                  : `Filtro de Ocupação Diária para: ${new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR')}`
                }
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Relógio Digital Modularizado (Horário de Brasília) */}
              <DigitalClock variant="default" />

              {/* Botão de Nova Alocação */}
              <button 
                onClick={() => setModalOpen(true)}
                className="bg-primary text-white font-black py-2.5 px-4 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm cursor-pointer"
                title="Atalho: pressione N no teclado"
              >
                <Plus size={16} /> Alocar Turma
              </button>

              {/* Botão de Modo TV */}
              <button
                onClick={handleToggleModoTV}
                title="Entrar no Modo TV (Atalho: pressione T)"
                className="p-2.5 px-3.5 rounded-xl border flex items-center gap-1.5 text-sm font-bold active:scale-95 transition-all shadow-sm cursor-pointer bg-surface border-border text-text-muted hover:bg-border/30 hover:text-text-main"
              >
                <Tv size={16} /> Modo TV
              </button>
            </div>
          </div>

          {/* Linha Inferior: Controles de Navegação Temporal, Busca e Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
            
            {/* Bloco Esquerdo: Seletor de Modo + Navegação Temporal */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Alternador Semanal / Diário */}
              <div className="flex bg-surface p-1 rounded-xl border border-border shadow-xs">
                <button
                  onClick={() => handleSetModoVisualizacao('semanal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    modoVisualizacao === 'semanal' 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => handleSetModoVisualizacao('diario')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    modoVisualizacao === 'diario' 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Diário
                </button>
              </div>

              {/* Navegação Semanal */}
              {modoVisualizacao === 'semanal' && (
                <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border shadow-xs">
                  <button
                    onClick={navSemanaAnterior}
                    className="p-1.5 hover:bg-card rounded-lg text-text-muted hover:text-text-main cursor-pointer"
                    title="Semana Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-black text-text-main px-2 font-display">
                    {getWeekRangeInfo(dataBaseSemana).label}
                  </span>
                  <button
                    onClick={navProximaSemana}
                    className="p-1.5 hover:bg-card rounded-lg text-text-muted hover:text-text-main cursor-pointer"
                    title="Próxima Semana"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={navHoje}
                    className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border border-border/80 text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer transition-all ml-1"
                    title="Voltar para a semana atual"
                  >
                    Hoje
                  </button>
                </div>
              )}

              {/* Seletor de Data no Modo Diário */}
              {modoVisualizacao === 'diario' && (
                <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border shadow-xs">
                  <input 
                    type="date"
                    value={dataFiltro}
                    onChange={e => setDataFiltro(e.target.value)}
                    className="text-xs font-black border border-border rounded-lg px-2.5 py-1 outline-none transition-all bg-input text-text-main focus:border-primary cursor-pointer"
                  />
                  <button
                    onClick={navHoje}
                    className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border border-border/80 text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer transition-all"
                  >
                    Hoje
                  </button>
                </div>
              )}
            </div>

            {/* Bloco Direito: Busca Rápida, Filtro de Unidade e Tipo de Sala */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
              
              {/* Barra de Busca de Turmas */}
              <div className="relative min-w-[220px] max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar turma, curso ou instrutor..."
                  value={searchTurma}
                  onChange={e => setSearchTurma(e.target.value)}
                  className="w-full bg-input text-text-main text-xs font-semibold outline-none border border-border rounded-xl pl-9 pr-8 py-2 focus:border-primary transition-all shadow-xs"
                />
                {searchTurma && (
                  <button
                    onClick={() => setSearchTurma('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-0.5 rounded-md cursor-pointer"
                    title="Limpar busca"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filtro de Unidade */}
              {unidadesDisponiveis.length > 0 && (
                <div className="flex items-center gap-1 bg-surface border border-border rounded-xl px-2 py-1 shadow-xs">
                  <Building size={12} className="text-text-muted shrink-0" />
                  <select
                    value={filtroUnidade}
                    onChange={e => setFiltroUnidade(e.target.value)}
                    className="bg-transparent text-text-main border-none text-xs font-bold outline-none cursor-pointer pr-1"
                  >
                    <option value="Todas" className="bg-card text-text-main">Todas Unidades</option>
                    {unidadesDisponiveis.map(u => (
                      <option key={u} value={u} className="bg-card text-text-main">{u}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro de Modalidade (Presencial / Remoto) */}
              <div className="flex bg-surface p-1 rounded-xl border border-border shadow-xs flex-wrap gap-1">
                {(['Todas', 'Presencial', 'Remoto'] as const).map(mod => (
                  <button
                    key={mod}
                    onClick={() => handleSetFiltroModalidade(mod)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      filtroModalidade === mod
                        ? mod === 'Presencial'
                          ? 'bg-red-500 text-white shadow-xs font-black'
                          : mod === 'Remoto'
                            ? 'bg-blue-600 text-white shadow-xs font-black'
                            : 'bg-primary text-white shadow-xs font-black'
                        : 'text-text-muted hover:text-text-main hover:bg-card/50'
                    }`}
                  >
                    {mod === 'Presencial' && <span className={`w-2 h-2 rounded-full ${filtroModalidade === mod ? 'bg-white' : 'bg-red-500'}`}></span>}
                    {mod === 'Remoto' && <span className={`w-2 h-2 rounded-full ${filtroModalidade === mod ? 'bg-white' : 'bg-blue-500'}`}></span>}
                    {mod === 'Todas' ? 'Todas' : mod}
                  </button>
                ))}
              </div>

              {/* Filtro de Tipo de Sala */}
              <div className="flex bg-surface p-1 rounded-xl border border-border shadow-xs flex-wrap gap-1">
                {['Todos', 'Inovadora', 'TI', 'Imagem', 'Auditorio'].map(tipoId => (
                  <button
                    key={tipoId}
                    onClick={() => handleSetFiltroTipo(tipoId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filtroTipo === tipoId
                        ? 'bg-primary text-white shadow-xs font-black'
                        : 'text-text-muted hover:text-text-main hover:bg-card/50'
                    }`}
                  >
                    {tipoId === 'Todos' ? 'Todas Salas' : tipoId === 'Auditorio' ? 'Auditório' : tipoId}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= PAINEL PRINCIPAL POR TURNOS ================= */}
      <div 
        className={`flex-1 custom-scrollbar relative z-10 overflow-x-auto ${modoTV ? 'p-0 overflow-y-auto bg-bg' : 'p-4 overflow-y-auto'}`}
      >
        <div 
          className={`flex flex-col gap-6 transition-all duration-300 ${modoTV ? 'min-w-full' : 'w-full'}`}
          style={modoTV ? { 
            zoom: `${autoZoom}%`, 
            width: `${100 / (autoZoom / 100)}%`
          } : undefined}
        >
          {TURNOS.map((turno) => {
            // Cores e Borda do Turno
            let turnoBorderColor = 'border-l-8 border-l-primary';
            let turnoBgColor = 'bg-primary/5 dark:bg-primary/10 text-primary';
            let badgeBg = 'bg-primary/10 text-primary border-primary/20';

            if (turno === 'Tarde') {
              turnoBorderColor = 'border-l-8 border-l-amber-500';
              turnoBgColor = 'bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
              badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            } else if (turno === 'Noite') {
              turnoBorderColor = 'border-l-8 border-l-purple-600';
              turnoBgColor = 'bg-purple-600/5 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400';
              badgeBg = 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/20';
            }

            const turmasDoTurno = getTurmasPorTurno(turno);
            const turmasPresenciais = turmasDoTurno.filter(t => t.modalidade !== 'Remoto');
            const turmasRemotas = turmasDoTurno.filter(t => t.modalidade === 'Remoto');

            const gridClasses = modoTV 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4" 
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5";

            // Renderizador do Card de Turma com Divisão de Cores: Vermelho (Presencial) | Azul (Remoto)
            const renderCardTurma = (turma: any) => {
              const sala = getSalaInfo(turma.salaId);
              const { presencial, remoto } = formatDiasSemanaSeparados(turma.diasSemana, turma.diasRemotos);
              const { concluidas, total, porcentagem } = calcularProgressoAulas(turma.dataInicio, turma.dataFim, turma.diasSemana);

              const isRemoto = turma.modalidade === 'Remoto';
              const isSemInstrutor = !turma.instrutorNome || turma.instrutorNome.toLowerCase().includes('sem instrutor');
              const isHighlighted = searchTurma.trim() && isTurmaMatchingSearch(turma);

              // Estilos exclusivos para o Modo TV vs Modo Normal
              const cardProportionClass = modoTV 
                ? "aspect-[4/3.8] min-h-[320px] p-5.5 gap-3" 
                : "p-5 gap-3.5";
              const progressoFontClass = modoTV 
                ? "text-sm font-black text-text-muted" 
                : "text-[11px] font-black text-text-muted";
              const progressoPercentClass = modoTV 
                ? `text-base md:text-lg font-mono font-black ${isRemoto ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}` 
                : `text-[11px] font-mono font-black ${isRemoto ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`;
              const progressBarHeightClass = modoTV 
                ? "w-full h-3.5 md:h-4 rounded-full overflow-hidden bg-border/40 relative shadow-inner" 
                : "w-full h-2 rounded-full overflow-hidden bg-border/40 relative";

              // Divisão de cores estrita (Vermelho = Presencial | Azul = Remoto)
              const cardBorderColor = isRemoto 
                ? "border-l-4 border-l-blue-500 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.18)]" 
                : "border-l-4 border-l-red-500 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.18)]";

              const badgeCodigoClass = isRemoto
                ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";

              const hoverTitleClass = isRemoto
                ? "group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400"
                : "group-hover/card:text-red-600 dark:group-hover/card:text-red-400";

              const salaBoxClass = isRemoto
                ? "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300";

              const salaIcon = isRemoto
                ? <Tv size={14} className="shrink-0 text-blue-500" />
                : <MapPin size={14} className="shrink-0 text-red-500" />;

              const salaCapBadgeClass = isRemoto
                ? "text-blue-700 dark:text-blue-300 bg-blue-500/15"
                : "text-red-700 dark:text-red-300 bg-red-500/15";

              const progressBarFillClass = isRemoto ? "bg-blue-500" : "bg-red-500";
              const diasBorderClass = isRemoto ? "border-l-3 border-blue-500" : "border-l-3 border-red-500";

              return (
                <div
                  key={turma.id}
                  onClick={() => handleEditClick(turma)}
                  className={`glass-panel rounded-3xl shadow-xs border border-border/80 transition-all duration-200 cursor-pointer flex flex-col justify-between group/card bg-card/60 ${cardProportionClass} ${cardBorderColor} ${
                    isHighlighted ? (isRemoto ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-bg shadow-md' : 'ring-2 ring-red-500 ring-offset-2 ring-offset-bg shadow-md') : ''
                  }`}
                >
                  {/* 1. CÓDIGO DA TURMA (Nº DA TURMA DESTACADO) & BADGES */}
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <span className={`text-xs md:text-sm font-black tracking-wider px-3 py-1 rounded-xl border font-mono shadow-xs ${badgeCodigoClass}`}>
                      {turma.codigo}
                    </span>
                    
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {turma.cursoTem && (
                        <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-3xs">
                          TEM
                        </span>
                      )}
                      {isRemoto ? (
                        <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-3xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          Remoto
                        </span>
                      ) : (
                        <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-3xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          Presencial
                        </span>
                      )}
                      {isSemInstrutor && (
                        <span className="text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                          ⚠️ Sem Prof.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. NOME DO CURSO */}
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-base font-black text-text-main font-display leading-tight ${hoverTitleClass} transition-colors line-clamp-2`}>
                      {turma.cursoNome}
                    </h3>
                    {turma.unidade && (
                      <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-surface text-text-muted border border-border/80 w-fit">
                        {turma.unidade}
                      </span>
                    )}
                  </div>

                  {/* 3. DATA DE INÍCIO E FIM */}
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted bg-surface/60 px-3 py-2 rounded-xl border border-border/60">
                    <CalendarIcon className={`w-4 h-4 shrink-0 opacity-80 ${isRemoto ? 'text-blue-500' : 'text-red-500'}`} />
                    <span className="font-mono text-xs">
                      {formatDataCurta(turma.dataInicio)} - {formatDataCurta(turma.dataFim)}
                    </span>
                  </div>

                  {/* 4. DIAS LETIVOS DE AULA (PRESENCIAL EM VERMELHO, REMOTO EM AZUL) */}
                  <div className={`flex flex-col gap-1 text-xs font-bold ${diasBorderClass} pl-2.5 py-0.5 my-0.5`}>
                    {presencial && (
                      <div className="text-text-main flex items-baseline gap-1.5">
                        <span className="text-text-muted text-[11px] font-bold">Presencial:</span>
                        <span className="font-black text-red-600 dark:text-red-400">{presencial}</span>
                      </div>
                    )}
                    {remoto && (
                      <div className="text-text-main flex items-baseline gap-1.5">
                        <span className="text-text-muted text-[11px] font-bold">Remoto:</span>
                        <span className="font-black text-blue-600 dark:text-blue-400">{remoto}</span>
                      </div>
                    )}
                  </div>

                  {/* 5. AMBIENTE EM QUE A TURMA ESTÁ ALOCADA */}
                  <div className={`border px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-between gap-2 font-display shadow-3xs ${salaBoxClass}`}>
                    <div className="flex items-center gap-2 truncate">
                      {salaIcon}
                      <span className="truncate">{sala?.nome || (isRemoto ? 'Ambiente Virtual / Remoto' : 'Ambiente não atribuído')}</span>
                    </div>
                    {sala?.capacidade && (
                      <span className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md ${salaCapBadgeClass}`}>
                        Cap: {sala.capacidade}
                      </span>
                    )}
                  </div>

                  {/* 6. NOME DO PROFESSOR */}
                  <div className="flex items-center gap-2 text-xs font-bold text-text-main pt-2.5 border-t border-dashed border-border/60">
                    <Users className="w-4 h-4 text-text-muted shrink-0 opacity-80" />
                    <span className="truncate font-semibold">{turma.instrutorNome || 'Sem Instrutor'}</span>
                  </div>

                  {/* 7. PROGRESSO DA TURMA */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className={progressoFontClass}>{concluidas}/{total} aulas concluídas</span>
                      <span className={progressoPercentClass}>{porcentagem}%</span>
                    </div>
                    <div className={progressBarHeightClass}>
                      <div 
                        className={`absolute inset-y-0 left-0 ${progressBarFillClass} transition-all duration-500 rounded-full`}
                        style={{ width: `${porcentagem}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            };

            return (
              <div 
                key={turno} 
                className={`glass-panel rounded-3xl overflow-hidden shadow-xs border border-border/80 flex flex-col md:flex-row transition-all duration-300 ${turnoBorderColor}`}
              >
                {/* COLUNA FIXA DO TURNO NA ESQUERDA */}
                <div className={`md:w-44 shrink-0 p-5 flex md:flex-col items-center justify-between md:justify-center gap-3.5 border-b md:border-b-0 md:border-r border-border/60 ${turnoBgColor}`}>
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-75 font-mono">Turno</span>
                    <h2 className="text-xl font-black uppercase tracking-wider font-display mt-0.5">
                      {turno}
                    </h2>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-full">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border uppercase tracking-wider font-mono w-full text-center ${badgeBg}`}>
                      {turmasDoTurno.length} {turmasDoTurno.length === 1 ? 'Turma' : 'Turmas'}
                    </span>
                    {turmasDoTurno.length > 0 && (
                      <div className="flex md:flex-col gap-1.5 w-full text-[10px] font-black">
                        <span className="flex-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 text-center flex items-center justify-center gap-1.5 shadow-3xs">
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                          {turmasPresenciais.length} Presencial{turmasPresenciais.length !== 1 ? 'is' : ''}
                        </span>
                        <span className="flex-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-center flex items-center justify-center gap-1.5 shadow-3xs">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                          {turmasRemotas.length} Remota{turmasRemotas.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ÁREA DE CARDS DE ALOCAÇÃO DO TURNO (ENQUADRAMENTO POR MODALIDADE) */}
                <div className="flex-1 p-5 bg-card/20 flex flex-col gap-6">
                  {turmasDoTurno.length === 0 ? (
                    <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-border/70 rounded-2xl bg-surface/30">
                      <Clock className="w-8 h-8 text-text-muted/60" />
                      <p className="text-xs font-bold text-text-muted">
                        Nenhuma turma alocada no turno da {turno} {searchTurma ? 'correspondente à pesquisa' : 'para o período selecionado'}.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* ENQUADRAMENTO PRESENCIAL (VERMELHO) */}
                      {turmasPresenciais.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between pb-2 border-b-2 border-red-500/30">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-red-500 shadow-xs shadow-red-500/50"></span>
                              <h3 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 font-display">
                                Turmas Presenciais ({turmasPresenciais.length})
                              </h3>
                            </div>
                            <span className="text-[10px] font-bold text-red-600/80 dark:text-red-400/80 bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-500/20">
                              Aulas em Sala Física
                            </span>
                          </div>
                          <div className={gridClasses}>
                            {turmasPresenciais.map(renderCardTurma)}
                          </div>
                        </div>
                      )}

                      {/* ENQUADRAMENTO REMOTO (AZUL) */}
                      {turmasRemotas.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500/30">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50"></span>
                              <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 font-display">
                                Turmas Remotas ({turmasRemotas.length})
                              </h3>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                              Aulas Remotas / Virtuais
                            </span>
                          </div>
                          <div className={gridClasses}>
                            {turmasRemotas.map(renderCardTurma)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL DE NOVA ALOCAÇÃO ================= */}
      <NovoAgendamentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCriarAgendamento}
        novoAgendamento={novoAgendamento}
        setNovoAgendamento={setNovoAgendamento}
        handleCursoChange={handleCursoChange}
        cursos={cursos}
        instrutores={instrutores}
        disponibilidadeNovo={disponibilidadeNovo}
        salaSelecionadaNovo={salaSelecionadaNovo}
        capacidadeExcedidaNovo={capacidadeExcedidaNovo}
        isSavingAlocacao={isSavingAlocacao}
      />

      {/* ================= MODAL DE EDIÇÃO E REALOCAÇÃO ================= */}
      <EditTurmaModal
        open={editTurmaModalOpen}
        onClose={() => setEditTurmaModalOpen(false)}
        onSave={handleSalvarEdicao}
        onRequestDelete={requestDeleteTurma}
        turma={turmaEditando}
        dadosEdicao={dadosEdicao}
        setDadosEdicao={setDadosEdicao}
        instrutores={instrutores}
        disponibilidadeEdicao={disponibilidadeEdicao}
        isSavingAlocacao={isSavingAlocacao}
        isDeletingAlocacao={isDeletingAlocacao}
      />

      {/* ================= MODAL DE EXCLUSÃO SEGURA ================= */}
      {deleteModal.open && deleteModal.turma && (
        <ConfirmDeleteModal
          open={deleteModal.open}
          title="Excluir Alocação da Turma"
          itemName={`${deleteModal.turma.codigo} - ${deleteModal.turma.cursoNome}`}
          itemType="alocação"
          activeTurmasCount={0}
          onConfirm={executeDeleteTurma}
          onClose={() => setDeleteModal({ open: false, turma: null })}
          isDeleting={isDeletingAlocacao}
        />
      )}
    </div>
  );

  if (modoTV) {
    return createPortal(content, document.body);
  }

  return content;
}
