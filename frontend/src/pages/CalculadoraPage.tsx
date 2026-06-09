import React, { useState } from 'react';
import { Calculator, Calendar, Clock, RotateCcw } from 'lucide-react';

const DIAS = [
  { id: '1', label: 'Segunda', short: 'Seg' },
  { id: '2', label: 'Terça', short: 'Ter' },
  { id: '3', label: 'Quarta', short: 'Qua' },
  { id: '4', label: 'Quinta', short: 'Qui' },
  { id: '5', label: 'Sexta', short: 'Sex' },
];

export function CalculadoraPage() {
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [resultado, setResultado] = useState<{
    dataTermino: string;
    diasCorridos: number;
    totalAulas: number;
    datasAulas: string[];
  } | null>(null);

  const handleDiaToggle = (id: string) => {
    setDiasSelecionados(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const calcular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargaHoraria || diasSelecionados.length === 0 || !dataInicio) return;

    const hours = parseInt(cargaHoraria);
    const classesNeeded = Math.ceil(hours / 4); // 4h por dia letivo

    let currentDate = new Date(dataInicio);
    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());

    let classesScheduled = 0;
    const datasAulas: string[] = [];

    while (classesScheduled < classesNeeded) {
      const dayOfWeek = currentDate.getDay().toString();
      if (diasSelecionados.includes(dayOfWeek)) {
        classesScheduled++;
        datasAulas.push(currentDate.toISOString().split('T')[0]);
      }
      if (classesScheduled < classesNeeded) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const start = new Date(dataInicio);
    start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
    const diffTime = Math.abs(currentDate.getTime() - start.getTime());
    const diasCorridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setResultado({
      dataTermino: currentDate.toISOString().split('T')[0],
      diasCorridos,
      totalAulas: classesNeeded,
      datasAulas
    });
  };

  const resetar = () => {
    setCargaHoraria('');
    setDiasSelecionados([]);
    setDataInicio('');
    setResultado(null);
  };

  const renderTimelineItem = (dataStr: string, numero: number) => {
    const dataObj = new Date(dataStr + 'T00:00:00');
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaSemanaCapitalized = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    
    return (
      <div key={`${dataStr}-${numero}`} className="relative pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group/time">
        {/* Marcador Circular na Linha */}
        <div className="absolute left-[-7px] top-1.5 sm:top-1/2 sm:-translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-primary bg-card z-10 flex items-center justify-center transition-all group-hover/time:scale-125 group-hover/time:bg-primary shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover/time:bg-white"></span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Encontro #{numero}</span>
          <h4 className="text-sm font-black text-text-main leading-tight tracking-tight mt-0.5 font-display">
            {diaSemanaCapitalized}
          </h4>
        </div>
        <div className="sm:text-right shrink-0">
          <span className="bg-primary/5 text-primary border border-primary/20 text-[10px] font-black px-2.5 py-1.5 rounded-xl tracking-wider shadow-xs">
            {dataFormatada}
          </span>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    if (!resultado || !resultado.datasAulas || resultado.datasAulas.length === 0) return null;
    const total = resultado.datasAulas.length;
    
    if (total <= 8) {
      return (
        <div className="flex flex-col gap-5">
          {resultado.datasAulas.map((dataStr, index) => renderTimelineItem(dataStr, index + 1))}
        </div>
      );
    }
    
    const primeiras = resultado.datasAulas.slice(0, 4);
    const ultimas = resultado.datasAulas.slice(-4);
    
    return (
      <div className="flex flex-col gap-5">
        {primeiras.map((dataStr, index) => renderTimelineItem(dataStr, index + 1))}
        
        {/* Divisor Intermediário */}
        <div className="relative pl-8 my-2 py-2">
          {/* Marcador Pontilhado no Centro da Linha */}
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-7 bg-transparent flex flex-col justify-between items-center z-10">
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></span>
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></span>
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">
              + {total - 8} encontros intermediários
            </span>
            <span className="text-[10px] font-semibold text-text-muted/80 leading-none">
              projetados e validados pelo motor
            </span>
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
            Calculadora de Cronograma
          </h1>
          <p className="text-text-muted text-sm mt-1 font-medium">
            Projete o cronograma e a estimativa de término de suas turmas com o motor inteligente de datas.
          </p>
        </div>

        {(cargaHoraria || diasSelecionados.length > 0 || dataInicio) && (
          <button 
            onClick={resetar}
            className="bg-surface/50 border border-border/80 text-text-muted hover:bg-surface hover:text-text-main font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 btn-tactile transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <RotateCcw size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Bento Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* PARÂMETROS - Col 5 */}
        <form onSubmit={calcular} className="xl:col-span-5 glass-panel rounded-3xl p-6 shadow-xs flex flex-col gap-5 transition-colors duration-300">
          <h2 className="text-sm font-extrabold text-secondary dark:text-primary uppercase tracking-widest border-b border-border/60 pb-3.5 flex items-center gap-2 font-display">
            <Clock size={16} className="text-text-muted" /> Parâmetros do Curso
          </h2>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Carga Horária (horas)</label>
            <input
              type="number"
              value={cargaHoraria}
              onChange={e => setCargaHoraria(e.target.value)}
              placeholder="Ex: 800"
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2.5">Dias de Aula na Semana</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(dia => {
                const isSelected = diasSelecionados.includes(dia.id);
                return (
                  <button
                    type="button"
                    key={dia.id}
                    onClick={() => handleDiaToggle(dia.id)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl border border-border/80 btn-tactile cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/10 border-primary text-primary shadow-xs font-black' 
                        : 'bg-input text-text-muted hover:bg-surface/50 hover:text-text-main'
                    }`}
                  >
                    {dia.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Data de Início da Turma</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main cursor-pointer"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-black py-3.5 rounded-xl shadow-md btn-tactile hover:shadow-lg hover:shadow-primary/20 transition-all text-sm mt-2 cursor-pointer"
          >
            Gerar Cronograma
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
                    <Calendar size={16} className="text-text-muted" /> Projeção de Término
                  </h2>
                  <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    Calculado
                  </span>
                </div>
                
                <div className="py-7 text-center flex flex-col gap-2 bg-primary/5 rounded-2xl border border-primary/15 shadow-xs relative overflow-hidden">
                  <span className="text-xs font-black text-primary uppercase tracking-widest z-10">
                    Data Limite Estimada
                  </span>
                  <span className="text-4xl md:text-5xl font-black text-text-main tracking-tight font-display z-10">
                    {new Date(resultado.dataTermino + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Bento Card 2: Aulas Projetadas */}
              <div className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between border border-border transition-colors duration-300">
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Aulas Planejadas</span>
                  <p className="text-xs text-text-muted mt-0.5 font-medium">Total de dias úteis com aula.</p>
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-black text-accent font-display">{resultado.totalAulas}</span>
                  <span className="text-xs font-bold text-text-muted">encontros</span>
                </div>
              </div>

              {/* Bento Card 3: Duração Bruta */}
              <div className="glass-panel rounded-3xl p-5 shadow-xs flex flex-col justify-between border border-border transition-colors duration-300">
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Duração Bruta</span>
                  <p className="text-xs text-text-muted mt-0.5 font-medium">Tempo total corrido (inclui recessos).</p>
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-black text-text-main font-display">{resultado.diasCorridos}</span>
                  <span className="text-xs font-bold text-text-muted">dias corridos</span>
                </div>
              </div>

              {/* Bento Card 4: Linha do tempo vertical interativa */}
              <div className="md:col-span-2 glass-panel rounded-3xl p-6 shadow-xs flex flex-col gap-4 border border-border/80 transition-colors">
                <h3 className="text-xs font-black text-secondary dark:text-primary uppercase tracking-widest border-b border-border/60 pb-3 flex items-center gap-2 font-display">
                  <Calendar size={16} className="text-text-muted" /> Linha do Tempo de Aulas Projetadas
                </h3>
                
                <div className="relative border-l border-primary/20 ml-2.5 pl-2 py-1.5 flex flex-col gap-1 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {renderTimeline()}
                </div>
              </div>

              {/* Bento Card 5: Detalhamento Técnico */}
              <div className="md:col-span-2 bg-surface/30 border border-border/65 rounded-3xl p-5 flex flex-col gap-3.5 transition-colors">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border/40 pb-2">Regras Aplicadas</div>
                <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Carga Horária</span>
                    <span className="text-text-main font-black">{cargaHoraria} horas</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Regra do Motor</span>
                    <span className="text-text-main font-black">4h por dia letivo útil</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="md:col-span-2 glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-8 opacity-75 gap-3.5 border border-border">
              <div className="p-4 bg-surface/50 rounded-full border border-border/80">
                <Calculator size={44} className="text-text-muted stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-black text-text-main tracking-widest uppercase">Aguardando Parâmetros</h3>
              <p className="text-sm font-medium text-text-muted max-w-[280px]">
                Defina as horas, selecione os dias da semana de aula e clique em "Gerar Cronograma" para ver a projeção.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
