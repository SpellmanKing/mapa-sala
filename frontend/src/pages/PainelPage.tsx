import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  Filter, 
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
  Building 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { TurmaService } from '../api/client';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

function obterOrdemSala(nome: string): number {
  const n = nome.toLowerCase();
  if (n.includes('(recanto)')) return 6;
  if (n.startsWith('sala ')) return 1;
  if (n.startsWith('laboratório de ti ')) return 2;
  if (n.startsWith('laboratório de imagem ')) return 3;
  if (n.includes('moda')) return 4;
  if (n.includes('auditório') || n.includes('auditorio')) return 5;
  return 99;
}

export function PainelPage() {
  const { salas, turmas, cursos, instrutores, refreshTurmas, showToast } = useAppContext();

  // Relógio Digital (Horário de Brasília)
  const [horaAtual, setHoraAtual] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHoraBrasilia = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    return new Intl.DateTimeFormat('pt-BR', options).format(date);
  };

  // Preferências Persistidas em LocalStorage
  const [filtroTipo, setFiltroTipo] = useState(() => {
    return localStorage.getItem('sgst_painel_tipo_sala') || 'Todos';
  });

  const [modoVisualizacao, setModoVisualizacao] = useState<'semanal' | 'diario'>(() => {
    return (localStorage.getItem('sgst_painel_modo') as 'semanal' | 'diario') || 'semanal';
  });

  const handleSetFiltroTipo = (tipo: string) => {
    setFiltroTipo(tipo);
    localStorage.setItem('sgst_painel_tipo_sala', tipo);
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

  // Estados do Modo TV e Scroll
  const [modoTV, setModoTV] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

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

  // Sincronizar o estado modoTV com o estado de fullscreen do navegador
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
  }, [modoTV, deleteModal.open]);

  // Efeito de Auto-Scroll horizontal no Modo TV
  useEffect(() => {
    if (!modoTV) return;

    let intervalId: any;
    let scrollDirection = 1;
    const scrollSpeed = 1;
    const stepTime = 30;

    intervalId = setInterval(() => {
      if (isPaused) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (maxScrollLeft <= 0) return;

      let newScrollLeft = container.scrollLeft + (scrollDirection * scrollSpeed);

      if (newScrollLeft >= maxScrollLeft) {
        newScrollLeft = maxScrollLeft;
        scrollDirection = -1;
      } else if (newScrollLeft <= 0) {
        newScrollLeft = 0;
        scrollDirection = 1;
      }

      container.scrollLeft = newScrollLeft;
    }, stepTime);

    return () => {
      clearInterval(intervalId);
    };
  }, [modoTV, isPaused]);

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

  // Progresso do curso
  const getProgress = (dataInicioStr: string, dataFimStr: string) => {
    if (!dataInicioStr || !dataFimStr) return 0;
    const inicio = new Date(dataInicioStr + 'T00:00:00').getTime();
    const fim = new Date(dataFimStr + 'T23:59:59').getTime();
    const hoje = new Date().getTime();
    if (hoje < inicio) return 0;
    if (hoje > fim) return 100;
    return Math.round(((hoje - inicio) / (fim - inicio)) * 100);
  };

  const formatDataCurta = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y.slice(-2)}`;
  };

  const formatDiasSemana = (presenciais: string[], remotos: string[]) => {
    const MAP_DIAS: { [key: string]: string } = { '1': 'Seg', '2': 'Ter', '3': 'Qua', '4': 'Qui', '5': 'Sex', '6': 'Sáb', '0': 'Dom' };
    
    const formataLista = (lista: string[]) => {
      if (lista.length === 0) return '';
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

    if (presStr && remStr) {
      return `${presStr} / ${remStr} remoto`;
    }
    if (presStr) return presStr;
    if (remStr) return `${remStr} remoto`;
    return 'Não definido';
  };

  // Filtragem de Salas
  const salasFiltradas = useMemo(() => {
    return salas
      .filter(s => {
        if (filtroTipo === 'Todos') return true;
        if (filtroTipo === 'Inovadora') return s.tipo.toLowerCase().includes('inovadora');
        if (filtroTipo === 'TI') {
          const t = s.tipo.toLowerCase();
          return (t.includes('ti') || t.includes('t.i.')) && !t.includes('multiuso');
        }
        if (filtroTipo === 'Imagem') {
          const t = s.tipo.toLowerCase();
          return t.includes('imagem') || t.includes('moda') || t.includes('multiuso');
        }
        if (filtroTipo === 'Auditorio') return s.tipo.toLowerCase().includes('auditório') || s.tipo.toLowerCase().includes('auditorio');
        return s.tipo === filtroTipo;
      })
      .sort((a, b) => {
        const ordemA = obterOrdemSala(a.nome);
        const ordemB = obterOrdemSala(b.nome);
        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }
        return a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' });
      });
  }, [salas, filtroTipo]);

  const countTodas = salas.length;
  const countInovadoras = salas.filter(s => s.tipo.toLowerCase().includes('inovadora')).length;
  const countTI = salas.filter(s => {
    const t = s.tipo.toLowerCase();
    return (t.includes('ti') || t.includes('t.i.')) && !t.includes('multiuso');
  }).length;
  const countImagem = salas.filter(s => {
    const t = s.tipo.toLowerCase();
    return t.includes('imagem') || t.includes('moda') || t.includes('multiuso');
  }).length;
  const countAuditorio = salas.filter(s => s.tipo.toLowerCase().includes('auditório') || s.tipo.toLowerCase().includes('auditorio')).length;

  const totalSalas = salasFiltradas.length;
  const TURNOS = ['Manhã', 'Tarde', 'Noite'];
  
  const minWidthSala = modoTV
    ? "min-w-[320px]"
    : totalSalas <= 6 
      ? "min-w-[200px]" 
      : totalSalas <= 10 
        ? "min-w-[150px]" 
        : "min-w-[125px]";

  const salaColClass = modoTV 
    ? `flex-1 ${minWidthSala}` 
    : "w-72 shrink-0";

  const salaNomeClass = modoTV 
    ? `font-bold ${totalSalas > 10 ? 'text-[10px] px-1.5 py-1' : 'text-xs px-2.5 py-1.5'} uppercase tracking-wider rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-xs font-display text-center leading-tight break-words`
    : "font-black text-sm uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-xs font-display";

  const salaDetalhesClass = modoTV
    ? `font-black uppercase flex flex-col items-center gap-0.5 text-text-muted ${totalSalas > 10 ? 'text-[8px]' : 'text-[9px]'}`
    : "text-[10px] font-black uppercase flex items-center gap-2 text-text-muted";

  const tipoSalaMaxW = modoTV 
    ? (totalSalas > 10 ? "max-w-[105px]" : "max-w-[125px]") 
    : "max-w-[130px]";

  const [autoZoom, setAutoZoom] = useState(() => {
    const saved = localStorage.getItem('sgst_tv_zoom');
    return saved ? Number(saved) : 63;
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const handleSetTvZoom = (newZoom: number) => {
    const clamped = Math.max(30, Math.min(100, newZoom));
    setAutoZoom(clamped);
    localStorage.setItem('sgst_tv_zoom', String(clamped));
  };

  useEffect(() => {
    if (!modoTV) {
      setAutoZoom(100);
      return;
    }
    const saved = localStorage.getItem('sgst_tv_zoom');
    if (saved) {
      setAutoZoom(Number(saved));
    } else {
      setAutoZoom(63);
    }
  }, [modoTV]);

  const obterTaxaOcupacao = () => {
    if (salasFiltradas.length === 0) return 0;
    const slotsTotais = salasFiltradas.length * 3;
    
    const turmasAtivas = turmas.filter(t => {
      const matchModo = modoVisualizacao === 'semanal' 
        ? isTurmaActive(t.dataInicio, t.dataFim)
        : isTurmaActiveOnDate(t, dataFiltro);
      const matchUnidade = filtroUnidade === 'Todas' || t.unidade === filtroUnidade;
      return matchModo && matchUnidade;
    });

    const slotsOcupados = new Set();
    turmasAtivas.forEach(t => {
      if (salasFiltradas.some(s => s.id === t.salaId)) {
        slotsOcupados.add(`${t.salaId}-${t.turno}`);
      }
    });

    return Math.round((slotsOcupados.size / slotsTotais) * 100);
  };

  const obterSubLinhasDoTurno = (turno: string) => {
    // Filtra as turmas do turno que estão ativas na visualização atual
    const turmasDoTurno = turmas.filter(t => {
      if (t.turno !== turno) return false;
      const matchModo = modoVisualizacao === 'semanal' 
        ? isTurmaActive(t.dataInicio, t.dataFim)
        : isTurmaActiveOnDate(t, dataFiltro);
      const matchUnidade = filtroUnidade === 'Todas' || t.unidade === filtroUnidade;
      const matchBusca = isTurmaMatchingSearch(t);
      return matchModo && matchUnidade && matchBusca;
    });

    // Distribui as turmas em sub-linhas virtuais sem conflito de salaId
    const subLinhas: any[][] = [];
    const turmasOrdenadas = [...turmasDoTurno].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));

    turmasOrdenadas.forEach(turma => {
      let linhaIndex = 0;
      let colocada = false;

      while (!colocada) {
        if (!subLinhas[linhaIndex]) {
          subLinhas[linhaIndex] = [];
        }

        const salaOcupada = subLinhas[linhaIndex].some(t => t.salaId === turma.salaId);

        if (!salaOcupada) {
          subLinhas[linhaIndex].push(turma);
          colocada = true;
        } else {
          linhaIndex++;
        }
      }
    });

    if (subLinhas.length === 0) {
      subLinhas.push([]);
    }

    return subLinhas;
  };

  // --- LÓGICA DO MODAL DE NOVO AGENDAMENTO ---
  const [modalOpen, setModalOpen] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({ 
    cursoId: '', 
    salaId: '', 
    dataInicio: '', 
    turno: 'Manhã',
    codigoTurma: '',
    diasSemana: [] as string[],
    instrutorId: ''
  });

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

    setIsSavingAlocacao(true);
    try {
      await TurmaService.alocar({
        id_cursos: Number(cursoSelecionado.id),
        id_salas: Number(novoAgendamento.salaId),
        data_inicio: novoAgendamento.dataInicio,
        fk_id_turno: novoAgendamento.turno === 'Manhã' ? 1 : novoAgendamento.turno === 'Tarde' ? 2 : 3,
        total_alunos: 30,
        codigo_turma: novoAgendamento.codigoTurma,
        dias_semana: novoAgendamento.diasSemana,
        id_instrutores: novoAgendamento.instrutorId ? Number(novoAgendamento.instrutorId) : undefined
      });

      refreshTurmas();
      showToast("Turma alocada com sucesso!", "success");
      setModalOpen(false);
      setNovoAgendamento({ cursoId: '', salaId: '', dataInicio: '', turno: 'Manhã', codigoTurma: '', diasSemana: [], instrutorId: '' });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao alocar turma.';
      showToast(msg, "error");
    } finally {
      setIsSavingAlocacao(false);
    }
  };

  // --- LÓGICA DO MODAL DE EDIÇÃO E EXCLUSÃO ---
  const [editTurmaModalOpen, setEditTurmaModalOpen] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<any>(null);
  const [dadosEdicao, setDadosEdicao] = useState({
    salaId: '',
    dataInicio: '',
    turno: 'Manhã',
    diasSemana: [] as string[],
    instrutorId: ''
  });

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

  const content = (
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${
      modoTV 
        ? 'fixed inset-0 z-50 bg-bg text-text-main p-0' 
        : 'relative bg-card border border-border rounded-2xl shadow-sm'
    }`}>
      
      {modoTV ? (
        /* Cabeçalho Minimalista para Modo TV */
        <div className="flex justify-between items-center p-4 shrink-0 bg-card/40 border-b border-border/30 relative z-20 gap-3">
          {/* Relógio Digital (Horário de Brasília) + Data */}
          <div className="flex items-center gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/15 px-4 py-2.5 rounded-xl text-primary shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-mono text-sm font-black tracking-wider">
              {formatHoraBrasilia(horaAtual)}
            </span>
            <span className="text-[10px] font-black uppercase bg-primary text-white px-2 py-0.5 rounded-md tracking-wider">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          </div>

          {/* Título Central */}
          <div className="hidden md:flex items-center gap-2">
            <span className="font-display font-black text-sm uppercase tracking-widest text-secondary dark:text-primary">
              Senac Ceilândia
            </span>
            <span className="text-text-muted text-xs font-bold">•</span>
            <span className="font-display font-black text-sm uppercase tracking-widest text-text-main">
              Quadro de Ocupação
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de Ocupação de Salas */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-xs select-none shrink-0 text-xs font-black uppercase tracking-wider">
              Ocupação: {obterTaxaOcupacao()}%
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
        /* Cabeçalho Completo para Modo Padrão */
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
                  ? `${getWeekRangeInfo(dataBaseSemana).label} • Cursos ativos na semana útil` 
                  : `Filtro de Ocupação Diária para: ${new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR')}`
                }
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Relógio Digital (Horário de Brasília) */}
              <div className="flex items-center gap-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/15 px-3.5 py-2 rounded-xl text-primary shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="font-mono text-xs font-black tracking-wider">
                  {formatHoraBrasilia(horaAtual)}
                </span>
                <span className="text-[9px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-md tracking-widest">
                  Brasília
                </span>
              </div>

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

            {/* Bloco Direito: Busca Rápida, Filtro de Unidade e Pills de Sala */}
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

              {/* Pills de Filtro por Tipo de Sala */}
              <div className="flex bg-surface p-1 rounded-xl border border-border shadow-xs flex-wrap gap-1">
                {[
                  { id: 'Todos', label: 'Todas', count: countTodas },
                  { id: 'Inovadora', label: 'Inovadoras', count: countInovadoras },
                  { id: 'TI', label: 'Labs TI', count: countTI },
                  { id: 'Imagem', label: 'Imagem/Moda', count: countImagem },
                  { id: 'Auditorio', label: 'Auditório', count: countAuditorio },
                ].map(pill => (
                  <button
                    key={pill.id}
                    onClick={() => handleSetFiltroTipo(pill.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      filtroTipo === pill.id
                        ? 'bg-primary text-white shadow-xs font-black'
                        : 'text-text-muted hover:text-text-main hover:bg-card/50'
                    }`}
                  >
                    {pill.label}
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-black ${
                      filtroTipo === pill.id ? 'bg-white/20 text-white' : 'bg-border/40 text-text-muted'
                    }`}>
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* GRID / MATRIZ DE ALOCAÇÃO */}
      <div 
        ref={scrollContainerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`flex-1 custom-scrollbar relative z-10 ${modoTV ? 'p-0 overflow-hidden bg-bg' : 'p-4 overflow-auto'}`}
      >
        {salasFiltradas.length === 0 ? (
          /* Empty State quando 0 salas atendem aos filtros */
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-border/80 max-w-lg mx-auto my-8">
            <AlertTriangle className="w-12 h-12 text-primary animate-pulse" />
            <h3 className="text-base font-black text-text-main font-display">Nenhuma sala encontrada</h3>
            <p className="text-xs text-text-muted max-w-sm">
              Nenhuma sala corresponde ao filtro de tipo "{filtroTipo}" ou unidade "{filtroUnidade}".
            </p>
            <button
              onClick={() => { handleSetFiltroTipo('Todos'); setFiltroUnidade('Todas'); setSearchTurma(''); }}
              className="mt-2 bg-primary text-white text-xs font-black py-2 px-4 rounded-xl shadow-xs hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> Redefinir Todos os Filtros
            </button>
          </div>
        ) : (
          <div 
            ref={tableRef}
            className={`glass-panel rounded-3xl shadow-xs overflow-hidden flex flex-col transition-all duration-300 border border-border/80 ${
              modoTV ? 'min-w-full' : 'min-w-max'
            }`}
            style={modoTV ? { 
              zoom: `${autoZoom}%`, 
              width: `${100 / (autoZoom / 100)}%`
            } : undefined}
          >
            
            {/* COLUNAS (SALAS) */}
            <div className="flex sticky top-0 z-20 backdrop-blur-lg border-b border-border/50 bg-surface/30">
              {/* Canto superior esquerdo */}
              <div className={`${modoTV ? 'w-32' : 'w-28'} shrink-0 border-r border-border/50 p-4 flex items-center justify-center font-black uppercase tracking-widest text-xs sticky left-0 z-30 transition-colors ${
                modoTV 
                  ? 'bg-card text-text-muted shadow-xs' 
                  : 'bg-card/80 text-secondary dark:text-primary shadow-xs'
              }`}>
                TURNOS
              </div>
              
              {/* Headers das Salas */}
              {salasFiltradas.map((sala) => (
                <div key={sala.id} className={`border-r border-border/50 p-4.5 flex flex-col items-center justify-center gap-2 bg-transparent transition-all ${salaColClass}`}>
                  <div className={salaNomeClass}>
                    {sala.nome}
                  </div>
                  <div className={salaDetalhesClass}>
                    <span>Cap: {sala.capacidade}</span>
                    {!modoTV && <span>•</span>}
                    <span className={`truncate font-mono ${tipoSalaMaxW}`} title={sala.tipo}>{sala.tipo}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* LINHAS (TURNOS E SUB-LINHAS) */}
            <div className="flex-1 flex flex-col">
              {TURNOS.map((turno) => {
                const subLinhas = obterSubLinhasDoTurno(turno);
                
                // Determina as cores de cada bloco de turno
                let borderClass = 'border-l-8 border-l-primary';
                let bgClass = 'bg-primary/5 dark:bg-primary/10';
                let textClass = 'text-primary';
                
                if (turno === 'Tarde') {
                  borderClass = 'border-l-8 border-l-accent';
                  bgClass = 'bg-accent/5 dark:bg-accent/10';
                  textClass = 'text-accent';
                } else if (turno === 'Noite') {
                  borderClass = 'border-l-8 border-l-purple-600';
                  bgClass = 'bg-purple-600/5 dark:bg-purple-600/10';
                  textClass = 'text-purple-600 dark:text-purple-400';
                }

                const rowClass = modoTV
                  ? "flex-1 flex border-b border-border/50 last:border-b-0 transition-colors min-h-0"
                  : "flex border-b border-border/50 last:border-b-0 transition-colors";

                return (
                  <div key={turno} className={rowClass}>
                    
                    {/* Indicador Lateral do Turno */}
                    <div className={`${modoTV ? 'w-32' : 'w-28'} shrink-0 border-r border-border/50 p-3 flex items-center justify-center sticky left-0 z-10 transition-all shadow-xs ${borderClass} ${bgClass}`}>
                      <div className={`font-black uppercase tracking-widest ${modoTV ? 'text-base' : 'text-sm'} ${textClass}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.22em' }}>
                        {turno}
                      </div>
                    </div>
   
                    {/* Sub-linhas do Turno */}
                    <div className="flex-1 flex flex-col divide-y divide-border/30 bg-card/10">
                      {subLinhas.map((subLinha, subIndex) => {
                        const subLinhaClass = modoTV
                          ? "flex-1 flex min-h-0 hover:bg-surface/20 transition-colors"
                          : "flex min-h-[145px] hover:bg-surface/20 transition-colors";
                        return (
                        <div key={subIndex} className={subLinhaClass}>
                          
                          {/* Salas em Colunas */}
                          {salasFiltradas.map((sala) => {
                            const turma = subLinha.find(t => t.salaId === sala.id);
                            
                            const cellPadding = modoTV ? "p-2" : "p-4";
                            return (
                              <div key={sala.id} className={`border-r border-border/50 transition-colors relative flex flex-col justify-center bg-transparent ${cellPadding} ${salaColClass}`}>
                                {turma ? (
                                  (() => {
                                    const progress = getProgress(turma.dataInicio, turma.dataFim);
                                    const diasFormatados = formatDiasSemana(turma.diasSemana, turma.diasRemotos);
                                    
                                    const isRemoto = turma.modalidade === 'Remoto';
                                    const cardBgClass = isRemoto 
                                      ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500 hover-glow-accent text-text-main'
                                      : 'bg-primary/10 border-primary/30 hover:border-primary hover-glow-primary text-text-main';
                                    const borderSideClass = isRemoto ? 'border-amber-500' : 'border-primary';
                                    
                                    const cardPadding = modoTV 
                                      ? 'p-5 gap-4 rounded-2xl h-full flex flex-col' 
                                      : 'p-4 gap-3.5 rounded-2xl';
                                    const cursoFont = modoTV 
                                      ? 'text-base font-bold leading-snug' 
                                      : 'text-sm leading-snug';
                                    const textMutedFont = modoTV 
                                      ? 'text-xs' 
                                      : 'text-[11px]';
                                    const diasFont = modoTV 
                                      ? 'text-xs font-bold' 
                                      : 'text-xs';
                                    const footerPadding = modoTV 
                                      ? 'mt-auto pt-3 border-t border-dashed border-border/60' 
                                      : 'mt-1 pt-3.5 border-t border-dashed border-border/60';
                                    const cardHeightClass = modoTV ? "h-full flex-1" : "";

                                    const isSemInstrutor = !turma.instrutorNome || turma.instrutorNome.toLowerCase().includes('sem instrutor');
                                    const isHighlighted = searchTurma.trim() && isTurmaMatchingSearch(turma);

                                    return (
                                      <div 
                                        onClick={() => handleEditClick(turma)}
                                        className={`cursor-pointer group/card relative w-full border btn-tactile hover:scale-[1.03] transition-all flex flex-col overflow-hidden shadow-xs ${cardHeightClass} ${cardPadding} ${cardBgClass} ${
                                          isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg shadow-md' : ''
                                        }`}
                                      >
                                        {/* Linha 1: Código da Turma e Tags */}
                                        <div className="flex items-center justify-between gap-2 shrink-0">
                                          <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-lg border border-border bg-card/65 text-text-muted shadow-xs font-mono">
                                            {turma.codigo}
                                          </span>
                                          
                                          <div className="flex gap-1.5 flex-wrap">
                                            {turma.cursoTem && (
                                              <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                TEM
                                              </span>
                                            )}
                                            {isRemoto && (
                                              <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                Remoto
                                              </span>
                                            )}
                                            {isSemInstrutor && (
                                              <span className="text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                                                ⚠️ Sem Prof.
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Linha 2: Nome do Curso */}
                                        <div className={`font-black tracking-tight transition-colors text-text-main font-display ${cursoFont}`}>
                                          {turma.cursoNome}
                                        </div>

                                        {/* Linha 2.5: Unidade Badge */}
                                        {turma.unidade && (
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-primary border border-secondary/20 shadow-3xs">
                                              {turma.unidade}
                                            </span>
                                          </div>
                                        )}

                                        {/* Linha 3: Período Letivo */}
                                        <div className={`font-bold flex items-center gap-1.5 text-text-muted ${textMutedFont}`}>
                                          <CalendarIcon className="w-4 h-4 opacity-70 text-text-muted shrink-0" />
                                          <span>{formatDataCurta(turma.dataInicio)} - {formatDataCurta(turma.dataFim)}</span>
                                        </div>

                                        {/* Linha 4: Dias da Semana */}
                                        <div className={`font-black border-l-2 pl-2 ${borderSideClass} ${diasFont}`}>
                                          {diasFormatados}
                                        </div>

                                        {/* Linha 5: Instrutor + Progresso */}
                                        <div className={`flex flex-col gap-2 transition-colors ${footerPadding}`}>
                                          <div className={`flex items-center gap-2 text-text-main font-black ${diasFont}`}>
                                            <Users className="w-4 h-4 text-text-muted shrink-0" />
                                            <span className="truncate">{turma.instrutorNome || 'Sem Instrutor'}</span>
                                          </div>
                                          
                                          {/* Barra de Progresso */}
                                          <div className="flex items-center gap-2 text-[10px] font-black">
                                            <div className="flex-1 h-1.5 rounded-full overflow-hidden relative bg-border/40">
                                              <div 
                                                className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full" 
                                                style={{ width: `${progress}%` }}
                                              ></div>
                                            </div>
                                            <span className="text-text-muted font-mono">{progress}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  // Célula Vazia / Disponível
                                  <div className={`h-full w-full flex-1 flex flex-col items-center justify-center transition-all ${
                                    modoTV ? 'p-1' : 'p-0'
                                  }`}>
                                    <div className={`w-full h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 transition-all hover:bg-emerald-500/10 ${
                                      modoTV ? 'p-3' : 'py-6 px-4'
                                    }`}>
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                      <span className={`font-black uppercase tracking-wider ${
                                        modoTV ? 'text-xs' : 'text-[11px]'
                                      }`}>
                                        Disponível
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE AGENDAMENTO (NOVO) */}
      {modalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[999] flex items-center justify-center p-4"
        >
          <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-surface/40 shrink-0">
              <h2 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2 font-display">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Nova Alocação de Turma
              </h2>
              <button 
                type="button"
                disabled={isSavingAlocacao}
                onClick={() => setModalOpen(false)} 
                className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all btn-tactile cursor-pointer disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCriarAgendamento} className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Curso</label>
                <select 
                  value={novoAgendamento.cursoId}
                  onChange={handleCursoChange}
                  className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-card text-text-main">Selecione um curso...</option>
                  {cursos.map(c => <option key={c.id} value={c.id} className="bg-card text-text-main">{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Ambiente / Sala</label>
                <select 
                  value={novoAgendamento.salaId}
                  onChange={e => setNovoAgendamento({...novoAgendamento, salaId: e.target.value})}
                  className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-card text-text-main">Selecione a sala de início...</option>
                  {salas.map(s => <option key={s.id} value={s.id} className="bg-card text-text-main">{s.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Data de Início</label>
                  <input 
                    type="date" 
                    value={novoAgendamento.dataInicio}
                    onChange={e => setNovoAgendamento({...novoAgendamento, dataInicio: e.target.value})}
                    className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Turno</label>
                  <select 
                    value={novoAgendamento.turno}
                    onChange={e => setNovoAgendamento({...novoAgendamento, turno: e.target.value})}
                    className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                  >
                    <option value="Manhã" className="bg-card text-text-main">Manhã</option>
                    <option value="Tarde" className="bg-card text-text-main">Tarde</option>
                    <option value="Noite" className="bg-card text-text-main">Noite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 flex justify-between items-center">
                  <span>Instrutor da Turma</span>
                  <span className="text-[10px] text-primary lowercase normal-case font-bold">
                    💡 Turmas do mesmo curso podem ter instrutores diferentes
                  </span>
                </label>
                <select 
                  value={novoAgendamento.instrutorId}
                  onChange={e => setNovoAgendamento({...novoAgendamento, instrutorId: e.target.value})}
                  className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                >
                  <option value="" className="bg-card text-text-main">Sem Instrutor / Definir Depois</option>
                  {instrutores.map(i => <option key={i.id} value={i.id} className="bg-card text-text-main">{i.nome}</option>)}
                </select>
              </div>

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
                          setNovoAgendamento((prev) => {
                            const prevSet = new Set(prev.diasSemana);
                            if (prevSet.has(dia.id)) prevSet.delete(dia.id);
                            else prevSet.add(dia.id);
                            return { ...prev, diasSemana: Array.from(prevSet) };
                          });
                        }}
                        className={`px-3 py-2.5 text-xs font-bold rounded-xl border border-border/80 btn-tactile cursor-pointer ${
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

              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 text-xs text-text-muted flex items-start gap-2.5">
                <CalendarIcon className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                <p className="leading-relaxed">
                  A data de término será projetada automaticamente pelo nosso Motor com base na carga horária (4h/dia), dias selecionados e feriados cadastrados.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
                <button 
                  type="button" 
                  disabled={isSavingAlocacao}
                  onClick={() => setModalOpen(false)} 
                  className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingAlocacao}
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
      )}

      {/* MODAL DE EDIÇÃO E REALOCAÇÃO */}
      {editTurmaModalOpen && turmaEditando && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[999] flex items-center justify-center p-4"
        >
          <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col transition-all">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-surface/40 shrink-0">
              <h2 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2 font-display">
                <BookOpen className="w-5 h-5 text-primary" />
                Editar Alocação: {turmaEditando.codigo}
              </h2>
              <button 
                type="button"
                disabled={isSavingAlocacao || isDeletingAlocacao}
                onClick={() => setEditTurmaModalOpen(false)} 
                className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all btn-tactile cursor-pointer disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSalvarEdicao} className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Novo Ambiente / Sala</label>
                <select 
                  value={dadosEdicao.salaId}
                  onChange={e => setDadosEdicao({...dadosEdicao, salaId: e.target.value})}
                  className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                  required
                >
                  {salas.map(s => <option key={s.id} value={s.id} className="bg-card text-text-main">{s.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Nova Data Início</label>
                  <input 
                    type="date" 
                    value={dadosEdicao.dataInicio}
                    onChange={e => setDadosEdicao({...dadosEdicao, dataInicio: e.target.value})}
                    className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Novo Turno</label>
                  <select 
                    value={dadosEdicao.turno}
                    onChange={e => setDadosEdicao({...dadosEdicao, turno: e.target.value})}
                    className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                  >
                    <option value="Manhã" className="bg-card text-text-main">Manhã</option>
                    <option value="Tarde" className="bg-card text-text-main">Tarde</option>
                    <option value="Noite" className="bg-card text-text-main">Noite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 flex justify-between items-center">
                  <span>Instrutor da Turma</span>
                  <span className="text-[10px] text-primary lowercase normal-case font-bold">
                    💡 Turmas do mesmo curso podem ter instrutores diferentes
                  </span>
                </label>
                <select 
                  value={dadosEdicao.instrutorId}
                  onChange={e => setDadosEdicao({...dadosEdicao, instrutorId: e.target.value})}
                  className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
                >
                  <option value="" className="bg-card text-text-main">Sem Instrutor / Definir Depois</option>
                  {instrutores.map(i => <option key={i.id} value={i.id} className="bg-card text-text-main">{i.nome}</option>)}
                </select>
              </div>

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
                          setDadosEdicao((prev) => {
                            const prevSet = new Set(prev.diasSemana);
                            if (prevSet.has(dia.id)) prevSet.delete(dia.id);
                            else prevSet.add(dia.id);
                            return { ...prev, diasSemana: Array.from(prevSet) };
                          });
                        }}
                        className={`px-3 py-2.5 text-xs font-bold rounded-xl border border-border/80 btn-tactile cursor-pointer ${
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

              <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
                <button 
                  type="button" 
                  disabled={isSavingAlocacao || isDeletingAlocacao}
                  onClick={requestDeleteTurma}
                  className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all btn-tactile cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={14} /> Excluir Alocação
                </button>

                <div className="flex justify-end gap-3 w-full md:w-auto shrink-0">
                  <button 
                    type="button" 
                    disabled={isSavingAlocacao || isDeletingAlocacao}
                    onClick={() => setEditTurmaModalOpen(false)} 
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
      )}

      {/* MODAL DE CONFIRMAÇÃO SEGURA DE EXCLUSÃO DE ALOCAÇÃO */}
      {deleteModal.open && deleteModal.turma && (
        <ConfirmDeleteModal
          open={deleteModal.open}
          title={`Excluir Alocação da Turma`}
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
