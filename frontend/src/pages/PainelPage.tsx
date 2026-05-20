import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Search, Plus, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function PainelPage() {
  const { salas, agendamentos, cursos, setAgendamentos } = useAppContext();

  const [currentDate, setCurrentDate] = useState(() => new Date());


  const [filtroTurno, setFiltroTurno] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

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

  const [draggedAgendamento, setDraggedAgendamento] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAgendamento(id);
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.classList.add('opacity-50', 'scale-95');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-95');
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, salaId: string, dateObj: Date) => {
    e.preventDefault();
    if (!draggedAgendamento) return;
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const novaData = `${yyyy}-${mm}-${dd}`;

    setAgendamentos(prev => prev.map(ag => {
      if (ag.id === draggedAgendamento) {
        return { ...ag, salaId, date: novaData };
      }
      return ag;
    }));
    
    setDraggedAgendamento(null);
  };

  const getCursoNome = (cursoId: string) => cursos.find(c => c.id === cursoId)?.nome || 'Desconhecido';

  // --- LÓGICA DO MODAL DE AGENDAMENTO ---
  const [modalOpen, setModalOpen] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({ cursoId: '', salaId: '', dataInicio: '', turno: 'Manhã' });

  const handleCriarAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    const cursoSelecionado = cursos.find(c => c.id === novoAgendamento.cursoId);
    if (!cursoSelecionado || !novoAgendamento.dataInicio || !novoAgendamento.salaId) return;

    // Lógica da Calculadora invocada nos bastidores
    const hours = cursoSelecionado.cargaHoraria;
    const classesNeeded = Math.ceil(hours / 4); 
    
    const [yyyyS, mmS, ddS] = novoAgendamento.dataInicio.split('-').map(Number);
    let currentDateObj = new Date(yyyyS, mmS - 1, ddS);

    let classesScheduled = 0;
    const novosBlocos: typeof agendamentos[number][] = [];


    while (classesScheduled < classesNeeded) {
      const dayOfWeek = currentDateObj.getDay().toString();

      if (cursoSelecionado.diasSemana.includes(dayOfWeek)) {
        classesScheduled++;
        const yyyy = currentDateObj.getFullYear();
        const mm = String(currentDateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDateObj.getDate()).padStart(2, '0');
        
        novosBlocos.push({
          id: `ag-${Date.now()}-${classesScheduled}`,
          salaId: novoAgendamento.salaId,
          date: `${yyyy}-${mm}-${dd}`,
          cursoId: cursoSelecionado.id,
          turno: novoAgendamento.turno,
          cor: cursoSelecionado.modalidade === 'Remoto' ? 'var(--color-accent)' : 'var(--color-primary)',
          modalidade: cursoSelecionado.modalidade
        });
      }
      if (classesScheduled < classesNeeded) {
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }
    }

    setAgendamentos(prev => [...prev, ...novosBlocos]);
    setModalOpen(false);
    setNovoAgendamento({ cursoId: '', salaId: '', dataInicio: '', turno: 'Manhã' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      
      {/* HEADER */}
      <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between bg-white gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-secondary)] flex items-center gap-2 tracking-tight">
              <CalendarIcon className="text-[var(--color-primary)] w-6 h-6" /> 
              Painel Visual de Alocação
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Gestão inteligente de turmas e ocupação de salas</p>
          </div>
          <button 
            onClick={() => setModalOpen(true)}
            className="ml-4 bg-[var(--color-primary)] text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:opacity-90 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
        
        {/* FILTROS E CONTROLES */}
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 px-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select 
              value={filtroTurno} 
              onChange={e => setFiltroTurno(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer shadow-sm"
            >
              <option value="Todos">Turno: Todos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>

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

          <div className="h-8 w-px bg-gray-300 mx-1"></div>

          <div className="flex items-center gap-2 pr-2">
            <button onClick={prevWeek} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:scale-105 text-[var(--color-secondary)] transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-sm min-w-[140px] text-center text-[var(--color-secondary)] capitalize tracking-wide">
              {days[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={nextWeek} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:scale-105 text-[var(--color-secondary)] transition-all shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* GRADE */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6 custom-scrollbar">
        <div className="min-w-max border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* HEADER DA GRADE */}
          <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
            <div className="w-64 shrink-0 border-r border-gray-200 p-4 flex items-center justify-center font-bold text-[var(--color-secondary)] opacity-70 uppercase tracking-wider text-xs">
              <Search className="w-4 h-4 mr-2 opacity-50" />
              Salas e Ambientes
            </div>
            {days.map((day, i) => {
              const isToday = new Date().toDateString() === day.toDateString();
              return (
                <div key={i} className="flex-1 shrink-0 border-r border-gray-200 p-3 text-center flex flex-col items-center justify-center gap-1">
                  <div className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                  </div>
                  <div className={`text-xl font-black rounded-full w-8 h-8 flex items-center justify-center ${isToday ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-secondary)]'}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LINHAS DAS SALAS */}
          <div className="flex-1 overflow-y-auto">
            {salas.filter(s => filtroTipo === 'Todos' || s.tipo === filtroTipo).map((sala) => (
              <div key={sala.id} className="flex border-b border-gray-100 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
                
                <div className="w-64 shrink-0 border-r border-gray-200 p-4 flex flex-col justify-center bg-white group-hover:bg-blue-50/50 transition-colors relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-[var(--color-primary)] transition-colors"></div>
                  <div className="font-extrabold text-[var(--color-secondary)] text-sm tracking-tight">{sala.nome}</div>
                  <div className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">Cap: {sala.capacidade}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">{sala.tipo}</span>
                  </div>
                </div>

                {days.map((day, i) => {
                  const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const agendamentosSala = agendamentos.filter(
                    a => a.salaId === sala.id && a.date === dateStr && (filtroTurno === 'Todos' || a.turno === filtroTurno)
                  );


                  return (
                    <div 
                      key={i} 
                      className="flex-1 shrink-0 border-r border-gray-100 p-2 min-h-[90px] relative transition-all duration-300 hover:bg-gray-50/50 flex flex-col gap-1.5"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, sala.id, day)}
                    >
                      {agendamentosSala.map((ag) => (
                        <div 
                          key={ag.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ag.id)}
                          onDragEnd={handleDragEnd}
                          className={`w-full min-h-[60px] rounded-lg shadow-sm text-white p-2.5 flex flex-col gap-1 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-l-2 border-white/30 backdrop-blur-sm ${ag.modalidade === 'Remoto' ? 'bg-[var(--color-accent)] border-dashed border-2 border-white' : 'bg-[var(--color-primary)]'}`}
                          title={`Agendamento ${getCursoNome(ag.cursoId)}`}
                        >
                          <div className="font-bold text-xs leading-tight drop-shadow-sm">{getCursoNome(ag.cursoId)}</div>
                          <div className="text-[10px] font-bold opacity-90 flex items-center gap-1.5 mt-auto">
                            <span className="bg-black/20 px-1.5 py-0.5 rounded">{ag.turno}</span>
                            {ag.modalidade === 'Remoto' && <span className="bg-white/20 px-1.5 py-0.5 rounded">REMOTO</span>}
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

      {/* MODAL DE AGENDAMENTO (CALCULADORA INVISÍVEL) */}
      {modalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-[var(--color-secondary)]">Formulário de Agendamento</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCriarAgendamento} className="p-6 flex flex-col gap-5">
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

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Início</label>
                  <input 
                    type="date" 
                    value={novoAgendamento.dataInicio}
                    onChange={e => setNovoAgendamento({...novoAgendamento, dataInicio: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                    required
                  />
                </div>
                <div className="flex-1">
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

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                A data de término e os dias letivos serão calculados automaticamente com base na carga horária e dias da semana configurados no catálogo do curso.
              </div>

              <div className="flex justify-end gap-3 mt-2">
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
