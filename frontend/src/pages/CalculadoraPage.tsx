import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Calendar, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarDays,
  Loader2,
  BookOpen
} from 'lucide-react';
import { CalculadoraService } from '../api/client';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const DIAS = [
  { id: '1', label: 'Segunda-feira', short: 'Seg' },
  { id: '2', label: 'Terça-feira', short: 'Ter' },
  { id: '3', label: 'Quarta-feira', short: 'Qua' },
  { id: '4', label: 'Quinta-feira', short: 'Qui' },
  { id: '5', label: 'Sexta-feira', short: 'Sex' },
  { id: '6', label: 'Sábado', short: 'Sáb' },
  { id: '0', label: 'Domingo', short: 'Dom' },
];

const PRESETS_HORAS = [40, 80, 160, 200, 400, 800];
const PRESETS_DURACAO_DIARIA = [2, 3, 4, 5];

interface FeriadoPulado {
  data: string;
  descricao: string;
  tipo?: string;
}

interface ResultadoCronograma {
  dataTermino: string;
  diasCorridos: number;
  totalAulas: number;
  horasPorAula: number;
  datasAulas: string[];
  feriadosPulados?: FeriadoPulado[];
}

export function CalculadoraPage() {
  const { cursos, showToast } = useAppContext();
  const navigate = useNavigate();

  const [cursoSelecionadoId, setCursoSelecionadoId] = useState<string>('');
  const [cargaHoraria, setCargaHoraria] = useState('160');
  const [horasPorDia, setHorasPorDia] = useState<number>(4);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(['1', '3', '5']);
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCronograma | null>(null);

  // Selecionar curso pré-cadastrado
  const handleSelectCurso = (id: string) => {
    setCursoSelecionadoId(id);
    if (!id) return;

    const curso = cursos.find(c => c.id === id);
    if (curso) {
      if (curso.cargaHoraria) setCargaHoraria(curso.cargaHoraria.toString());
      if (curso.diasSemana && curso.diasSemana.length > 0) {
        setDiasSelecionados(curso.diasSemana);
      }
      showToast(`Parâmetros carregados de "${curso.nome}"`, 'info');
    }
  };

  const handleDiaToggle = (id: string) => {
    setDiasSelecionados(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  // Atalhos Rápidos de Data
  const setDateShortcut = (type: 'today' | 'nextMonday' | 'nextMonth') => {
    const now = new Date();
    let target = new Date();

    if (type === 'today') {
      target = now;
    } else if (type === 'nextMonday') {
      const day = now.getDay();
      const diff = (day === 0 ? 1 : 8 - day);
      target.setDate(now.getDate() + diff);
    } else if (type === 'nextMonth') {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const [year, month, day] = [
      target.getFullYear(),
      String(target.getMonth() + 1).padStart(2, '0'),
      String(target.getDate()).padStart(2, '0')
    ];
    setDataInicio(`${year}-${month}-${day}`);
  };

  // Executar Cálculo via API Real do Backend
  const calcular = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cargaHoraria || Number(cargaHoraria) <= 0) {
      return showToast('Informe uma carga horária válida.', 'error');
    }
    if (diasSelecionados.length === 0) {
      return showToast('Selecione pelo menos um dia da semana.', 'error');
    }
    if (!dataInicio) {
      return showToast('Informe a data de início da turma.', 'error');
    }

    setIsCalculating(true);
    try {
      const res = await CalculadoraService.calcularCronograma({
        cargaHoraria: Number(cargaHoraria),
        dataInicio,
        diasSemana: diasSelecionados,
        horasPorDia: Number(horasPorDia) || 4
      });

      setResultado(res);
      showToast('Cronograma projetado com sucesso!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao calcular cronograma no servidor.';
      showToast(msg, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  const resetar = () => {
    setCursoSelecionadoId('');
    setCargaHoraria('160');
    setHorasPorDia(4);
    setDiasSelecionados(['1', '3', '5']);
    const today = new Date();
    setDataInicio(today.toISOString().split('T')[0]);
    setResultado(null);
    setShowAllDates(false);
  };

  // Copiar Cronograma para o Clipboard
  const copiarCronograma = () => {
    if (!resultado || !resultado.datasAulas.length) return;

    let texto = `📅 CRONOGRAMA DE AULAS\n`;
    texto += `Carga Horária: ${cargaHoraria}h (${horasPorDia}h/dia - ${resultado.totalAulas} encontros)\n`;
    texto += `Início: ${formatDateBr(dataInicio)} | Término Estimado: ${formatDateBr(resultado.dataTermino)}\n`;
    texto += `Duração: ${resultado.diasCorridos} dias corridos\n\n`;
    texto += `--- ENCONTROS AGENDADOS ---\n`;

    resultado.datasAulas.forEach((dataStr, index) => {
      const dataObj = parseDateLocal(dataStr);
      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      texto += `${String(index + 1).padStart(2, '0')}. ${formatDateBr(dataStr)} (${diaSemana})\n`;
    });

    if (resultado.feriadosPulados && resultado.feriadosPulados.length > 0) {
      texto += `\n🏖️ FERIADOS/RECESSOS NO PERÍODO:\n`;
      resultado.feriadosPulados.forEach(f => {
        texto += `- ${formatDateBr(f.data)}: ${f.descricao}\n`;
      });
    }

    navigator.clipboard.writeText(texto).then(() => {
      showToast('Cronograma copiado para a área de transferência!', 'success');
    });
  };

  // Exportar Cronograma em CSV
  const exportarCSV = () => {
    if (!resultado || !resultado.datasAulas.length) return;

    let csv = `Encontro,Data,Dia da Semana,Horas,Feriados\n`;
    resultado.datasAulas.forEach((dataStr, index) => {
      const dataObj = parseDateLocal(dataStr);
      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      csv += `${index + 1},${formatDateBr(dataStr)},"${diaSemana}",${horasPorDia}h,\n`;
    });

    if (resultado.feriadosPulados && resultado.feriadosPulados.length > 0) {
      resultado.feriadosPulados.forEach(f => {
        const dataObj = parseDateLocal(f.data);
        const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
        csv += `RECESSO,${formatDateBr(f.data)},"${diaSemana}",0h,"${f.descricao}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cronograma_${cargaHoraria}h_${dataInicio}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download do arquivo CSV iniciado!', 'success');
  };

  // Redirecionar para alocação com pré-preenchimento
  const irParaAlocacao = () => {
    if (!resultado) return;
    showToast('Redirecionando para o Mapa de Salas...', 'info');
    navigate('/painel');
  };

  // Helpers de Formatação Segura de Datas
  function parseDateLocal(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  function formatDateBr(dateStr: string) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const renderTimelineItem = (dataStr: string, numero: number) => {
    const dataObj = parseDateLocal(dataStr);
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaSemanaCapitalized = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const dataFormatada = formatDateBr(dataStr);
    
    return (
      <div key={`${dataStr}-${numero}`} className="relative pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group/time py-1">
        {/* Marcador Circular na Linha */}
        <div className="absolute left-[-7px] top-2.5 sm:top-1/2 sm:-translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-primary bg-card z-10 flex items-center justify-center transition-all group-hover/time:scale-125 group-hover/time:bg-primary shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover/time:bg-white"></span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Encontro #{numero}</span>
          <h4 className="text-sm font-black text-text-main leading-tight tracking-tight mt-0.5 font-display">
            {diaSemanaCapitalized}
          </h4>
        </div>
        <div className="sm:text-right shrink-0">
          <span className="bg-primary/5 text-primary border border-primary/20 text-[10px] font-black px-2.5 py-1 rounded-xl tracking-wider shadow-xs font-mono">
            {dataFormatada}
          </span>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    if (!resultado || !resultado.datasAulas || resultado.datasAulas.length === 0) return null;
    const total = resultado.datasAulas.length;
    
    if (showAllDates || total <= 8) {
      return (
        <div className="flex flex-col gap-3">
          {resultado.datasAulas.map((dataStr, index) => renderTimelineItem(dataStr, index + 1))}
        </div>
      );
    }
    
    const primeiras = resultado.datasAulas.slice(0, 4);
    const ultimas = resultado.datasAulas.slice(-4);
    
    return (
      <div className="flex flex-col gap-3">
        {primeiras.map((dataStr, index) => renderTimelineItem(dataStr, index + 1))}
        
        {/* Divisor Intermediário com Botão de Expansão */}
        <div className="relative pl-8 my-2 py-2">
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-7 bg-transparent flex flex-col justify-between items-center z-10">
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></span>
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></span>
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></span>
          </div>
          <div className="flex items-center justify-between gap-2 bg-surface/50 border border-border/80 p-3 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">
                + {total - 8} encontros intermediários
              </span>
              <span className="text-[11px] font-semibold text-text-muted/80 mt-0.5">
                Projetados e validados pelo motor inteligente
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllDates(true)}
              className="bg-card hover:bg-surface border border-border text-primary text-xs font-black px-3 py-1.5 rounded-xl btn-tactile cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <ChevronDown size={14} /> Ver Todas ({total})
            </button>
          </div>
        </div>

        {ultimas.map((dataStr, index) => renderTimelineItem(dataStr, total - 4 + index + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-350 relative z-10">
      
      {/* Cabeçalho */}
      <div className="glass-panel p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-primary flex items-center gap-2.5 tracking-tight font-display">
            <Calculator size={26} className="text-primary shrink-0 animate-pulse" /> 
            Calculadora de Cronograma Educacional
          </h1>
          <p className="text-text-muted text-sm mt-1 font-medium">
            Projete o término real de turmas integrando o calendário letivo e os feriados cadastrados no sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(cargaHoraria || diasSelecionados.length > 0 || dataInicio) && (
            <button 
              onClick={resetar}
              className="bg-surface/50 border border-border/80 text-text-muted hover:bg-surface hover:text-text-main font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 btn-tactile transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <RotateCcw size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* PARÂMETROS - Col 5 */}
        <form onSubmit={calcular} className="xl:col-span-5 glass-panel rounded-3xl p-6 shadow-xs flex flex-col gap-5 transition-colors duration-300">
          
          <div className="flex justify-between items-center border-b border-border/60 pb-3.5">
            <h2 className="text-sm font-extrabold text-secondary dark:text-primary uppercase tracking-widest flex items-center gap-2 font-display">
              <Clock size={16} className="text-text-muted" /> Parâmetros do Curso
            </h2>
            <span className="text-[10px] font-bold text-text-muted font-mono">Motor PostgreSQL</span>
          </div>

          {/* Seletor Opcional de Cursos Pré-Cadastrados */}
          {cursos.length > 0 && (
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <BookOpen size={12} className="text-primary" /> Carregar de Curso Existente <span className="text-[10px] lowercase font-normal">(opcional)</span>
              </label>
              <select
                value={cursoSelecionadoId}
                onChange={e => handleSelectCurso(e.target.value)}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              >
                <option value="">Selecionar curso pré-cadastrado...</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.cargaHoraria || 160}h - {c.modalidade})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Carga Horária com Presets */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest">
                Carga Horária (horas)
              </label>
            </div>

            <input
              type="number"
              min="1"
              step="1"
              value={cargaHoraria}
              onChange={e => setCargaHoraria(e.target.value)}
              placeholder="Ex: 160"
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
              required
            />

            {/* Presets Rápidos de Carga Horária */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS_HORAS.map(horas => (
                <button
                  type="button"
                  key={horas}
                  onClick={() => setCargaHoraria(horas.toString())}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    cargaHoraria === horas.toString()
                      ? 'bg-primary text-white border-primary shadow-xs font-black'
                      : 'bg-surface/50 text-text-muted hover:text-text-main border-border/80'
                  }`}
                >
                  {horas}h
                </button>
              ))}
            </div>
          </div>

          {/* Horas por Encontro Diário */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
              Duração do Encontro Diário
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS_DURACAO_DIARIA.map(h => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHorasPorDia(h)}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    horasPorDia === h
                      ? 'bg-primary/10 border-primary text-primary shadow-xs font-black'
                      : 'bg-input text-text-muted hover:bg-surface/50 hover:text-text-main border-border/80'
                  }`}
                >
                  {h}h / dia
                </button>
              ))}
            </div>
          </div>

          {/* Dias de Aula na Semana (Segunda a Domingo) */}
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">
              Dias Letivos na Semana
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {DIAS.map(dia => {
                const isSelected = diasSelecionados.includes(dia.id);
                return (
                  <button
                    type="button"
                    key={dia.id}
                    onClick={() => handleDiaToggle(dia.id)}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-primary text-white border-primary shadow-xs font-black' 
                        : 'bg-input text-text-muted hover:bg-surface/50 hover:text-text-main border-border/80'
                    }`}
                  >
                    {dia.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data de Início com Atalhos */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest">
                Data de Início da Turma
              </label>
            </div>

            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              required
            />

            {/* Chips de Atalho de Data */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setDateShortcut('today')}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-border bg-surface/50 text-text-muted hover:text-text-main cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setDateShortcut('nextMonday')}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-border bg-surface/50 text-text-muted hover:text-text-main cursor-pointer"
              >
                Próxima Segunda
              </button>
              <button
                type="button"
                onClick={() => setDateShortcut('nextMonth')}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-border bg-surface/50 text-text-muted hover:text-text-main cursor-pointer"
              >
                Início do Próx. Mês
              </button>
            </div>
          </div>

          {/* Botão de Calcular */}
          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-primary text-white font-black py-3.5 rounded-xl shadow-md btn-tactile hover:shadow-lg hover:shadow-primary/20 transition-all text-sm mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCalculating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Calculando com Feriados...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Gerar Cronograma Inteligente
              </>
            )}
          </button>
        </form>

        {/* PROJEÇÃO / RESULTADO BENTO - Col 7 */}
        <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[380px]">
          
          {resultado ? (
            <>
              {/* Bento Card 1: Data de Término Gigante (Destaque Principal) */}
              <div className="md:col-span-2 glass-panel rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-4 border border-border transition-colors duration-300">
                <div className="flex justify-between items-start border-b border-border/60 pb-3">
                  <h2 className="text-sm font-extrabold text-secondary dark:text-primary uppercase tracking-widest flex items-center gap-2 font-display">
                    <Calendar size={16} className="text-text-muted" /> Projeção de Término Oficial
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={10} /> Validado c/ Feriados
                    </span>
                  </div>
                </div>
                
                <div className="py-7 text-center flex flex-col gap-2 bg-primary/5 rounded-2xl border border-primary/15 shadow-xs relative overflow-hidden">
                  <span className="text-xs font-black text-primary uppercase tracking-widest z-10">
                    Data Limite de Conclusão
                  </span>
                  <span className="text-4xl md:text-5xl font-black text-text-main tracking-tight font-display z-10">
                    {formatDateBr(resultado.dataTermino)}
                  </span>
                  <span className="text-xs text-text-muted font-semibold z-10">
                    {parseDateLocal(resultado.dataTermino).toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </span>
                </div>

                {/* Botões de Ação Rápida */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copiarCronograma}
                      className="bg-card hover:bg-surface border border-border text-text-muted hover:text-text-main font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 btn-tactile cursor-pointer shadow-xs"
                      title="Copiar lista de encontros"
                    >
                      <Copy size={13} /> Copiar Datas
                    </button>
                    <button
                      onClick={exportarCSV}
                      className="bg-card hover:bg-surface border border-border text-text-muted hover:text-text-main font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 btn-tactile cursor-pointer shadow-xs"
                      title="Baixar em formato CSV"
                    >
                      <Download size={13} /> Exportar CSV
                    </button>
                  </div>

                  <button
                    onClick={irParaAlocacao}
                    className="bg-primary text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm btn-tactile cursor-pointer hover:scale-105 transition-all"
                  >
                    <CalendarDays size={13} /> Alocar Turma no Mapa
                  </button>
                </div>
              </div>

              {/* Bento Card 2: Aulas Projetadas */}
              <div className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between border border-border transition-colors duration-300">
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Encontros Letivos</span>
                  <p className="text-xs text-text-muted mt-0.5 font-medium">Total de dias com aula ativa.</p>
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-black text-primary font-display">{resultado.totalAulas}</span>
                  <span className="text-xs font-bold text-text-muted">aulas ({resultado.horasPorAula}h/dia)</span>
                </div>
              </div>

              {/* Bento Card 3: Duração Bruta */}
              <div className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between border border-border transition-colors duration-300">
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Duração Total</span>
                  <p className="text-xs text-text-muted mt-0.5 font-medium">Dias corridos com finais de semana e recessos.</p>
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-black text-text-main font-display">{resultado.diasCorridos}</span>
                  <span className="text-xs font-bold text-text-muted">dias de calendário</span>
                </div>
              </div>

              {/* Bento Card 4 (Opcional): Feriados e Recessos Pulados no Período */}
              {resultado.feriadosPulados && resultado.feriadosPulados.length > 0 && (
                <div className="md:col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest">
                    <AlertTriangle size={15} /> Feriados & Recessos Contornados ({resultado.feriadosPulados.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resultado.feriadosPulados.map((f, idx) => (
                      <span 
                        key={idx} 
                        className="bg-card/80 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
                      >
                        <span className="font-mono font-black">{formatDateBr(f.data)}</span>: {f.descricao}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bento Card 5: Linha do Tempo Vertical Interativa */}
              <div className="md:col-span-2 glass-panel rounded-3xl p-6 shadow-xs flex flex-col gap-4 border border-border/80 transition-colors">
                <div className="flex justify-between items-center border-b border-border/60 pb-3">
                  <h3 className="text-xs font-black text-secondary dark:text-primary uppercase tracking-widest flex items-center gap-2 font-display">
                    <Calendar size={16} className="text-text-muted" /> Linha do Tempo das Aulas
                  </h3>
                  {resultado.datasAulas.length > 8 && (
                    <button
                      onClick={() => setShowAllDates(prev => !prev)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {showAllDates ? (
                        <>
                          <ChevronUp size={14} /> Recolher
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} /> Expandir Todas ({resultado.datasAulas.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="relative border-l border-primary/20 ml-2.5 pl-2 py-1.5 flex flex-col gap-1 max-h-[380px] overflow-y-auto custom-scrollbar">
                  {renderTimeline()}
                </div>
              </div>
            </>
          ) : (
            <div className="md:col-span-2 glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-8 opacity-85 gap-3.5 border border-border">
              <div className="p-4 bg-surface/50 rounded-full border border-border/80">
                <Calculator size={44} className="text-text-muted stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-black text-text-main tracking-widest uppercase font-display">Aguardando Parâmetros</h3>
              <p className="text-sm font-medium text-text-muted max-w-[320px]">
                Defina a carga horária, os dias da semana e a data de início para projetar o cronograma com validação de feriados.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
