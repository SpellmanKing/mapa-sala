// public/js/painel.js - Vanilla JS Custom Grid (RF07)

const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYearHeader = document.getElementById('current-month-year');
let allSalas = [];
let currentMonth = new Date(); 

/**
 * Função principal para inicializar o Painel Visual.
 */
const initPainelVisual = async () => {
    // 1. Carregar Dados
    await loadBaseData(); 
    
    // 2. Renderizar a grade inicial (Mês Atual)
    loadPainelVisual(new Date()); 

    // 3. Setup Listeners de Navegação (seção painel-visual)
    document.getElementById('prev-month-btn')?.addEventListener('click', () => navigateMonth(-1));
    document.getElementById('next-month-btn')?.addEventListener('click', () => navigateMonth(1));
};

/**
 * Carrega salas e tipos de sala, cacheando os dados base.
 */
const loadBaseData = async () => {
    const salasResult = await Api.getAllSalas();
    const tiposSalaResult = await Api.getTiposSala();

    if (salasResult.status === 'success') {
        allSalas = salasResult.data || [];
    } else {
        Utils.showMessage(`Erro ao carregar salas: ${salasResult.message}`, 'error');
        allSalas = [];
    }

    if (tiposSalaResult.status === 'success') {
        // Popula o filtro de Tipo de Sala (RF07)
        const data = [{ idTipo_sala: 'todos', nome_tipo: 'Todos os Tipos' }, ...tiposSalaResult.data];
        const filterSelect = document.getElementById('tipo-sala-filter');
        if (filterSelect) {
            Utils.populateSelect(filterSelect, data, 'idTipo_sala', 'nome_tipo', false);
        }
    }
};

/**
 * Navega para o mês anterior ou posterior.
 */
const navigateMonth = (direction) => {
    // Obtém o mês/ano atual do header para calcular o próximo
    const currentText = currentMonthYearHeader.getAttribute('data-current-date');
    let currentDate = currentText ? new Date(currentText) : new Date();

    currentDate.setMonth(currentDate.getMonth() + direction);
    
    loadPainelVisual(currentDate);
};


/**
 * Renderiza o Painel de Salas e Agendamentos.
 * @param {Date} dateData Mês para renderizar.
 */
const loadPainelVisual = async (dateData = currentMonth) => {
    const currentYear = dateData.getFullYear();
    const currentMonth = dateData.getMonth();
    
    // 1. Atualizar Header
    currentMonthYearHeader.textContent = dateData.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    currentMonthYearHeader.setAttribute('data-current-date', dateData.toISOString().split('T')[0]);

    // 2. Buscar Agendamentos para o período (simplificação: busca todos os agendamentos)
    const agendamentosResult = await Api.getAgendamentos();
    const agendamentos = (agendamentosResult.status === 'success' && agendamentosResult.data) ? agendamentosResult.data : [];
    
    // 3. Gerar a Grade HTML (Eixo Y: Salas, Eixo X: Datas)
    let htmlContent = `<div class="calendar-wrapper">`;
    
    // --- Cabeçalho de Datas (5 dias de aula por semana) ---
    htmlContent += `<div class="calendar-row header-row">
                        <div class="sala-col header-cell">Sala / Data</div>`;
    
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    const datesInMonth = [];

    // Popula o array de dias letivos (Segunda a Sexta)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay(); // 0=Dom, 6=Sáb
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Seg-Sex
            datesInMonth.push({
                date: d.toISOString().split('T')[0],
                dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' })
            });
        }
    }
    
    // Constrói o cabeçalho das datas
    datesInMonth.forEach(day => {
        const isToday = day.date === new Date().toISOString().split('T')[0];
        htmlContent += `<div class="date-col header-cell ${isToday ? 'today' : ''}">
                            <div class="day-name">${day.dayName}</div>
                            <div class="day-number">${day.date.split('-')[2]}</div>
                        </div>`;
    });
    htmlContent += `</div>`; // Fim da linha de cabeçalho

    // --- Linhas de Salas ---
    allSalas.forEach(sala => {
        htmlContent += `<div class="calendar-row sala-row" data-sala-id="${sala.id_salas}">
                            <div class="sala-col cell">
                                <strong>${sala.nome_sala}</strong> 
                                <span style="font-size: 0.8em; opacity: 0.7;">(Cap: ${sala.capacidade_maxima})</span>
                            </div>`;
        
        datesInMonth.forEach(day => {
            const dataAula = day.date;
            const agendamento = agendamentos.find(a => 
                a.start === dataAula && a.id_salas == sala.id_salas
            );
            
            let content = '';
            let classes = 'cell agendamento-cell';
            
            if (agendamento) {
                // Se houver agendamento
                const turmaCodigo = agendamento.codigo_turma;
                const cursoNome = agendamento.nome_curso;
                const corEvento = agendamento.color || '#1b7987'; 

                content = `<div class="event-block" 
                                style="background-color: ${corEvento};" 
                                draggable="true" 
                                data-turma-id="${agendamento.id}" 
                                data-sala-id="${sala.id_salas}"
                                data-date="${dataAula}"
                                title="${cursoNome} - ${turmaCodigo}">
                                ${turmaCodigo}
                            </div>`;
                classes += ' occupied';
            } else {
                // Célula vazia para Drag & Drop
                content = ``;
                classes += ' empty-slot';
            }

            htmlContent += `<div class="${classes}" data-date="${dataAula}" data-sala-id="${sala.id_salas}">
                                ${content}
                            </div>`;
        });
        
        htmlContent += `</div>`; // Fim da linha da sala
    });
    
    htmlContent += `</div>`; // Fim do calendar-wrapper
    calendarGrid.innerHTML = htmlContent;
    
    // 4. Inicializar Lógica de Drag & Drop (RF08)
    setupDragAndDropListeners();
};


/**
 * Configura os listeners de Drag & Drop para os eventos e slots vazios (RF08).
 */
const setupDragAndDropListeners = () => {
    const eventBlocks = calendarGrid.querySelectorAll('.event-block');
    const emptySlots = calendarGrid.querySelectorAll('.empty-slot');
    let draggedElement = null;

    // 4.1. Drag Start (no bloco do evento)
    eventBlocks.forEach(block => {
        block.addEventListener('dragstart', (e) => {
            draggedElement = block;
            e.dataTransfer.setData('text/plain', block.dataset.turmaId);
            setTimeout(() => block.classList.add('dragging'), 0); // Adiciona classe para visualização
        });

        block.addEventListener('dragend', () => {
            block.classList.remove('dragging');
            draggedElement = null;
        });
        
        // Adiciona listener para click (simulando eventClick do FullCalendar)
        block.addEventListener('click', (e) => {
            const turmaId = e.currentTarget.dataset.turmaId;
            // Abrir Modal de Detalhes da Turma (se initDetalheTurma existir)
            if (typeof openModal === 'function' && typeof loadDetalhesTurma === 'function') {
                loadDetalhesTurma(turmaId);
                openModal('detalhes-modal');
            }
        });
    });

    // 4.2. Drag Over e Drop (no slot vazio)
    emptySlots.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault(); // Permite que o elemento seja solto
            slot.classList.add('drag-over');
        });

        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            
            if (!draggedElement) return;

            const oldSlot = draggedElement.closest('.agendamento-cell');
            const newDate = slot.dataset.date;
            const newSalaId = slot.dataset.salaId;
            
            // Simulação de Validação de Conflito (T.07)
            if (newDate === '2025-11-20') { // Data de Exemplo para Conflito
                alert(`ALERTA DE CONFLITO CRÍTICO (T.07)!\nA sala já está ocupada em ${Utils.formatDate(newDate)} (simulação). O agendamento manual foi impedido.`);
                return; // Impede a ação de drop
            }
            
            // Executa o Drop
            // Futuramente: Chamar a API para persistir a mudança: Api.updateAgendamento(data)
            
            // Mover o elemento visualmente
            oldSlot.innerHTML = '';
            oldSlot.classList.remove('occupied');
            oldSlot.classList.add('empty-slot');
            
            slot.innerHTML = '';
            slot.appendChild(draggedElement);
            slot.classList.remove('empty-slot');
            slot.classList.add('occupied');
            
            // Atualiza os dados do bloco arrastado
            draggedElement.dataset.date = newDate;
            draggedElement.dataset.salaId = newSalaId;
            
            Utils.showMessage(`Agendamento da Turma ${draggedElement.dataset.turmaId} movido para ${Utils.formatDate(newDate)}. (Persistência futura)`);
        });
    });
};

// Exporta as funções para serem usadas pelo script.js e agendar_turma.js
window.initPainelVisual = initPainelVisual;
window.loadPainelVisual = loadPainelVisual;