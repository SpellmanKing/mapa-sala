import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Users, 
  Tv, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Clock, 
  Building,
  MapPin,
  SlidersHorizontal
} from 'lucide-react';
import { useAppData, useAppUi, Sala, TurmaDetalhada } from '../context/AppContext';
import { TurmaService } from '../api/client';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { DigitalClock } from '../components/painel/DigitalClock';
import { NovoAgendamentoModal } from '../components/painel/NovoAgendamentoModal';
import { EditTurmaModal } from '../components/painel/EditTurmaModal';
import { formatDateInput } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { getShiftId, SHIFTS } from '../constants/referenceData';

const TURNOS = SHIFTS.map(shift => shift.label);

interface CalculoImportado {
  cursoId: string;
  dataInicio: string;
  diasSemana: string[];
  cargaHoraria: number;
  horasPorDia: number;
  cronograma: {
    dataTermino: string;
    totalAulas: number;
    datasAulas: string[];
  };
}

interface DisponibilidadePainel {
  salasLivres: Sala[];
  salasOcupadas: Array<{ salaId: number; turmaCodigo: string; data: string }>;
  salasCapacidadeInsuficiente: Array<{ salaId: number; nome: string; capacidade: number }>;
  conflitoInstrutor: null | {
    nome: string;
    turmaCodigo: string;
    data: string;
  };
  sugestoesTurnos: Array<{ turno: string; vagas: number }>;
  totalSalas: number;
  erro: string | null;
}

interface DisponibilidadeApi extends Omit<DisponibilidadePainel, 'salasLivres' | 'erro'> {
  salasLivres: number[];
}

const criarDisponibilidade = (salasLivres: Sala[] = []): DisponibilidadePainel => ({
  salasLivres,
  salasOcupadas: [],
  salasCapacidadeInsuficiente: [],
  conflitoInstrutor: null,
  sugestoesTurnos: [],
  totalSalas: salasLivres.length,
  erro: null
});

const descreverIndisponibilidade = (disponibilidade: DisponibilidadePainel): string | null => {
  if (disponibilidade.salasLivres.length > 0) return null;
  if (disponibilidade.totalSalas === 0) {
    return 'Não há salas cadastradas no sistema.';
  }

  const capacidadeInsuficiente = new Set(
    disponibilidade.salasCapacidadeInsuficiente.map(sala => sala.salaId)
  );
  const salasComCapacidade = disponibilidade.totalSalas - capacidadeInsuficiente.size;
  if (salasComCapacidade === 0) {
    return 'Nenhuma sala cadastrada possui capacidade para o total de alunos informado.';
  }

  const ocupadasComCapacidade = new Set(
    disponibilidade.salasOcupadas
      .filter(sala => !capacidadeInsuficiente.has(sala.salaId))
      .map(sala => sala.salaId)
  );
  if (ocupadasComCapacidade.size >= salasComCapacidade) {
    return `As ${salasComCapacidade} sala(s) com capacidade adequada já estão ocupadas neste turno e período.`;
  }

  return 'Nenhuma sala atende simultaneamente aos critérios de capacidade e disponibilidade.';
};

export function PainelPage() {
  const {
    salas,
    turmas,
    cursos,
    instrutores,
    tipoSalas,
    refreshTurmas,
    loadData,
    isLoading
  } = useAppData();
  const { showToast } = useAppUi();
  const { can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    void loadData(['cursos', 'salas', 'tiposSala', 'instrutores', 'turmas']).catch(() => {
      showToast('Não foi possível carregar os dados do painel.', 'error');
    });
  }, [loadData, showToast]);

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

  useEffect(() => {
    if (tipoSalas.length > 0 && filtroTipo !== 'Todos' && !tipoSalas.some(tipo => tipo.nome === filtroTipo)) {
      setFiltroTipo('Todos');
      localStorage.setItem('sgst_painel_tipo_sala', 'Todos');
    }
  }, [filtroTipo, tipoSalas]);

  const handleSetFiltroModalidade = (mod: 'Todas' | 'Presencial' | 'Remoto') => {
    setFiltroModalidade(mod);
    localStorage.setItem('sgst_painel_modalidade', mod);
  };

  const handleSetModoVisualizacao = (modo: 'semanal' | 'diario') => {
    setModoVisualizacao(modo);
    localStorage.setItem('sgst_painel_modo', modo);
  };

  // Controle Temporal: Data Diária & Data Base da Semana
  const [dataFiltro, setDataFiltro] = useState(() => formatDateInput());
  const [dataBaseSemana, setDataBaseSemana] = useState(() => formatDateInput());

  // Filtros de Pesquisa e Unidade
  const [searchTurma, setSearchTurma] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('Todas');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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
  const weekRangeInfo = useMemo(() => getWeekRangeInfo(dataBaseSemana), [dataBaseSemana]);

  const navSemanaAnterior = () => {
    const d = new Date(dataBaseSemana + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setDataBaseSemana(formatDateInput(d));
  };

  const navProximaSemana = () => {
    const d = new Date(dataBaseSemana + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setDataBaseSemana(formatDateInput(d));
  };

  const navHoje = () => {
    const hoje = formatDateInput();
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
  const salasById = useMemo(() => new Map(salas.map(sala => [sala.id, sala])), [salas]);

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
    dataInicio: formatDateInput(),
    turno: String(SHIFTS[0].label),
    codigoTurma: '',
    diasSemana: ['1', '3', '5'] as string[],
    instrutorId: '',
    totalAlunos: 25
  });
  const [calculoImportado, setCalculoImportado] = useState<CalculoImportado | null>(null);
  const transferenciaProcessada = useRef(false);

  useEffect(() => {
    const pageState = location.state as {
      novaAlocacao?: CalculoImportado;
      accessDenied?: boolean;
    } | null;

    if (pageState?.accessDenied) {
      showToast('Seu perfil não possui permissão para acessar o gerenciamento.', 'error');
      navigate('/painel', { replace: true, state: null });
      return;
    }

    const transferencia = pageState?.novaAlocacao;
    if (!transferencia || transferenciaProcessada.current) return;
    if (!can('ALLOCATE')) {
      showToast('Seu perfil permite apenas consultar as alocações.', 'info');
      navigate('/painel', { replace: true, state: null });
      return;
    }

    const curso = transferencia.cursoId
      ? cursos.find(item => item.id === transferencia.cursoId)
      : undefined;
    if (transferencia.cursoId && !curso) return;

    transferenciaProcessada.current = true;
    setNovoAgendamento(prev => ({
      ...prev,
      cursoId: transferencia.cursoId,
      dataInicio: transferencia.dataInicio,
      diasSemana: transferencia.diasSemana,
      codigoTurma: curso?.codigoTurmaPadrao || '',
      turno: curso?.turnoPadrao || prev.turno,
      instrutorId: curso?.instrutorId || ''
    }));
    setCalculoImportado(transferencia);
    setModalOpen(true);
    navigate('/painel', { replace: true, state: null });
  }, [can, cursos, location.state, navigate, showToast]);

  // --- LÓGICA DO MODAL DE EDIÇÃO E REALOCAÇÃO ---
  const [editTurmaModalOpen, setEditTurmaModalOpen] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<any>(null);
  const [dadosEdicao, setDadosEdicao] = useState({
    salaId: '',
    dataInicio: '',
    turno: String(SHIFTS[0].label),
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
      } else if ((e.key === 'n' || e.key === 'N') && can('ALLOCATE') && !modalOpen && !editTurmaModalOpen && !deleteModal.open) {
        e.preventDefault();
        setModalOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [can, modoTV, modalOpen, editTurmaModalOpen, deleteModal.open]);

  // Helper para buscar informações de uma sala
  const getSalaInfo = (salaId: string): Sala | undefined => {
    return salasById.get(salaId);
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

  const [disponibilidadeNovo, setDisponibilidadeNovo] = useState<DisponibilidadePainel>(criarDisponibilidade);
  const [disponibilidadeEdicao, setDisponibilidadeEdicao] = useState<DisponibilidadePainel>(criarDisponibilidade);
  const [carregandoDisponibilidadeNovo, setCarregandoDisponibilidadeNovo] = useState(false);
  const [carregandoDisponibilidadeEdicao, setCarregandoDisponibilidadeEdicao] = useState(false);

  const mapDisponibilidade = (data: DisponibilidadeApi): DisponibilidadePainel => ({
    salasLivres: salas.filter(sala => data.salasLivres.includes(Number(sala.id))),
    salasOcupadas: data.salasOcupadas || [],
    salasCapacidadeInsuficiente: data.salasCapacidadeInsuficiente || [],
    conflitoInstrutor: data.conflitoInstrutor || null,
    sugestoesTurnos: data.sugestoesTurnos || [],
    totalSalas: data.totalSalas,
    erro: null
  });

  useEffect(() => {
    if (!novoAgendamento.cursoId || !novoAgendamento.dataInicio || novoAgendamento.diasSemana.length === 0) {
      setDisponibilidadeNovo(criarDisponibilidade(salas));
      setCarregandoDisponibilidadeNovo(false);
      return;
    }

    let cancelled = false;
    setCarregandoDisponibilidadeNovo(true);
    const timer = window.setTimeout(() => {
      TurmaService.getDisponibilidade({
        id_cursos: Number(novoAgendamento.cursoId),
        data_inicio: novoAgendamento.dataInicio,
        fk_id_turno: getShiftId(novoAgendamento.turno),
        total_alunos: Number(novoAgendamento.totalAlunos) || 1,
        dias_semana: novoAgendamento.diasSemana,
        id_instrutores: novoAgendamento.instrutorId ? Number(novoAgendamento.instrutorId) : null
      }).then(data => {
        if (cancelled) return;
        const mapped = mapDisponibilidade(data);
        setDisponibilidadeNovo(mapped);
        if (!mapped.salasLivres.some(sala => sala.id === novoAgendamento.salaId)) {
          setNovoAgendamento(prev => ({ ...prev, salaId: '' }));
        }
      }).catch(() => {
        if (!cancelled) {
          setDisponibilidadeNovo(prev => ({
            ...prev,
            erro: 'Não foi possível consultar a disponibilidade. Tente novamente antes de confirmar.'
          }));
        }
      }).finally(() => {
        if (!cancelled) setCarregandoDisponibilidadeNovo(false);
      });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [novoAgendamento.cursoId, novoAgendamento.dataInicio, novoAgendamento.turno, novoAgendamento.totalAlunos, novoAgendamento.diasSemana, novoAgendamento.instrutorId, salas]);

  useEffect(() => {
    if (!turmaEditando || !dadosEdicao.dataInicio || dadosEdicao.diasSemana.length === 0) {
      setDisponibilidadeEdicao(turmaEditando ? criarDisponibilidade() : criarDisponibilidade(salas));
      setCarregandoDisponibilidadeEdicao(false);
      return;
    }

    let cancelled = false;
    setCarregandoDisponibilidadeEdicao(true);
    const timer = window.setTimeout(() => {
      TurmaService.getDisponibilidade({
        id_cursos: Number(turmaEditando.cursoId),
        data_inicio: dadosEdicao.dataInicio,
        fk_id_turno: getShiftId(dadosEdicao.turno),
        total_alunos: Number(turmaEditando.totalAlunos) || 1,
        dias_semana: dadosEdicao.diasSemana,
        id_instrutores: dadosEdicao.instrutorId ? Number(dadosEdicao.instrutorId) : null,
        ignore_turma_id: Number(turmaEditando.id)
      }).then(data => {
        if (cancelled) return;
        const mapped = mapDisponibilidade(data);
        setDisponibilidadeEdicao(mapped);
        if (!mapped.salasLivres.some(sala => sala.id === dadosEdicao.salaId)) {
          setDadosEdicao(prev => ({ ...prev, salaId: '' }));
        }
      }).catch(() => {
        if (!cancelled) {
          setDisponibilidadeEdicao(prev => ({
            ...prev,
            erro: 'Não foi possível consultar a disponibilidade. Tente novamente antes de salvar.'
          }));
        }
      }).finally(() => {
        if (!cancelled) setCarregandoDisponibilidadeEdicao(false);
      });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [turmaEditando, dadosEdicao.dataInicio, dadosEdicao.turno, dadosEdicao.diasSemana, dadosEdicao.instrutorId, salas]);

  const salaSelecionadaNovo = useMemo(() => {
    return salas.find(s => s.id === novoAgendamento.salaId);
  }, [salas, novoAgendamento.salaId]);

  const capacidadeExcedidaNovo = Boolean(
    salaSelecionadaNovo && Number(novoAgendamento.totalAlunos) > salaSelecionadaNovo.capacidade
  );

  const handleCursoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    const curso = cursos.find(c => c.id === cid);
    if (calculoImportado?.cursoId && calculoImportado.cursoId !== cid) {
      setCalculoImportado(null);
    }
    if (curso) {
      setNovoAgendamento(prev => ({
        ...prev,
        cursoId: cid,
        codigoTurma: curso.codigoTurmaPadrao || '',
        turno: curso.turnoPadrao || SHIFTS[0].label,
        diasSemana: calculoImportado
          ? prev.diasSemana
          : curso.diasSemana && curso.diasSemana.length > 0
            ? curso.diasSemana
            : ['1', '2', '3', '4', '5'],
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
        fk_id_turno: getShiftId(novoAgendamento.turno),
        total_alunos: totalAlunosNum,
        codigo_turma: novoAgendamento.codigoTurma,
        dias_semana: novoAgendamento.diasSemana,
        id_instrutores: novoAgendamento.instrutorId ? Number(novoAgendamento.instrutorId) : null
      });

      await refreshTurmas();
      showToast("Turma alocada com sucesso!", "success");
      setModalOpen(false);
      setCalculoImportado(null);
      setNovoAgendamento({ 
        cursoId: '', 
        salaId: '', 
        dataInicio: formatDateInput(),
        turno: SHIFTS[0].label,
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
    if (!can('ALLOCATE')) return;
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
        fk_id_turno: getShiftId(dadosEdicao.turno),
        dias_semana: dadosEdicao.diasSemana,
        id_instrutores: dadosEdicao.instrutorId ? Number(dadosEdicao.instrutorId) : null
      });
      await refreshTurmas();
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
      await refreshTurmas();
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

  // Uma única passagem pela lista alimenta turnos, contadores e cards.
  const searchNormalized = searchTurma.trim().toLocaleLowerCase('pt-BR');
  const turmasPorTurno = useMemo(() => {
    const grouped: Record<string, TurmaDetalhada[]> = Object.fromEntries(
      TURNOS.map(turno => [turno, []])
    );
    const startOfWeek = new Date(weekRangeInfo.startOfWeek);
    const endOfWeek = new Date(weekRangeInfo.endOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999);
    const targetDate = new Date(dataFiltro + 'T00:00:00');

    turmas.forEach(turma => {
      if (!grouped[turma.turno]) return;
      const start = turma.dataInicio ? new Date(turma.dataInicio + 'T00:00:00') : null;
      const end = turma.dataFim ? new Date(turma.dataFim + 'T23:59:59') : null;
      const matchesPeriod = !start || !end || (
        modoVisualizacao === 'semanal'
          ? start <= endOfWeek && end >= startOfWeek
          : targetDate >= start && targetDate <= end &&
            turma.diasSemana.includes(targetDate.getDay().toString())
      );
      const matchesSearch = !searchNormalized || [
        turma.codigo,
        turma.cursoNome,
        turma.instrutorNome,
        turma.unidade
      ].some(value => value?.toLocaleLowerCase('pt-BR').includes(searchNormalized));
      const matchesModality = filtroModalidade === 'Todas' ||
        (filtroModalidade === 'Remoto' ? turma.modalidade === 'Remoto' : turma.modalidade !== 'Remoto');
      const matchesRoomType = filtroTipo === 'Todos' || salasById.get(turma.salaId)?.tipo === filtroTipo;

      if (
        matchesPeriod &&
        matchesSearch &&
        matchesModality &&
        matchesRoomType &&
        (filtroUnidade === 'Todas' || turma.unidade === filtroUnidade)
      ) {
        grouped[turma.turno].push(turma);
      }
    });

    return grouped;
  }, [
    dataFiltro,
    filtroModalidade,
    filtroTipo,
    filtroUnidade,
    modoVisualizacao,
    salasById,
    searchNormalized,
    turmas,
    weekRangeInfo
  ]);

  const filtrosAtivos = [
    Boolean(searchTurma.trim()),
    filtroUnidade !== 'Todas',
    filtroModalidade !== 'Todas',
    filtroTipo !== 'Todos'
  ].filter(Boolean).length;

  const limparFiltros = () => {
    setSearchTurma('');
    setFiltroUnidade('Todas');
    handleSetFiltroModalidade('Todas');
    handleSetFiltroTipo('Todos');
  };

  // Contadores globais de turmas
  const { totalTurmasVisiveis, totalPresenciaisVisiveis, totalRemotasVisiveis } = useMemo(() => {
    const visible = TURNOS.flatMap(turno => turmasPorTurno[turno] ?? []);
    const remotas = visible.filter(turma => turma.modalidade === 'Remoto').length;
    return {
      totalTurmasVisiveis: visible.length,
      totalPresenciaisVisiveis: visible.length - remotas,
      totalRemotasVisiveis: remotas
    };
  }, [turmasPorTurno]);

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
                aria-pressed={autoZoom === 60}
                title="Ideal para TV 55 polegadas"
              >
                55" (60%)
              </button>
              <button 
                onClick={() => handleSetTvZoom(63)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${autoZoom === 63 ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main'}`}
                aria-pressed={autoZoom === 63}
                title="Ideal para TV 60 polegadas"
              >
                60" (63%)
              </button>
              <button 
                onClick={() => handleSetTvZoom(68)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${autoZoom === 68 ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main'}`}
                aria-pressed={autoZoom === 68}
                title="Ideal para TV 65 polegadas"
              >
                65" (68%)
              </button>
              <div className="flex items-center border-l border-border/60 pl-1 ml-1 gap-0.5">
                <button
                  onClick={() => handleSetTvZoom(autoZoom - 2)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-card text-text-muted hover:text-text-main font-black cursor-pointer"
                  title="Diminuir Zoom (-2%)"
                  aria-label="Diminuir zoom em 2%"
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
                  aria-label="Aumentar zoom em 2%"
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
        <div className="p-4 sm:p-5 border-b flex flex-col gap-4 shrink-0 transition-colors bg-card border-border">
          
          {/* Linha Superior: Título, Ações Principais e Relógio */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 tracking-tight text-secondary dark:text-primary transition-colors">
                <CalendarIcon className="text-primary w-6 h-6 shrink-0" /> 
                Quadro de Alocações
              </h1>
              <p className="text-sm mt-0.5 font-medium text-text-muted transition-colors">
                {modoVisualizacao === 'semanal' 
                  ? `${weekRangeInfo.label} • Cursos em andamento` 
                  : `Filtro de Ocupação Diária para: ${new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR')}`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Relógio Digital Modularizado (Horário de Brasília) */}
              <div className="hidden xl:block">
                <DigitalClock variant="default" />
              </div>

              {can('ALLOCATE') && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="bg-primary text-white font-black py-2.5 px-4 rounded-xl shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer flex-1 sm:flex-none"
                  title="Atalho: pressione N no teclado"
                >
                  <Plus size={16} /> Alocar Turma
                </button>
              )}

              {/* Botão de Modo TV */}
              <button
                onClick={handleToggleModoTV}
                title="Entrar no Modo TV (Atalho: pressione T)"
                className="p-2.5 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 text-sm font-bold transition-colors shadow-sm cursor-pointer bg-surface border-border text-text-muted hover:bg-border/30 hover:text-text-main flex-1 sm:flex-none"
              >
                <Tv size={16} /> Modo TV
              </button>
            </div>
          </div>

          {/* Busca e período são os controles primários; filtros secundários ficam agrupados. */}
          <div className="grid grid-cols-1 xl:grid-cols-[auto_minmax(260px,1fr)_auto] gap-3 pt-3 border-t border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex bg-surface p-1 rounded-xl border border-border shadow-xs w-fit" role="group" aria-label="Modo de visualização">
                <button
                  type="button"
                  onClick={() => handleSetModoVisualizacao('semanal')}
                  aria-pressed={modoVisualizacao === 'semanal'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    modoVisualizacao === 'semanal' 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Semanal
                </button>
                <button
                  type="button"
                  onClick={() => handleSetModoVisualizacao('diario')}
                  aria-pressed={modoVisualizacao === 'diario'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    modoVisualizacao === 'diario' 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Diário
                </button>
              </div>

              {modoVisualizacao === 'semanal' && (
                <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border shadow-xs min-w-0">
                  <button
                    type="button"
                    onClick={navSemanaAnterior}
                    className="p-1.5 hover:bg-card rounded-lg text-text-muted hover:text-text-main cursor-pointer shrink-0"
                    title="Semana Anterior"
                    aria-label="Ver semana anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-black text-text-main px-1 sm:px-2 font-display truncate">
                    {weekRangeInfo.label}
                  </span>
                  <button
                    type="button"
                    onClick={navProximaSemana}
                    className="p-1.5 hover:bg-card rounded-lg text-text-muted hover:text-text-main cursor-pointer shrink-0"
                    title="Próxima Semana"
                    aria-label="Ver próxima semana"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
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
                  <label htmlFor="data-ocupacao" className="sr-only">Data da ocupação</label>
                  <input 
                    id="data-ocupacao"
                    type="date"
                    value={dataFiltro}
                    onChange={e => setDataFiltro(e.target.value)}
                    className="text-xs font-black border border-border rounded-lg px-2.5 py-1 outline-none transition-all bg-input text-text-main focus:border-primary cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={navHoje}
                    className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border border-border/80 text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer transition-all"
                  >
                    Hoje
                  </button>
                </div>
              )}
            </div>

            <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <label htmlFor="busca-turma" className="sr-only">Buscar turma, curso, sala ou instrutor</label>
                <input
                  id="busca-turma"
                  type="text"
                  placeholder="Buscar turma, curso, sala ou instrutor..."
                  value={searchTurma}
                  onChange={e => setSearchTurma(e.target.value)}
                  className="w-full bg-input text-text-main text-sm font-semibold outline-none border border-border rounded-xl pl-9 pr-9 py-2.5 focus:border-primary transition-all shadow-xs"
                />
                {searchTurma && (
                  <button
                    type="button"
                    onClick={() => setSearchTurma('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1.5 rounded-lg cursor-pointer"
                    title="Limpar busca"
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarFiltros(value => !value)}
                aria-expanded={mostrarFiltros}
                aria-controls="filtros-secundarios"
                className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-xs font-black transition-colors cursor-pointer ${
                  mostrarFiltros || filtrosAtivos > 0
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface border-border text-text-muted hover:text-text-main'
                }`}
              >
                <SlidersHorizontal size={15} />
                Filtros
                {filtrosAtivos > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-white inline-flex items-center justify-center text-[10px]">
                    {filtrosAtivos}
                  </span>
                )}
              </button>
              {filtrosAtivos > 0 && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="h-10 px-3 rounded-xl text-xs font-bold text-text-muted hover:text-text-main hover:bg-surface transition-colors cursor-pointer whitespace-nowrap"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {mostrarFiltros && (
            <div id="filtros-secundarios" className="flex flex-col lg:flex-row lg:items-center gap-3 p-3 rounded-2xl bg-surface/60 border border-border/70">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted shrink-0">
                Refinar por
              </span>
              {unidadesDisponiveis.length > 0 && (
                <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 shadow-xs min-w-0">
                  <Building size={14} className="text-text-muted shrink-0" />
                  <label htmlFor="filtro-unidade" className="sr-only">Filtrar por unidade</label>
                  <select
                    id="filtro-unidade"
                    value={filtroUnidade}
                    onChange={e => setFiltroUnidade(e.target.value)}
                    className="bg-transparent text-text-main border-none text-xs font-bold outline-none cursor-pointer min-w-0"
                  >
                    <option value="Todas" className="bg-card text-text-main">Todas Unidades</option>
                    {unidadesDisponiveis.map(u => (
                      <option key={u} value={u} className="bg-card text-text-main">{u}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex bg-input p-1 rounded-xl border border-border shadow-xs flex-wrap gap-1" role="group" aria-label="Filtrar por modalidade">
                {(['Todas', 'Presencial', 'Remoto'] as const).map(mod => (
                  <button
                    type="button"
                    key={mod}
                    onClick={() => handleSetFiltroModalidade(mod)}
                    aria-pressed={filtroModalidade === mod}
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

              <div className="flex bg-input p-1 rounded-xl border border-border shadow-xs flex-wrap gap-1" role="group" aria-label="Filtrar por tipo de sala">
                {['Todos', ...tipoSalas.map(tipo => tipo.nome)].map(tipoId => (
                  <button
                    type="button"
                    key={tipoId}
                    onClick={() => handleSetFiltroTipo(tipoId)}
                    aria-pressed={filtroTipo === tipoId}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filtroTipo === tipoId
                        ? 'bg-primary text-white shadow-xs font-black'
                        : 'text-text-muted hover:text-text-main hover:bg-card/50'
                    }`}
                  >
                    {tipoId === 'Todos' ? 'Todas Salas' : tipoId}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-xs" aria-live="polite">
            <span className="font-bold text-text-muted">
              {isLoading ? 'Carregando alocações…' : `${totalTurmasVisiveis} ${totalTurmasVisiveis === 1 ? 'turma encontrada' : 'turmas encontradas'}`}
            </span>
            {filtrosAtivos > 0 && (
              <span className="hidden sm:inline text-primary font-bold">
                {filtrosAtivos} {filtrosAtivos === 1 ? 'filtro ativo' : 'filtros ativos'}
              </span>
            )}
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
          {isLoading && (
            <div className="grid gap-4" aria-label="Carregando alocações" aria-busy="true">
              {[1, 2, 3].map(item => (
                <div key={item} className="h-36 rounded-2xl border border-border bg-surface/50 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && totalTurmasVisiveis === 0 && (
            <div className="min-h-[320px] rounded-2xl border border-dashed border-border bg-surface/30 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <CalendarIcon size={24} />
              </div>
              <h2 className="text-lg font-black text-text-main">Nenhuma alocação encontrada</h2>
              <p className="text-sm text-text-muted mt-1 max-w-md">
                {filtrosAtivos > 0
                  ? 'Ajuste ou limpe os filtros para ampliar os resultados.'
                  : 'Não há turmas para o período selecionado.'}
              </p>
              {(filtrosAtivos > 0 || can('ALLOCATE')) && (
                <button
                  type="button"
                  onClick={filtrosAtivos > 0 ? limparFiltros : () => setModalOpen(true)}
                  className="mt-5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  {filtrosAtivos > 0 ? 'Limpar filtros' : 'Nova alocação'}
                </button>
              )}
            </div>
          )}

          {!isLoading && totalTurmasVisiveis > 0 && TURNOS.map((turno) => {
            // Cores e Borda do Turno
            let turnoBorderColor = 'border-t-4 border-t-primary';
            let turnoBgColor = 'bg-primary/5 dark:bg-primary/10 text-primary';
            let badgeBg = 'bg-primary/10 text-primary border-primary/20';

            if (turno === SHIFTS[1].label) {
              turnoBorderColor = 'border-t-4 border-t-amber-500';
              turnoBgColor = 'bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
              badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            } else if (turno === SHIFTS[2].label) {
              turnoBorderColor = 'border-t-4 border-t-purple-600';
              turnoBgColor = 'bg-purple-600/5 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400';
              badgeBg = 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/20';
            }

            const turmasDoTurno = turmasPorTurno[turno] ?? [];
            const turmasPresenciais = turmasDoTurno.filter(t => t.modalidade !== 'Remoto');
            const turmasRemotas = turmasDoTurno.filter(t => t.modalidade === 'Remoto');

            const gridClasses = modoTV
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'
              : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4';

            // Renderizador do Card de Turma com Divisão de Cores: Vermelho (Presencial) | Azul (Remoto)
            const renderCardTurma = (turma: TurmaDetalhada) => {
              const sala = getSalaInfo(turma.salaId);
              const { presencial, remoto } = formatDiasSemanaSeparados(turma.diasSemana, turma.diasRemotos);
              const { concluidas, total, porcentagem } = calcularProgressoAulas(turma.dataInicio, turma.dataFim, turma.diasSemana);

              const isRemoto = turma.modalidade === 'Remoto';
              const isSemInstrutor = !turma.instrutorNome || turma.instrutorNome.toLowerCase().includes('sem instrutor');
              const isHighlighted = Boolean(searchNormalized);

              const etapa = porcentagem >= 100 ? 'Concluída' : concluidas > 0 ? 'Em andamento' : 'Programada';
              const cardProportionClass = modoTV ? 'min-h-[300px] p-5 gap-4' : 'p-4 gap-4';
              const cardBorderColor = isRemoto 
                ? 'border-l-4 border-l-blue-500 hover:border-blue-500/50'
                : 'border-l-4 border-l-red-500 hover:border-red-500/50';

              const badgeCodigoClass = isRemoto
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';

              const salaIcon = isRemoto
                ? <Tv size={14} className="shrink-0 text-blue-500" />
                : <MapPin size={14} className="shrink-0 text-red-500" />;

              const accentText = isRemoto ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400';
              const progressBarFillClass = isRemoto ? 'bg-blue-500' : 'bg-red-500';

              return (
                <button
                  type="button"
                  key={turma.id}
                  onClick={() => handleEditClick(turma)}
                  disabled={!can('ALLOCATE')}
                  aria-label={can('ALLOCATE') ? `Editar alocação da turma ${turma.codigo}, ${turma.cursoNome}` : `Turma ${turma.codigo}, ${turma.cursoNome}`}
                  className={`glass-panel w-full text-left rounded-2xl shadow-xs border border-border/80 transition-[border-color,box-shadow,transform] duration-200 flex flex-col bg-card/70 ${can('ALLOCATE') ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default'} ${cardProportionClass} ${cardBorderColor} ${
                    isHighlighted ? (isRemoto ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-bg shadow-md' : 'ring-2 ring-red-500 ring-offset-2 ring-offset-bg shadow-md') : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`text-xs font-black tracking-wide px-2.5 py-1 rounded-lg border font-mono ${badgeCodigoClass}`}>
                      {turma.codigo}
                    </span>
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {turma.cursoTem && (
                        <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                          TEM
                        </span>
                      )}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isRemoto ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'}`}>
                        {isRemoto ? 'Remoto' : 'Presencial'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-black text-text-main font-display leading-tight line-clamp-2">
                      {turma.cursoNome}
                    </h3>
                    {turma.unidade && (
                      <span className="text-[10px] font-bold text-text-muted truncate">
                        {turma.unidade}
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div className="col-span-2 flex items-center justify-between gap-2 bg-surface/70 border border-border/60 rounded-xl px-3 py-2.5">
                      <dt className="sr-only">Sala</dt>
                      <dd className="flex items-center gap-2 min-w-0 font-bold text-text-main">
                        {salaIcon}
                        <span className="truncate">{sala?.nome || (isRemoto ? 'Ambiente virtual' : 'Ambiente não atribuído')}</span>
                      </dd>
                      {sala?.capacidade && (
                        <span className="text-[10px] text-text-muted shrink-0">{sala.capacidade} lugares</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Instrutor</dt>
                      <dd className={`truncate font-bold ${isSemInstrutor ? 'text-amber-700 dark:text-amber-300' : 'text-text-main'}`}>
                        {turma.instrutorNome || 'Não definido'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Alunos</dt>
                      <dd className="font-bold text-text-main flex items-center gap-1.5">
                        <Users size={13} className="text-text-muted" /> {turma.totalAlunos}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Período</dt>
                      <dd className="font-mono font-bold text-text-main">
                        {formatDataCurta(turma.dataInicio)} – {formatDataCurta(turma.dataFim)}
                      </dd>
                    </div>
                    {(presencial || remoto) && (
                      <div className="col-span-2">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Dias</dt>
                        <dd className="font-bold text-text-main">
                          {[presencial && `Presencial: ${presencial}`, remoto && `Remoto: ${remoto}`].filter(Boolean).join(' · ')}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-text-muted">{etapa} · {concluidas}/{total} aulas</span>
                      <span className={`text-[11px] font-mono font-black ${accentText}`}>{porcentagem}%</span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden bg-border/50 relative"
                      role="progressbar"
                      aria-label={`Progresso da turma ${turma.codigo}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={porcentagem}
                    >
                      <div 
                        className={`absolute inset-y-0 left-0 ${progressBarFillClass} transition-all duration-500 rounded-full`}
                        style={{ width: `${porcentagem}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            };

            return (
              <section
                key={turno} 
                className={`glass-panel rounded-2xl overflow-hidden shadow-xs border border-border/80 ${turnoBorderColor}`}
              >
                <header className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 ${turnoBgColor}`}>
                  <div className="flex items-center gap-3">
                    <Clock size={18} aria-hidden="true" />
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Turno</span>
                      <h2 className="text-lg font-black font-display leading-none">
                      {turno}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black">
                    <span className={`px-2.5 py-1 rounded-lg border uppercase tracking-wide ${badgeBg}`}>
                      {turmasDoTurno.length} {turmasDoTurno.length === 1 ? 'Turma' : 'Turmas'}
                    </span>
                    {turmasDoTurno.length > 0 && (
                      <>
                        <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                          {turmasPresenciais.length}
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                          {turmasRemotas.length}
                        </span>
                      </>
                    )}
                  </div>
                </header>

                <div className="p-4 bg-card/20">
                  {turmasDoTurno.length === 0 ? (
                    <div className="py-5 px-4 text-center border border-dashed border-border/70 rounded-xl bg-surface/30">
                      <p className="text-xs font-bold text-text-muted">Nenhuma turma neste turno.</p>
                    </div>
                  ) : (
                    <div className={gridClasses}>
                      {turmasDoTurno.map(renderCardTurma)}
                    </div>
                  )}
                </div>
              </section>
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
        avisoDisponibilidade={descreverIndisponibilidade(disponibilidadeNovo)}
        calculoImportado={calculoImportado}
        salaSelecionadaNovo={salaSelecionadaNovo}
        capacidadeExcedidaNovo={capacidadeExcedidaNovo}
        isSavingAlocacao={isSavingAlocacao}
        isLoadingDisponibilidade={carregandoDisponibilidadeNovo}
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
        avisoDisponibilidade={descreverIndisponibilidade(disponibilidadeEdicao)}
        isSavingAlocacao={isSavingAlocacao}
        isDeletingAlocacao={isDeletingAlocacao}
        isLoadingDisponibilidade={carregandoDisponibilidadeEdicao}
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
