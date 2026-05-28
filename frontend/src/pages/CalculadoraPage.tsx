import React, { useState } from 'react';
import { Calculator, Calendar, Clock, RotateCcw } from 'lucide-react';

const DIAS = [
  { id: '1', label: 'Segunda' },
  { id: '2', label: 'Terça' },
  { id: '3', label: 'Quarta' },
  { id: '4', label: 'Quinta' },
  { id: '5', label: 'Sexta' },
];

export function CalculadoraPage() {
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [resultado, setResultado] = useState<{
    dataTermino: string;
    diasCorridos: number;
    totalAulas: number;
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

    while (classesScheduled < classesNeeded) {
      const dayOfWeek = currentDate.getDay().toString();
      if (diasSelecionados.includes(dayOfWeek)) {
        classesScheduled++;
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
      totalAulas: classesNeeded
    });
  };

  const resetar = () => {
    setCargaHoraria('');
    setDiasSelecionados([]);
    setDataInicio('');
    setResultado(null);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Cabeçalho */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-4 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-primary flex items-center gap-2 tracking-tight">
            <Calculator size={24} className="text-primary shrink-0" /> 
            Calculadora de Cronograma
          </h1>
          <p className="text-text-muted text-sm mt-1 font-medium">
            Projete a data de término estimada de uma turma com base na carga horária e dias da semana.
          </p>
        </div>

        {(cargaHoraria || diasSelecionados.length > 0 || dataInicio) && (
          <button 
            onClick={resetar}
            className="bg-surface border border-border text-text-muted hover:bg-border/30 hover:text-text-main font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm shrink-0"
          >
            <RotateCcw size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* PARÂMETROS */}
        <form onSubmit={calcular} className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-5 transition-colors duration-300">
          <h2 className="text-base font-extrabold text-secondary dark:text-primary uppercase tracking-wider border-b border-border pb-3 flex items-center gap-1.5">
            <Clock size={16} className="text-text-muted" /> Parâmetros de Cálculo
          </h2>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Carga Horária (horas)</label>
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
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Dias Letivos na Semana</label>
            <div className="flex flex-wrap gap-2.5">
              {DIAS.map(dia => {
                const isSelected = diasSelecionados.includes(dia.id);
                return (
                  <button
                    type="button"
                    key={dia.id}
                    onClick={() => handleDiaToggle(dia.id)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl border-2 active:scale-95 transition-all ${
                      isSelected 
                        ? 'bg-primary/5 border-primary text-primary shadow-sm font-black' 
                        : 'bg-input border-border text-text-muted hover:bg-surface'
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Data de Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold transition-all bg-input text-text-main"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-black py-3 rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-sm mt-2 cursor-pointer"
          >
            Gerar Cronograma
          </button>
        </form>

        {/* PROJEÇÃO / RESULTADO */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-5 min-h-[380px] transition-colors duration-300">
          <h2 className="text-base font-extrabold text-secondary dark:text-primary uppercase tracking-wider border-b border-border pb-3 flex items-center gap-1.5">
            <Calendar size={16} className="text-text-muted" /> Projeção de Término
          </h2>

          {resultado ? (
            <div className="flex flex-col gap-6 animate-in fade-in zoom-in-98 duration-200">
              
              {/* Card Principal do Término */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Data de Término Estimada
                </span>
                <span className="text-3xl font-black text-text-main tracking-tight">
                  {new Date(resultado.dataTermino + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Informações Auxiliares */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface border border-border rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Aulas Projetadas</div>
                  <div className="text-xl font-black text-accent mt-1">{resultado.totalAulas}</div>
                </div>
                
                <div className="bg-surface border border-border rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Duração Bruta</div>
                  <div className="text-xl font-black text-text-main mt-1">{resultado.diasCorridos} dias</div>
                </div>
              </div>

              {/* Detalhamento Adicional */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-text-muted">Carga Horária Informada:</span>
                  <span className="text-text-main font-bold">{cargaHoraria} horas</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-text-muted">Regra de cálculo:</span>
                  <span className="text-text-main font-bold">4h/dia letivo útil</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60 gap-3">
              <Calculator size={56} className="text-text-muted stroke-[1.5]" />
              <p className="text-sm font-semibold text-text-muted max-w-[280px]">
                Preencha os parâmetros à esquerda e clique em "Gerar Cronograma" para ver a projeção detalhada.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
