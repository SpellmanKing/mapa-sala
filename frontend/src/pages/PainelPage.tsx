import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Plus, X, Users, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { TurmaService } from '../api/client';

export function PainelPage() {
  const { salas, turmas, cursos, refreshTurmas } = useAppContext();

  // Filtros Globais
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  
  // Filtro Customizado de Datas
  const [customFilter, setCustomFilter] = useState({ active: false, start: '', end: '' });

  // Lógica de tempo (Semana atual)
  const nextWeek = () => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  const prevWeek = () => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));

  const getWeekDays = (startDate: Date) => {
    const days: Date[] = [];
    const date = new Date(startDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);

    for (let i = 0; i < 5; i++) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getWeekDays(currentDate);
  let periodStart = new Date(days[0]);
  periodStart.setHours(0, 0, 0, 0);
  let periodEnd = new Date(days[4]);
  periodEnd.setHours(23, 59, 59, 999);

  // Se o filtro customizado estiver ativo, subscreve o período visualizado
  if (customFilter.active && customFilter.start && customFilter.end) {
    periodStart = new Date(customFilter.start + 'T00:00:00');
    periodEnd = new Date(customFilter.end + 'T23:59:59');
  }

  // Helper para verificar se a turma está ativa no período
  const isTurmaActive = (dataInicioStr: string, dataFimStr: string) => {
    if (!dataInicioStr || !dataFimStr) return true;
    const inicio = new Date(dataInicioStr + 'T00:00:00');
    const fim = new Date(dataFimStr + 'T23:59:59');
    return (inicio <= periodEnd && fim >= periodStart);
  };

  const TURNOS = ['Manhã', 'Tarde', 'Noite'];

  // --- LÓGICA DO MODAL DE AGENDAMENTO ---
  const [modalOpen, setModalOpen] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({ 
    cursoId: '', 
    salaId: '', 
    dataInicio: '', 
    turno: 'Manhã',
    codigoTurma: '',
    diasSemana: [] as string[]
  });

  const DIAS_SEMANA_OPCOES = [
    { value: '1', label: 'Seg' },
    { value: '2', label: 'Ter' },
    { value: '3', label: 'Qua' },
    { value: '4', label: 'Qui' },
    { value: '5', label: 'Sex' },
  ];

  const handleToggleDia = (valor: string) => {
    setNovoAgendamento(prev => {
      const isSelected = prev.diasSemana.includes(valor);
      const newDias = isSelected 
        ? prev.diasSemana.filter(d => d !== valor)
        : [...prev.diasSemana, valor];
      return { ...prev, diasSemana: newDias };
    });
  };

  const handleCriarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    const cursoSelecionado = cursos.find(c => c.id === novoAgendamento.cursoId);
    if (!cursoSelecionado || !novoAgendamento.dataInicio || !novoAgendamento.salaId || !novoAgendamento.codigoTurma) return;

    if (novoAgendamento.diasSemana.length === 0) {
      alert("Selecione ao menos um dia da semana para o curso.");
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
    } catch (err) {
      console.error(err);
      alert('Erro ao alocar turma. Verifique o console.');
    }
  };

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y.slice(-2)}`;
  };

  const salasFiltradas = salas.filter(s => filtroTipo === 'Todos' || s.tipo === filtroTipo);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      
      {/* HEADER */}
      <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between bg-white gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-secondary)] flex items-center gap-2 tracking-tight">
              <CalendarIcon className="text-[var(--color-primary)] w-6 h-6" /> 
              Quadro de Ocupação
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Visualização em Matriz: Turnos x Salas</p>
          </div>
          <button 
            onClick={() => setModalOpen(true)}
            className="ml-4 bg-[var(--color-primary)] text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:opacity-90 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
        
        {/* FILTROS E CONTROLES */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 px-2 border-r border-gray-300">
            <Filter className="text-gray-400 w-5 h-5" />
            <select 
              value={filtroTipo} 
              onChange={e => setFiltroTipo(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer shadow-sm"
            >
              <option value="Todos">Salas: Todas</option>
              <option value="Inovadora">Inovadoras</option>
              <option value="TI">Laboratórios TI</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-2 border-r border-gray-300">
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <input type="checkbox" checked={customFilter.active} onChange={e => setCustomFilter({...customFilter, active: e.target.checked})} className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
              Filtrar por Período
            </label>
            {customFilter.active && (
              <div className="flex items-center gap-1">
                <input type="date" value={customFilter.start} onChange={e => setCustomFilter({...customFilter, start: e.target.value})} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none" />
                <span className="text-gray-400 text-xs">até</span>
                <input type="date" value={customFilter.end} onChange={e => setCustomFilter({...customFilter, end: e.target.value})} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none" />
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 pr-2 ${customFilter.active ? 'opacity-50 pointer-events-none' : ''}`}>
            <button onClick={prevWeek} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-[var(--color-secondary)] transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-sm min-w-[180px] text-center text-[var(--color-secondary)] capitalize tracking-wide flex flex-col">
              <span className="text-xs text-gray-400">{customFilter.active ? 'Desabilitado' : 'Semana Visualizada'}</span>
              {!customFilter.active && (
                 <>{days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a {days[4].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</>
              )}
            </div>
            <button onClick={nextWeek} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-[var(--color-secondary)] transition-all shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* MATRIZ (GRID) */}
      <div className="flex-1 overflow-auto bg-gray-50/30 custom-scrollbar p-4">
        <div className="min-w-max border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* HEADER COLUNAS */}
          <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-20 backdrop-blur-md">
            <div className="w-24 shrink-0 border-r border-gray-200 p-4 flex items-center justify-center font-black text-[var(--color-secondary)] uppercase tracking-widest text-xs bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)] sticky left-0 z-30">
              TURNOS
            </div>
            {salasFiltradas.map((sala) => (
              <div key={sala.id} className="w-64 shrink-0 border-r border-gray-200 p-3 flex flex-col items-center justify-center gap-1 bg-white">
                <div className="font-extrabold text-[var(--color-secondary)] text-sm uppercase tracking-wider bg-blue-50/50 px-3 py-1 rounded-md border border-blue-100">
                  {sala.nome}
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase flex gap-2">
                  <span>Cap: {sala.capacidade}</span>
                  <span>•</span>
                  <span className="truncate max-w-[100px]" title={sala.tipo}>{sala.tipo}</span>
                </div>
              </div>
            ))}
          </div>

          {/* LINHAS = TURNOS */}
          <div className="flex-1 flex flex-col">
            {TURNOS.map((turno) => (
              <div key={turno} className="flex border-b border-gray-200 last:border-b-0 group min-h-[140px]">
                
                <div className="w-24 shrink-0 border-r border-gray-200 p-2 flex items-center justify-center bg-gray-50 group-hover:bg-blue-50/30 transition-colors sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <div className="font-black text-[var(--color-secondary)] uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.2em' }}>
                    {turno}
                  </div>
                </div>

                {salasFiltradas.map((sala) => {
                  const turmasNestaCelula = turmas.filter(t => 
                    t.salaId === sala.id && 
                    t.turno === turno && 
                    isTurmaActive(t.dataInicio, t.dataFim)
                  );

                  return (
                    <div key={`${turno}-${sala.id}`} className="w-64 shrink-0 border-r border-gray-200 p-3 bg-white group-hover:bg-blue-50/10 transition-colors relative flex flex-col gap-3">
                      {turmasNestaCelula.map(turma => (
                        <div 
                          key={turma.id}
                          className={`relative w-full rounded-xl p-3 border-l-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col gap-2 ${turma.modalidade === 'Remoto' ? 'bg-orange-50/50 border-[var(--color-accent)]' : 'bg-blue-50/30 border-[var(--color-primary)]'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded shadow-sm text-[var(--color-secondary)] border border-gray-100">
                              {turma.codigo}
                            </span>
                            {turma.modalidade === 'Remoto' && (
                              <span className="text-[9px] font-bold bg-[var(--color-accent)] text-white px-1.5 py-0.5 rounded uppercase">Remoto</span>
                            )}
                          </div>

                          <div className="font-bold text-sm leading-tight text-gray-800 break-words line-clamp-2" title={turma.cursoNome}>
                            <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 text-[var(--color-primary)] opacity-70" />
                            {turma.cursoNome}
                          </div>

                          <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t border-gray-200/60">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 truncate" title={turma.instrutorNome}>
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              {turma.instrutorNome}
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                              <span>{formatDateBR(turma.dataInicio)}</span>
                              <div className="flex-1 mx-2 h-px bg-gray-300 relative">
                                <div className="absolute inset-y-0 left-0 bg-[var(--color-primary)] opacity-30 w-1/2"></div>
                              </div>
                              <span>{formatDateBR(turma.dataFim)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE AGENDAMENTO */}
      {modalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-[var(--color-secondary)]">Formulário de Agendamento</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCriarAgendamento} className="p-6 flex flex-col gap-5 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Curso</label>
                  <select 
                    value={novoAgendamento.cursoId}
                    onChange={e => setNovoAgendamento({...novoAgendamento, cursoId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                    required
                  >
                    <option value="" disabled>Selecione um curso...</option>
                    {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Código da Turma</label>
                  <input 
                    type="text"
                    placeholder="Ex: 2025.09.75"
                    value={novoAgendamento.codigoTurma}
                    onChange={e => setNovoAgendamento({...novoAgendamento, codigoTurma: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sala / Ambiente</label>
                <select 
                  value={novoAgendamento.salaId}
                  onChange={e => setNovoAgendamento({...novoAgendamento, salaId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                  required
                >
                  <option value="" disabled>Selecione a sala inicial...</option>
                  {salas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Início</label>
                  <input 
                    type="date" 
                    value={novoAgendamento.dataInicio}
                    onChange={e => setNovoAgendamento({...novoAgendamento, dataInicio: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Turno</label>
                  <select 
                    value={novoAgendamento.turno}
                    onChange={e => setNovoAgendamento({...novoAgendamento, turno: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </div>
              </div>

              {/* DIAS DA SEMANA */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dias da Semana Letiva</label>
                <div className="flex flex-wrap gap-3">
                  {DIAS_SEMANA_OPCOES.map(dia => (
                    <label key={dia.value} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        value={dia.value}
                        checked={novoAgendamento.diasSemana.includes(dia.value)}
                        onChange={() => handleToggleDia(dia.value)}
                        className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="text-sm font-medium text-gray-700">{dia.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 flex items-start gap-2">
                <CalendarIcon className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                <p>
                  A data de término será projetada automaticamente pelo nosso Motor com base na carga horária (4h/dia), dias selecionados e feriados.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-semibold text-gray-500 hover:text-gray-700">
                  Cancelar
                </button>
                <button type="submit" className="bg-[var(--color-primary)] text-white font-bold py-2 px-6 rounded-lg shadow-md hover:opacity-90">
                  Alocar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
