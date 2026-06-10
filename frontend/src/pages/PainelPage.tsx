import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Filter, Plus, X, Users, BookOpen, Tv, Minimize2, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { TurmaService } from '../api/client';

export function PainelPage() {
  const { salas, turmas, cursos, refreshTurmas } = useAppContext();

  // Relógio Digital (Horário de Brasília)
  const [horaAtual, setHoraAtual] = useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHoraBrasilia = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };



  // Estados de Visualização e Filtro
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [modoVisualizacao, setModoVisualizacao] = useState<'semanal' | 'diario'>('semanal');
  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().split('T')[0]);
  const [modoTV, setModoTV] = useState(false);
  const scrollContainerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Sincronizar o estado modoTV com o estado de fullscreen do navegador (Esc)
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

  // Efeito de Auto-Scroll horizontal no Modo TV
  useEffect(() => {
    if (!modoTV) return;

    let intervalId;
    let scrollDirection = 1; // 1 = direita, -1 = esquerda
    const scrollSpeed = 1;   // pixels por passo
    const stepTime = 30;     // ms entre passos

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

  // Função para alternar modo TV e Fullscreen
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

  // Helper para verificar se a turma está em andamento no geral (Quadro Semanal)
  const isTurmaActive = (dataInicioStr: string, dataFimStr: string) => {
    if (!dataInicioStr || !dataFimStr) return true;
    const inicio = new Date(dataInicioStr + 'T00:00:00');
    const fim = new Date(dataFimStr + 'T23:59:59');
    const hoje = new Date();
    return (inicio <= hoje && fim >= hoje);
  };

  // Helper para verificar se a turma está ativa presencialmente em uma data específica
  const isTurmaActiveOnDate = (turma: any, dateStr: string) => {
    if (!turma.dataInicio || !turma.dataFim) return true;
    const targetDate = new Date(dateStr + 'T00:00:00');
    const start = new Date(turma.dataInicio + 'T00:00:00');
    const end = new Date(turma.dataFim + 'T23:59:59');
    
    if (targetDate < start || targetDate > end) return false;
    
    // O getDay() retorna 0 para Domingo, 1 para Segunda, ..., 6 para Sábado
    const dayOfWeek = targetDate.getDay().toString();
    
    // Se for visualização diária, o card só deve aparecer no ambiente se naquele dia da semana a turma for presencial
    return turma.diasSemana.includes(dayOfWeek);
  };

  // Cálculo de progresso para a barra
  const getProgress = (dataInicioStr: string, dataFimStr: string) => {
    if (!dataInicioStr || !dataFimStr) return 0;
    const inicio = new Date(dataInicioStr + 'T00:00:00').getTime();
    const fim = new Date(dataFimStr + 'T23:59:59').getTime();
    const hoje = new Date().getTime();
    if (hoje < inicio) return 0;
    if (hoje > fim) return 100;
    return Math.round(((hoje - inicio) / (fim - inicio)) * 100);
  };

  // Formatação de datas para padrão DD/MM/AA
  const formatDataCurta = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y.slice(-2)}`;
  };

  // Formatação amigável de dias letivos / remotos
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

  const salasFiltradas = salas
    .filter(s => {
      if (filtroTipo === 'Todos') return true;
      if (filtroTipo === 'Inovadora') return s.tipo.toLowerCase().includes('inovadora');
      if (filtroTipo === 'TI') {
        const t = s.tipo.toLowerCase();
        return (t.includes('ti') || t.includes('t.i.')) && !t.includes('multiuso');
      }
      if (filtroTipo === 'Imagem') return s.tipo.toLowerCase().includes('imagem');
      if (filtroTipo === 'Auditorio') return s.tipo.toLowerCase().includes('auditório') || s.tipo.toLowerCase().includes('auditorio');
      if (filtroTipo === 'Multiuso') return s.tipo.toLowerCase().includes('multiuso');
      if (filtroTipo === 'Moda') return s.tipo.toLowerCase().includes('moda');
      return s.tipo === filtroTipo;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' }));

  const countTodas = salas.length;
  const countInovadoras = salas.filter(s => s.tipo.toLowerCase().includes('inovadora')).length;
  const countTI = salas.filter(s => {
    const t = s.tipo.toLowerCase();
    return (t.includes('ti') || t.includes('t.i.')) && !t.includes('multiuso');
  }).length;
  const countImagem = salas.filter(s => s.tipo.toLowerCase().includes('imagem')).length;
  const countAuditorio = salas.filter(s => s.tipo.toLowerCase().includes('auditório') || s.tipo.toLowerCase().includes('auditorio')).length;
  const countMultiuso = salas.filter(s => s.tipo.toLowerCase().includes('multiuso')).length;
  const countModa = salas.filter(s => s.tipo.toLowerCase().includes('moda')).length;

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

  const [autoZoom, setAutoZoom] = useState(100);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modoTV) {
      setAutoZoom(100);
      return;
    }
    // Zoom travado em 63% conforme solicitado pelo usuário para TV de 60 polegadas
    setAutoZoom(63);
  }, [modoTV]);

  const obterTaxaOcupacao = () => {
    if (salasFiltradas.length === 0) return 0;
    const slotsTotais = salasFiltradas.length * 3;
    
    const turmasAtivas = turmas.filter(t => {
      return modoVisualizacao === 'semanal' 
        ? isTurmaActive(t.dataInicio, t.dataFim)
        : isTurmaActiveOnDate(t, dataFiltro);
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
      return modoVisualizacao === 'semanal' 
        ? isTurmaActive(t.dataInicio, t.dataFim)
        : isTurmaActiveOnDate(t, dataFiltro);
    });

    // Distribui as turmas em sub-linhas virtuais sem conflito de salaId
    const subLinhas: any[][] = [];

    // Ordenamos as turmas para consistência no posicionamento das linhas
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
    diasSemana: [] as string[]
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
        diasSemana: curso.diasSemana && curso.diasSemana.length > 0 ? curso.diasSemana : ['1', '2', '3', '4', '5']
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
      alert("Este curso não possui dias letivos presenciais cadastrados. Por favor, edite o curso em Gerenciamento para definir os dias letivos.");
      return;
    }

    try {
      await TurmaService.alocar({
        id_cursos: Number(cursoSelecionado.id),
        id_salas: Number(novoAgendamento.salaId),
        data_inicio: novoAgendamento.dataInicio,
        fk_id_turno: novoAgendamento.turno === 'Manhã' ? 1 : novoAgendamento.turno === 'Tarde' ? 2 : 3,
        total_alunos: 30,
        codigo_turma: novoAgendamento.codigoTurma,
        dias_semana: novoAgendamento.diasSemana
      });

      refreshTurmas();
      setModalOpen(false);
      setNovoAgendamento({ cursoId: '', salaId: '', dataInicio: '', turno: 'Manhã', codigoTurma: '', diasSemana: [] });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erro ao alocar turma. Verifique se o ambiente já está ocupado neste dia/turno.');
    }
  };

  // --- LÓGICA DO MODAL DE EDIÇÃO E EXCLUSÃO ---
  const [editTurmaModalOpen, setEditTurmaModalOpen] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<any>(null);
  const [dadosEdicao, setDadosEdicao] = useState({
    salaId: '',
    dataInicio: '',
    turno: 'Manhã',
    diasSemana: [] as string[]
  });

  const handleEditClick = (turma: any) => {
    setTurmaEditando(turma);
    setDadosEdicao({
      salaId: turma.salaId,
      dataInicio: turma.dataInicio,
      turno: turma.turno,
      diasSemana: turma.diasSemana && turma.diasSemana.length > 0 ? turma.diasSemana : ['1', '2', '3', '4', '5']
    });
    setEditTurmaModalOpen(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaEditando) return;
    
    try {
      await TurmaService.reallocar(Number(turmaEditando.id), {
        id_salas: Number(dadosEdicao.salaId),
        data_inicio: dadosEdicao.dataInicio,
        fk_id_turno: dadosEdicao.turno === 'Manhã' ? 1 : dadosEdicao.turno === 'Tarde' ? 2 : 3,
        dias_semana: dadosEdicao.diasSemana
      });
      refreshTurmas();
      setEditTurmaModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao reallocar turma. Verifique se há conflito de sala/turno.');
    }
  };

  const handleDeletarAlocacao = async () => {
    if (!turmaEditando) return;
    if (!window.confirm(`Deseja realmente cancelar e excluir permanentemente a alocação da turma ${turmaEditando.codigo}?`)) return;

    try {
      await TurmaService.delete(Number(turmaEditando.id));
      refreshTurmas();
      setEditTurmaModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir alocação.');
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
            
            <button
              onClick={handleToggleModoTV}
              title="Sair do Modo TV"
              className="p-2 px-4 rounded-xl border flex items-center gap-1.5 text-xs font-black active:scale-95 transition-all shadow-sm cursor-pointer bg-input border-border text-text-main hover:bg-surface"
            >
              <Minimize2 size={14} /> Sair TV
            </button>
          </div>
        </div>
      ) : (
        /* Cabeçalho Completo para Modo Padrão */
        <div className="p-6 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 transition-colors bg-card border-border">
          <div className="flex flex-wrap items-center justify-between xl:justify-start gap-4">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight text-secondary dark:text-primary transition-colors">
                <CalendarIcon className="text-primary w-6 h-6 shrink-0" /> 
                Quadro de Alocações
              </h1>
              <p className="text-sm mt-0.5 font-medium text-text-muted transition-colors">
                {modoVisualizacao === 'semanal' 
                  ? 'Visualização Geral: Cursos ativos na semana útil' 
                  : `Filtro de Ocupação Diária para: ${new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR')}`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setModalOpen(true)}
                className="bg-primary text-white font-black py-2.5 px-4 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <Plus size={16} /> Alocar Turma
              </button>

              <button
                onClick={handleToggleModoTV}
                title="Entrar no Modo TV (Tela Cheia)"
                className="p-2.5 rounded-xl border flex items-center gap-1.5 text-sm font-bold active:scale-95 transition-all shadow-sm cursor-pointer bg-surface border-border text-text-muted hover:bg-border/30 hover:text-text-main"
              >
                <Tv size={16} /> Modo TV
              </button>
            </div>
          </div>

          {/* Relógio Digital (Horário de Brasília) */}
          <div className="flex items-center justify-center shrink-0">
            <div className="flex items-center gap-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/15 px-4 py-2 rounded-xl text-primary shadow-xs">
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
          </div>

          {/* CONTROLES, FILTROS E SELETORES */}
          <div className="flex flex-wrap items-center gap-4 p-2 rounded-2xl border transition-all bg-surface border-border">
            {/* Seletor de visualização (Quadro Geral vs Diário) */}
            <div className="flex bg-border/20 p-0.5 rounded-xl border border-border">
              <button
                onClick={() => setModoVisualizacao('semanal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  modoVisualizacao === 'semanal' 
                    ? 'bg-card text-text-main shadow-sm' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setModoVisualizacao('diario')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  modoVisualizacao === 'diario' 
                    ? 'bg-card text-text-main shadow-sm' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Diário
              </button>
            </div>

            {/* Filtro de Salas (Pills Premium com contagem) */}
            <div className="flex bg-border/20 p-0.5 rounded-xl border border-border">
              <button
                onClick={() => setFiltroTipo('Todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'Todos'
                    ? 'bg-card text-text-main shadow-sm font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Todas
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  filtroTipo === 'Todos' ? 'bg-surface text-text-main' : 'bg-border/40 text-text-muted'
                }`}>
                  {countTodas}
                </span>
              </button>
              <button
                onClick={() => setFiltroTipo('Inovadora')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'Inovadora'
                    ? 'bg-card text-text-main shadow-sm font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Inovadoras
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  filtroTipo === 'Inovadora' ? 'bg-surface text-text-main' : 'bg-border/40 text-text-muted'
                }`}>
                  {countInovadoras}
                </span>
              </button>
              <button
                onClick={() => setFiltroTipo('TI')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'TI'
                    ? 'bg-card text-text-main shadow-sm font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Labs TI
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  filtroTipo === 'TI' ? 'bg-surface text-text-main' : 'bg-border/40 text-text-muted'
                }`}>
                  {countTI}
                </span>
              </button>
              <button
                onClick={() => setFiltroTipo('Imagem')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'Imagem'
                    ? 'bg-card text-text-main shadow-sm font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Labs Imagem
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  filtroTipo === 'Imagem' ? 'bg-surface text-text-main' : 'bg-border/40 text-text-muted'
                }`}>
                  {countImagem}
                </span>
              </button>
              <button
                onClick={() => setFiltroTipo('Auditorio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'Auditorio'
                    ? 'bg-card text-text-main shadow-sm font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Auditório
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  filtroTipo === 'Auditorio' ? 'bg-surface text-text-main' : 'bg-border/40 text-text-muted'
                }`}>
                  {countAuditorio}
                </span>
              </button>
              <button
                onClick={() => setFiltroTipo('Multiuso')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'Multiuso'
                    ? 'bg-card text-text-main shadow-sm font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Sala Multiuso
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  filtroTipo === 'Multiuso' ? 'bg-surface text-text-main' : 'bg-border/40 text-text-muted'
                }`}>
                  {countMultiuso}
                </span>
              </button>
              <button
                onClick={() => setFiltroTipo('Moda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'Moda'
                    ? 'bg-card text-text-main shadow-sm font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Labs Moda
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  filtroTipo === 'Moda' ? 'bg-surface text-text-main' : 'bg-border/40 text-text-muted'
                }`}>
                  {countModa}
                </span>
              </button>
            </div>

            {/* Seletor de Data para Modo Diário */}
            {modoVisualizacao === 'diario' && (
              <div className="flex items-center gap-1.5 border-l border-border pl-3">
                <input 
                  type="date"
                  value={dataFiltro}
                  onChange={e => setDataFiltro(e.target.value)}
                  className="text-xs font-black border border-border rounded-lg px-2.5 py-1 outline-none transition-all bg-input text-text-main focus:border-primary"
                />
              </div>
            )}

            {modoVisualizacao === 'semanal' && (
              <div className="text-[10px] font-black uppercase tracking-wider px-2 border-l border-border pl-3 text-text-muted">
                Em Andamento
              </div>
            )}
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
                  
                  {/* Indicador Lateral do Turno (mesclado verticalmente) */}
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
                                    ? 'bg-accent/10 border-accent/30 hover:border-accent hover-glow-accent text-text-main'
                                    : 'bg-primary/10 border-primary/30 hover:border-primary hover-glow-primary text-text-main';
                                  const borderSideClass = isRemoto ? 'border-accent' : 'border-primary';
                                  
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

                                  return (
                                    <div 
                                      onClick={() => handleEditClick(turma)}
                                      className={`cursor-pointer group/card relative w-full border btn-tactile hover:scale-[1.03] transition-all flex flex-col overflow-hidden shadow-xs ${cardHeightClass} ${cardPadding} ${cardBgClass}`}
                                    >
                                      {/* Linha 1: Código da Turma e Tags */}
                                      <div className="flex items-center justify-between gap-2 shrink-0">
                                        <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-lg border border-border bg-card/65 text-text-muted shadow-xs">
                                          {turma.codigo}
                                        </span>
                                        
                                        <div className="flex gap-1.5">
                                          {turma.cursoTem && (
                                            <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                                              TEM
                                            </span>
                                          )}
                                          {isRemoto && (
                                            <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                                              Remoto
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
                                          <span className="truncate">{turma.instrutorNome}</span>
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
      </div>

      {/* MODAL DE AGENDAMENTO (NOVO) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-surface/40 shrink-0">
              <h2 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2 font-display">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Nova Alocação de Turma
              </h2>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all btn-tactile cursor-pointer"
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

              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 text-xs text-text-muted flex items-start gap-2.5">
                <CalendarIcon className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                <p className="leading-relaxed">
                  A data de término será projetada automaticamente pelo nosso Motor com base na carga horária (4h/dia), dias selecionados e feriados.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 btn-tactile cursor-pointer text-sm"
                >
                  Confirmar Alocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO E EXCLUSÃO */}
      {editTurmaModalOpen && turmaEditando && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col transition-all">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-surface/40 shrink-0">
              <h2 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2 font-display">
                <BookOpen className="w-5 h-5 text-primary" />
                Editar Alocação: {turmaEditando.codigo}
              </h2>
              <button 
                onClick={() => setEditTurmaModalOpen(false)} 
                className="text-text-muted hover:text-text-main hover:bg-surface/60 p-2 rounded-xl transition-all btn-tactile cursor-pointer"
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

              <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-border/60 shrink-0">
                <button 
                  type="button" 
                  onClick={handleDeletarAlocacao}
                  className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-450 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all btn-tactile cursor-pointer"
                >
                  <Trash2 size={14} /> Excluir Alocação
                </button>

                <div className="flex justify-end gap-3 w-full md:w-auto shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setEditTurmaModalOpen(false)} 
                    className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl btn-tactile cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="bg-primary text-white font-black py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 btn-tactile cursor-pointer text-sm"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (modoTV) {
    return createPortal(content, document.body);
  }

  return content;
}
