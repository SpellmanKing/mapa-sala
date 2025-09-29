/**
 * public/js/painel.js
 * Lógica para a seção 'Painel Visual (Agenda)'.
 */
(function () {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM ESPECÍFICOS DO PAINEL ---
    const DOM = {
        monthYearDisplay: document.getElementById('current-month-year'),
        calendarGrid: document.getElementById('calendar-grid'),
        prevMonthBtn: document.getElementById('prev-month-btn'),
        nextMonthBtn: document.getElementById('next-month-btn'),
        addTurmaBtn: document.getElementById('add-turma-btn'),
        gerenciarFeriadosBtn: document.getElementById('gerenciar-feriados')
    };

    let dataAtual = new Date(); // Mês atualmente exibido no calendário
    let dadosSalas = [];
    /**
     * -----------------------------------------------------
     * FUNÇÕES DE CALENDÁRIO
     * -----------------------------------------------------
     */

    /**
     * Renderiza o calendário do mês atual no formato Sala x Dia.
     */
    const renderCalendar = () => {
        // As salas são carregadas em 'dadosSalas' no script.js e devem estar em SGST.dadosSalas
        dadosSalas = SGST.dadosSalas || [];

        DOM.calendarGrid.innerHTML = ''; // Limpa o grid

        const year = dataAtual.getFullYear();
        const month = dataAtual.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // --- 1. CONFIGURAÇÃO DA GRADE CSS ---
        // 150px para o cabeçalho 'Salas', e depois 1 coluna (1fr) para cada dia do mês
        DOM.calendarGrid.style.gridTemplateColumns = `150px repeat(${daysInMonth}, 1fr)`;

        // Atualiza o display (ex: "Setembro de 2025")
        DOM.monthYearDisplay.textContent = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        // --- 2. CABEÇALHO DA GRADE (DIAS) ---

        // Célula 'Salas'
        const salaHeaderCell = document.createElement('div');
        salaHeaderCell.className = 'grid-cell header-cell room-header';
        salaHeaderCell.textContent = 'Salas';
        DOM.calendarGrid.appendChild(salaHeaderCell);

        // Células dos dias (1, 2, 3...)
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0=Dom, 6=Sáb
            const isHoliday = SGST.feriados.includes(dateStr);

            const dateCell = document.createElement('div');
            dateCell.className = 'grid-cell header-cell';
            if (isWeekend) dateCell.classList.add('weekend');
            if (isHoliday) dateCell.classList.add('holiday');
            dateCell.innerHTML = `<span class="cell-date">${day}</span>`;
            dateCell.title = date.toLocaleDateString('pt-BR', { weekday: 'short' }); // Dica: mostra dia da semana
            DOM.calendarGrid.appendChild(dateCell);
        }

        // --- 3. LINHAS DAS SALAS E CONTEÚDO ---
        dadosSalas.forEach(sala => {
            renderRoomRow(sala, year, month, daysInMonth);
        });
    };

    /**
     * Renderiza uma linha completa da sala no calendário (Cabeçalho da sala + células dos dias).
     */
    const renderRoomRow = (sala, year, month, daysInMonth) => {
        // 1. Célula de Cabeçalho da Sala
        const roomHeaderCell = document.createElement('div');
        roomHeaderCell.className = 'grid-cell header-cell room-header';
        roomHeaderCell.textContent = sala.nome_sala;
        DOM.calendarGrid.appendChild(roomHeaderCell);

        // 2. Células dos Dias com Agendamentos
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const cell = document.createElement('div');
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = SGST.feriados.includes(dateStr);

            cell.className = 'grid-cell room-day-cell multi-turno-cell'; // Nova classe para estilização e identificação
            if (isWeekend) cell.classList.add('weekend');
            if (isHoliday) cell.classList.add('holiday');
            cell.dataset.date = dateStr;
            cell.dataset.idSala = sala.id_salas;

            // Filtra agendamentos para esta sala E este dia
            const agendamentosDoDia = SGST.agendamentos.filter(a => {
                const dataAgendamento = a.data_aula.substring(0, 10);
                return a.id_salas == sala.id_salas && dataAgendamento === dateStr;
            });

            // Adiciona blocos de agendamento (Eventos)
            if (agendamentosDoDia.length > 0) {
                agendamentosDoDia.forEach(agendamento => {
                    // Reutiliza a função de criação de evento, mas ajustando o texto para ser mais compacto
                    const block = createEventElement({
                        ...agendamento,
                        // Texto compactado para a visualização Sala x Dia
                        nome_curso: agendamento.nome_curso.split(' ')[0], // Apenas a primeira palavra
                        nome_sala: null // Não precisa da sala aqui
                    }, true); // O 'true' indica que é um bloco compacto

                    cell.appendChild(block);
                });
            } else {
                // Ação para o clique em uma célula vazia (Agendar)
                cell.addEventListener('click', () => {
                    // Pré-preenche o formulário de agendamento com a Sala e a Data
                    document.getElementById('agendamento-salas-id-input').value = sala.id_salas;
                    document.getElementById('agendamento-salas-display').value = sala.nome_sala;
                    document.getElementById('agendamento-data-inicio').value = dateStr;
                    document.getElementById('salas-alocadas-info').innerHTML = `Sala selecionada: <strong>${sala.nome_sala}</strong>.`;

                    SGST.openModal(SGST.Modals.Elements.agendamento);
                });
            }

            DOM.calendarGrid.appendChild(cell);
        }
    };

    /**
     * Cria o elemento visual de um evento (agendamento). (MANTIDA, mas ajustada para flexibilidade)
     */
    const createEventElement = (agendamento, isCompact = false) => {
        const div = document.createElement('div');
        div.className = 'appointment-block'; // Mantém o nome da classe do seu código antigo

        // Lógica de cores (MANTIDA)
        let colorClass = 'event-default';
        let backgroundColor = '#6c757d'; // Default
        switch (agendamento.turno) {
            case 'Manhã': backgroundColor = '#ffdd00'; break;
            case 'Tarde': backgroundColor = '#28a745'; break;
            case 'Noite': backgroundColor = '#6f42c2'; break;
            case 'Integral': backgroundColor = '#007bff'; break;
        }

        div.style.backgroundColor = backgroundColor;

        // Conteúdo
        if (isCompact) {
            // Visualização compacta (Sala x Dia)
            div.innerHTML = `<strong>${agendamento.nome_curso}</strong><span>${agendamento.turno}</span>`;
        } else {
            // Visualização de lista (Se for usada)
            div.textContent = `${agendamento.nome_curso} (${agendamento.nome_sala}) - ${agendamento.turno}`;
        }

        div.dataset.idTurma = agendamento.id_turmas;

        div.addEventListener('click', (e) => {
            e.stopPropagation();
            // Assume que a função de abrir detalhes agora está no SGST.Painel
            SGST.Painel.loadDetalhesTurma(agendamento.id_turmas);
        });

        return div;
    };


    /**
     * -----------------------------------------------------
     * FUNÇÕES DE DADOS (API)
     * -----------------------------------------------------
     */

    /**
     * Carrega todos os agendamentos e feriados do backend.
     */
    const loadAllDataAndRender = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            // A função API.getAgendamentos foi inferida do controllers/agendar_turma.php GET
            // A função API.getFeriados foi inferida do controllers/gerenciar_feriado.php GET
            const [agendamentosData, feriadosData] = await Promise.all([
                API.getAgendamentos(),
                API.getFeriados()
            ]);

            // Armazena dados no estado global
            SGST.agendamentos = agendamentosData;
            SGST.feriados = feriadosData.map(f => f.data_feriado); // Apenas as datas

            renderCalendar();

        } catch (error) {
            SGST.Utils.showToast(`Erro ao carregar dados da agenda: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * Carrega os detalhes de uma turma (SUPOSIÇÃO DE ENDPOINT)
     * @param {number} turmaId - O ID da turma para carregar.
     */
    const loadDetalhesTurma = async (turmaId) => {
        // O backend não tem um 'controller' específico para buscar *detalhes* da turma
        // Faremos uma SUPOSIÇÃO de que existe um endpoint: /controllers/turma_detalhes.php?id={turmaId}
        // OU que a informação virá do próprio agendamento (API.getAgendamentos).

        // Pelo seu código, faremos a SUPOSIÇÃO que você criará um endpoint:
        // /controllers/buscar_detalhes_turma.php?id=...
        const FAKE_ENDPOINT_URL = `./controllers/buscar_detalhes_turma.php?id=${turmaId}`;

        SGST.Utils.toggleLoading(true);
        try {
            // Simulação de requisição para buscar detalhes da turma
            const response = await apiFetch(FAKE_ENDPOINT_URL, { method: 'GET' });

            // Resposta Esperada (SUPOSTA): 
            /*
             { 
                 id: 1, 
                 nome_curso: 'Web Dev', 
                 instrutor_nome: 'João Silva', 
                 status: 'Confirmada', 
                 dias_aula: [{ data_aula: '...', turno: '...' }] 
             }
            */

            // Populamos o modal de Detalhes
            SGST.Painel.populateDetalhesModal(response);
            SGST.openModal(SGST.Modals.Elements.detalhes);

        } catch (error) {
            SGST.Utils.showToast(`Erro ao carregar detalhes da turma: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * Preenche o modal de detalhes da turma com os dados recebidos.
     * (Assume IDs no index.php: 'detalhes-turma-nome', 'detalhes-instrutor', 'detalhes-status', 'detalhes-aulas')
     */
    const populateDetalhesModal = (turmaData) => {
        document.getElementById('detalhes-alunos').textContent = turmaData.nome_curso || 'N/A';
        document.getElementById('detalhes-instrutor').textContent = turmaData.instrutor_nome || 'N/A';
        document.getElementById('detalhes-status').textContent = turmaData.status || 'N/A';
        document.getElementById('detalhes-turma').value = turmaData.id;

        const aulasList = document.getElementById('detalhes-aulas');
        aulasList.innerHTML = '';

        if (turmaData.dias_aula && turmaData.dias_aula.length) {
            turmaData.dias_aula.forEach(aula => {
                const li = document.createElement('li');
                li.textContent = `${SGST.Utils.formatDate(aula.data_aula)} - ${aula.turno}`;
                aulasList.appendChild(li);
            });
        } else {
            aulasList.textContent = 'Nenhum dia de aula agendado.';
        }
    };

    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */

    SGST.Painel = {
        dataAtual: dataAtual,
        loadAllDataAndRender: loadAllDataAndRender,
        loadDetalhesTurma: loadDetalhesTurma,
        populateDetalhesModal: populateDetalhesModal, // Exposto para ser chamado por outros módulos

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

            // Botão "Agendar Turma"
            DOM.addTurmaBtn.addEventListener('click', () => {
                SGST.Utils.clearForm(document.getElementById('agendamento-form'));
                SGST.openModal(SGST.Modals.Elements.agendamento);
            });

            // Botão "Gerenciar Feriados"
            DOM.gerenciarFeriadosBtn.addEventListener('click', () => {
                SGST.Feriados.loadFeriados();
                SGST.openModal(SGST.Modals.Elements.feriados);
            });

            // Inicializa a carga de dados
            // loadAllDataAndRender(); // Será chamado pelo script.js

            SGST.Utils.log('PAINEL_INIT', 'Painel (Agenda) listeners inicializados.');
        }
    };

})();