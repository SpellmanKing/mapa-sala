/**
 * public/js/painel.js
 * Lógica para a seção 'Painel Visual (Agenda)'.
 */
(function () {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM ESPECÍFICOS DO PAINEL (Adaptados ao index.php)---
    const DOM = {
        monthYearDisplay: document.getElementById('current-month-year'),
        calendarGrid: document.getElementById('calendar-grid'), 
        prevMonthBtn: document.getElementById('prev-month-btn'), 
        nextMonthBtn: document.getElementById('next-month-btn'), 
        addTurmaBtn: document.getElementById('add-turma-btn'),
        gerenciarFeriadosBtn: document.getElementById('gerenciar-feriados')
    };

    let dataAtual = new Date(); // Mês atualmente exibido no calendário
    let agendamentosDoMes = []; // Todos os agendamentos do mês
    let feriados = []; // Lista de feriados (SGST.feriados)
    

    /**
     * Renderiza o calendário do mês atual no formato Sala x Dia.
     */
    const renderCalendar = () => {
        // Assume que SGST.dadosSalas e SGST.feriados foram carregados
        const dadosSalas = SGST.dadosSalas || [];
        feriados = SGST.feriados || [];

        DOM.calendarGrid.innerHTML = ''; // Limpa o grid

        const year = dataAtual.getFullYear();
        const month = dataAtual.getMonth();
        
        // 1. Renderiza o cabeçalho (dias da semana e números dos dias)
        const totalDias = new Date(year, month + 1, 0).getDate();
        const headerRow = document.createElement('div');
        headerRow.classList.add('calendar-row', 'header-row');
        headerRow.innerHTML = '<div class="sala-header">SALA</div>'; 
        
        for (let d = 1; d <= totalDias; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const diaDaSemana = new Date(year, month, d).getDay(); // 0=Dom, 6=Sab
            const isFeriado = feriados.includes(dateStr);
            const isFimSemana = diaDaSemana === 0 || diaDaSemana === 6;

            let diaClass = 'day-header';
            if (isFeriado) diaClass += ' feriado';
            if (isFimSemana) diaClass += ' fim-semana';

            headerRow.innerHTML += `<div class="${diaClass}">${d}</div>`;
        }
        DOM.calendarGrid.appendChild(headerRow);
        
        // 2. Renderiza as linhas de Sala x Dia
        dadosSalas.forEach(sala => {
            const row = document.createElement('div');
            row.classList.add('calendar-row');
            row.innerHTML = `<div class="sala-header" data-sala-id="${sala.id_salas}">
                                <span title="${sala.tipo_sala}">${sala.nome_sala}</span>
                             </div>`;

            for (let d = 1; d <= totalDias; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                const cell = document.createElement('div');
                cell.classList.add('calendar-cell');
                cell.setAttribute('data-sala-id', sala.id_salas);
                cell.setAttribute('data-date', dateStr);
                
                // Adiciona classes para estilo (feriado/fim de semana)
                if (feriados.includes(dateStr)) cell.classList.add('feriado');
                const diaDaSemana = new Date(year, month, d).getDay();
                if (diaDaSemana === 0 || diaDaSemana === 6) cell.classList.add('fim-semana');
                
                row.appendChild(cell);
            }
            DOM.calendarGrid.appendChild(row);
        });
        
        // 3. Atualiza o título
        const monthName = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        DOM.monthYearDisplay.textContent = monthName.toUpperCase();
    };

    /**
     * Posiciona os agendamentos nos respectivos cells do calendário.
     */
    const renderAgendamentos = () => {
        agendamentosDoMes.forEach(agendamento => {
            const cellSelector = `[data-sala-id="${agendamento.id_salas}"][data-date="${agendamento.data_aula}"]`;
            const targetCell = DOM.calendarGrid.querySelector(cellSelector);

            if (targetCell) {
                const turmaBlock = document.createElement('div');
                // Usa o status retornado (string) para aplicar CSS (ex: status-planejada)
                turmaBlock.classList.add('turma-block', `status-${agendamento.status.toLowerCase().replace(/\s/g, '-')}`);
                turmaBlock.setAttribute('data-turma-id', agendamento.id_turmas);
                
                // Armazena todos os dados para o modal de detalhes
                turmaBlock.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    // Chama a função exposta no detalhe_turma.js
                    if (SGST.Painel.loadDetalhesTurma) { 
                        SGST.Painel.loadDetalhesTurma(agendamento);
                    }
                });

                // Conteúdo do bloco:
                turmaBlock.innerHTML = `
                    <span class="curso-nome" title="${agendamento.nome_curso}">${agendamento.nome_curso.substring(0, 15)}...</span>
                    <span class="instrutor-nome" title="Instrutor: ${agendamento.instrutor}">(${agendamento.instrutor || 'S/I'})</span>
                    <span class="turno-info">${agendamento.turno.substring(0, 3)}</span>
                `;
                
                targetCell.appendChild(turmaBlock);
            }
        });
    };
    
    /**
     * Carrega todos os dados (Salas, Agendamentos, Feriados) e renderiza.
     */
    const loadAllDataAndRender = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            // Otimização: Carrega dados essenciais em paralelo
            const [agendamentos, salas, feriadosResp] = await Promise.all([
                API.getAllAgendamentos(), 
                API.getAllSalas(), 
                API.getFeriados(),
                API.getAllInstrutores() // Inclui instrutores para o modal de detalhes
            ]);

            // Armazena dados no objeto global (SGST) para uso em outros módulos
            SGST.dadosSalas = salas;
            SGST.feriados = feriadosResp.map(f => f.data_feriado);

            // Filtra agendamentos apenas para o mês atual
            const currentMonthStr = String(dataAtual.getMonth() + 1).padStart(2, '0');
            const currentYearStr = String(dataAtual.getFullYear());
            
            agendamentosDoMes = agendamentos.filter(a => {
                // Supondo que data_aula é YYYY-MM-DD
                const [year, month] = a.data_aula.split('-');
                return year === currentYearStr && month === currentMonthStr;
            });

            // 1. Renderiza a grade
            renderCalendar();
            // 2. Renderiza os agendamentos nos slots
            renderAgendamentos(); 

        } catch (error) {
            SGST.Utils.showToast('Erro ao carregar dados do Painel: ' + error.message, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };
    
    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E EXPOSIÇÃO
     * -----------------------------------------------------
     */
    SGST.Painel = {
        dataAtual: dataAtual,
        loadAllDataAndRender: loadAllDataAndRender,
        init: () => {
            // Eventos de navegação do calendário
            DOM.prevMonthBtn.addEventListener('click', () => {
                dataAtual.setMonth(dataAtual.getMonth() - 1);
                loadAllDataAndRender();
            });
            DOM.nextMonthBtn.addEventListener('click', () => {
                dataAtual.setMonth(dataAtual.getMonth() + 1);
                loadAllDataAndRender();
            });

            // Botão "Agendar Turma" (Abre o modal de agendamento)
            DOM.addTurmaBtn.addEventListener('click', () => {
                // 1. Limpa o formulário de agendamento
                SGST.Utils.clearForm(document.getElementById('agendamento-form'));
                // 2. Abre o modal
                SGST.openModal(SGST.Modals.Elements.agendamento);
                // 3. Carrega as opções (cursos/instrutores) e reseta o estado da alocação
                SGST.Agendamento.loadFormOptions(); 
                SGST.Alocacao.resetAlocacaoState(); 
            });

            // Botão "Gerenciar Feriados" (Abre o modal de feriados)
            DOM.gerenciarFeriadosBtn.addEventListener('click', () => {
                // Assumimos que o modal de feriados existe e o JS gerenciar_feriados.js está correto
                SGST.Feriados.loadFeriados(); // Carrega a lista antes de abrir
                const feriadoModal = document.getElementById('feriado-modal');
                if(feriadoModal) SGST.openModal(feriadoModal);
            });
            
            // Define o Painel Visual como a seção principal a ser carregada no início
            SGST.activeSectionHandlers['painel-visual'] = loadAllDataAndRender;

        }
    };
})();