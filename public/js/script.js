document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ESTADO DA APLICAÇÃO ---
    // Variáveis globais para armazenar o estado da aplicação
    let dataAtual = new Date();
    let agendamentos = [];
    let dadosSalas = [];
    let dadosCursos = [];
    let dadosInstrutores = [];
    let feriados = [];
    let sugestaoAlocacaoData = null;

    // --- 2. SELETORES DE ELEMENTOS DO DOM ---
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const closeBtns = document.querySelectorAll('.close-btn');

    const agendamentoModal = document.getElementById('agendamento-modal');
    const alocacaoModal = document.getElementById('alocacao-modal');
    const detalhesModal = document.getElementById('detalhes-modal');

    const agendamentoForm = document.getElementById('agendamento-form');
    const scheduleForm = document.getElementById('schedule-form');
    const detalhesForm = document.getElementById('detalhes-form');
    
    // Elementos da calculadora de planejamento
    const agendamentoSalasDisplay = document.getElementById('agendamento-salas-display');
    const agendamentoSalasIdInput = document.getElementById('agendamento-salas-id-input');
    const alocacaoAutomaticaBtn = document.getElementById('alocacao-automatica-btn');
    const confirmarAlocacaoBtn = document.getElementById('confirmar-alocacao-btn');
    const sugestaoAlocacaoDiv = document.getElementById('sugestao-alocacao');

    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const addTurmaBtn = document.getElementById('add-turma-btn');
    const cancelarTurmaBtn = document.getElementById('cancelar-turma-btn');

    // Elementos do modal de detalhes da turma
    const detalhesTurmaId = document.getElementById('detalhes-turmaId');
    const detalhesStatusSelect = document.getElementById('detalhes-status-select');
    const detalhesInstrutorInput = document.getElementById('detalhes-instrutor-input');

    // --- 3. FUNÇÕES DE UTILIDADE GERAL ---
    
    /**
     * Faz requisições ao back-end e retorna os dados.
     * @param {string} url O endpoint da API.
     * @returns {Promise<any>} Dados da resposta.
     */
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro ao buscar dados de ${url}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro:', error);
            alert(`Erro ao carregar dados: ${error.message}`);
            return [];
        }
    }

    /**
     * Alterna a exibição das seções de conteúdo.
     * @param {string} targetId O ID da seção a ser exibida.
     */
    function navigateTo(targetId) {
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            }
        });
        if (targetId === 'painel-visual') {
            carregarDadosIniciais();
        }
    }

    /** Abre um modal específico. */
    function abrirModal(modal) {
        modal.style.display = 'block';
    }

    /** Fecha todos os modais. */
    function fecharModais() {
        agendamentoModal.style.display = 'none';
        alocacaoModal.style.display = 'none';
        detalhesModal.style.display = 'none';
    }

    /** Preenche um select (dropdown) com dados. */
    function preencherDropdowns() {
        const cursoAgendamentoSelect = document.getElementById('curso-agendamento');
        if (cursoAgendamentoSelect) {
            popularSelect(cursoAgendamentoSelect, dadosCursos, 'id_cursos', 'nome_curso');
        }

        const courseSelect = document.getElementById('course-select'); // Correção do seletor
        if (courseSelect) {
            popularSelect(courseSelect, dadosCursos, 'id_cursos', 'nome_curso');
        }

        const instrutorAgendamentoSelect = document.getElementById('instrutor-agendamento');
        if (instrutorAgendamentoSelect) {
            popularSelect(instrutorAgendamentoSelect, dadosInstrutores, 'id_instrutores', 'nome_instrutor');
        }
    }

    /**
     * Preenche um select (dropdown) com dados.
     * @param {HTMLElement} selectElement O elemento select.
     * @param {Array} data Array de objetos com 'id' e 'nome'.
     * @param {string} idKey Nome da chave do ID no objeto.
     * @param {string} nameKey Nome da chave do nome no objeto.
     */
    function popularSelect(selectElement, data, idKey, nameKey) {
        selectElement.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[idKey];
            option.textContent = item[nameKey];
            selectElement.appendChild(option);
        });
    }

    /**
     * Busca os dados da turma pelo ID e abre o modal de detalhes.
     * @param {number} turmaId O ID da turma.
     */
    function abrirModalDetalhes(turmaId) {
        const turma = agendamentos.find(a => a.id_turmas == turmaId);
        if (!turma) return;
        
        // Preenche os campos de exibição
        document.getElementById('detalhes-titulo').textContent = `Detalhes da Turma ${turma.nome_curso}`;
        document.getElementById('detalhes-curso').textContent = turma.nome_curso;
        document.getElementById('detalhes-sala').textContent = turma.nome_sala;
        document.getElementById('detalhes-datas').textContent = `${turma.data_inicio} até ${turma.data_termino}`;
        document.getElementById('detalhes-turno').textContent = turma.turno;
        document.getElementById('detalhes-alunos').textContent = turma.total_alunos;
        document.getElementById('detalhes-instrutor').textContent = turma.instrutor || 'Não Atribuído';
        document.getElementById('detalhes-status').textContent = turma.status;

        // Preenche os campos do formulário de edição
        detalhesTurmaId.value = turma.id_turmas;
        detalhesStatusSelect.value = turma.status;

        // Popula o select de instrutores e pré-seleciona o atual
        popularSelect(detalhesInstrutorInput, dadosInstrutores, 'id_instrutores', 'nome_instrutor');
        if (turma.instrutor) {
            const instrutorAtual = dadosInstrutores.find(i => i.nome_instrutor === turma.instrutor);
            if (instrutorAtual) {
                detalhesInstrutorInput.value = instrutorAtual.id_instrutores;
            }
        }
        abrirModal(detalhesModal);
    }

    // --- 4. FUNÇÕES DE RENDERIZAÇÃO ---
    function renderizarCalendario() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        const numDays = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate();

        // Cabeçalhos (Salas e Datas)
        grid.style.gridTemplateColumns = `150px repeat(${numDays}, 1fr)`;
        const salaHeaderCell = document.createElement('div');
        salaHeaderCell.className = 'grid-cell header-cell room-header';
        salaHeaderCell.textContent = 'Salas';
        grid.appendChild(salaHeaderCell);

        for (let i = 1; i <= numDays; i++) {
            const dateCell = document.createElement('div');
            const date = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = feriados.includes(date.toISOString().split('T')[0]);
            dateCell.className = 'grid-cell header-cell';
            if (isWeekend) dateCell.classList.add('weekend');
            if (isHoliday) dateCell.classList.add('holiday');
            dateCell.innerHTML = `<span class="cell-date">${i}</span>`;
            grid.appendChild(dateCell);
        }

        // Células de agendamento por sala e dia
        dadosSalas.forEach(sala => {
            const roomHeaderCell = document.createElement('div');
            roomHeaderCell.className = 'grid-cell header-cell room-header';
            roomHeaderCell.textContent = sala.nome_sala;
            grid.appendChild(roomHeaderCell);

            for (let i = 1; i <= numDays; i++) {
                const date = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), i);
                const dayString = date.toISOString().split('T')[0];
                const cell = document.createElement('div');
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isHoliday = feriados.includes(dayString);
                
                cell.className = 'grid-cell';
                if (isWeekend) cell.classList.add('weekend');
                if (isHoliday) cell.classList.add('holiday');
                
                cell.classList.add('multi-turno-cell');

                // Filtra os agendamentos para esta sala e este dia
                const agendamentosDoDia = agendamentos.filter(a => {
                    const dataAgendamento = a.data_aula.substring(0, 10);
                    return a.id_salas == sala.id_salas && dataAgendamento === dayString;
                });
                
                agendamentosDoDia.forEach(agendamento => {
                    const block = document.createElement('div');
                    block.className = 'appointment-block';
                    block.dataset.turmaId = agendamento.id_turmas;
                    
                    let color;
                    switch(agendamento.turno) {
                        case 'Manhã':
                            color = '#007bff';
                            break;
                        case 'Tarde':
                            color = '#28a745';
                            break;
                        case 'Noite':
                            color = '#6f42c2';
                            break;
                        case 'Integral':
                            color = '#dc3545';
                            break;
                        default:
                            color = '#6c757d';
                    }
                    block.style.backgroundColor = color;
                    block.innerHTML = `
                        <h4>${agendamento.nome_curso}</h4>
                        <span>${agendamento.turno}</span>
                        <span>${agendamento.instrutor || 'Não Atribuído'}</span>
                    `;
                    
                    block.addEventListener('click', (event) => {
                        event.stopPropagation();
                        abrirModalDetalhes(agendamento.id_turmas);
                    });
                    
                    cell.appendChild(block);
                });

                // Adiciona o evento de clique na célula vazia para agendar manualmente
                if (agendamentosDoDia.length === 0) {
                    cell.addEventListener('click', () => {
                        abrirModal(agendamentoModal);
                        // Pré-seleciona a sala no formulário
                        document.getElementById('agendamento-salas-id-input').value = sala.id_salas;
                    });
                }
                grid.appendChild(cell);
            }
        });
        document.getElementById('current-month-year').textContent = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    // --- 5. FUNÇÕES DE CARGA DE DADOS E EVENTOS ---

    /** Carrega todos os dados iniciais do back-end. */
    async function carregarDadosIniciais() {
        try {
            // Carregar feriados
            const feriadosData = await fetchData('./controllers/get_feriados.php');
            feriados = feriadosData.feriados;
            
            // Carregar agendamentos
            agendamentos = await fetchData('./controllers/get_agendamentos.php');

            // Carregar salas
            dadosSalas = await fetchData('./controllers/get_sala.php');

            // Carregar cursos
            dadosCursos = await fetchData('./controllers/get_cursos.php');

            // Carregar instrutores
            dadosInstrutores = await fetchData('./controllers/get_instrutores.php');

            // Renderiza o calendário e preenche os dropdowns depois que todos os dados forem carregados
            renderizarCalendario();
            preencherDropdowns();
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    /** Envia o formulário de agendamento manual. */
    async function agendarTurma(formData) {
        try {
            const response = await fetch('./controllers/agendar_turma.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                fecharModais();
                carregarDadosIniciais();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao agendar turma. Por favor, tente novamente.');
        }
    }

    /** Envia o formulário de alocação automática. */
    async function alocarTurma(formData) {
        try {
            const response = await fetch('./controllers/alocar_turma.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok) {
                sugestaoAlocacaoData = {
                    ...formData,
                    salas: result.salas,
                    dataTermino: result.dataTermino
                };
                // Exibe os resultados
                const cursoNome = dadosCursos.find(c => c.id_cursos == formData.cursoId)?.nome_curso;
                const salasNomes = result.salas.map(s => s.nome_sala).join(', ');
                document.getElementById('alocacao-curso-nome').textContent = cursoNome;
                document.getElementById('alocacao-data-inicio').textContent = formData.dataInicio;
                document.getElementById('alocacao-data-termino').textContent = result.dataTermino;
                document.getElementById('alocacao-salas-sugeridas').textContent = salasNomes;
                abrirModal(alocacaoModal);
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao tentar alocação automática.');
        }
    }

    /** Envia as alterações da turma para o back-end. */
    async function gerenciarTurma(turmaId, formData) {
        try {
            const response = await fetch('./controllers/gerenciar_turma.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                fecharModais();
                carregarDadosIniciais();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao gerenciar turma. Por favor, tente novamente.');
        }
    }

    /** Configura todos os event listeners da aplicação. */
    function setupEventListeners() {
        // Navegação da barra lateral
        navItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                navigateTo(item.dataset.target);
            });
        });

        // Botões de navegação do calendário
        prevMonthBtn.addEventListener('click', () => {
            dataAtual.setMonth(dataAtual.getMonth() - 1);
            renderizarCalendario();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            dataAtual.setMonth(dataAtual.getMonth() + 1);
            renderizarCalendario();
        });

        // Botão de agendar turma
        addTurmaBtn.addEventListener('click', () => {
            document.getElementById('agendamento-form').reset();
            abrirModal(agendamentoModal);
        });

        // Envio do formulário de agendamento manual
        agendamentoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = {
                cursoId: document.getElementById('curso-agendamento').value,
                instrutorId: document.getElementById('instrutor-agendamento').value,
                dataInicio: document.getElementById('data-inicio-agendamento').value,
                totalAlunos: document.getElementById('total-alunos-agendamento').value,
                turno: document.getElementById('turno-agendamento').value,
                // Corrigido: garante que salaId seja sempre um array, mesmo com um único item.
                salaId: [document.getElementById('agendamento-salas-id-input').value], 
                diasSemana: Array.from(document.querySelectorAll('#dias-semana-agendamento input:checked')).map(cb => cb.value)
            };
            agendarTurma(formData);
        });

        // Envio do formulário de calculadora de planejamento (Alocação Automática)
        scheduleForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = {
                cursoId: document.getElementById('course-select').value,
                dataInicio: document.getElementById('start-date-input').value,
                turno: document.getElementById('turno-select').value,
                diasSemana: Array.from(document.querySelectorAll('#dias-semana-container input:checked')).map(cb => cb.value)
            };
            alocarTurma(formData);
        });

        // Confirmação do modal de alocação automática
        confirmarAlocacaoBtn.addEventListener('click', () => {
            if (sugestaoAlocacaoData) {
                const salasIds = sugestaoAlocacaoData.salas.map(s => s.id_salas);
                const formData = {
                    cursoId: sugestaoAlocacaoData.cursoId,
                    totalAlunos: sugestaoAlocacaoData.totalAlunos,
                    dataInicio: sugestaoAlocacaoData.dataInicio,
                    salaId: salasIds,
                    turno: sugestaoAlocacaoData.turno,
                    diasSemana: sugestaoAlocacaoData.diasSemana
                };
                agendarTurma(formData);
            }
        });
        
        // Envio do formulário de detalhes da turma
        detalhesForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const dadosDetalhes = {
                turmaId: detalhesTurmaId.value,
                instrutorId: detalhesInstrutorInput.value,
                status: detalhesStatusSelect.value
            };
            gerenciarTurma(dadosDetalhes.turmaId, dadosDetalhes);
        });

        // Botão para cancelar turma
        if (cancelarTurmaBtn) {
            cancelarTurmaBtn.addEventListener('click', () => {
                const confirmacao = confirm("Tem certeza que deseja CANCELAR esta turma? Esta ação não pode ser desfeita.");
                if (confirmacao) {
                    const dadosCancelamento = {
                        turmaId: detalhesTurmaId.value,
                        status: 'Cancelada'
                    };
                    gerenciarTurma(dadosCancelamento.turmaId, dadosCancelamento);
                }
            });
        }

        // Eventos para fechar modais
        closeBtns.forEach(btn => btn.addEventListener('click', fecharModais));
        window.addEventListener('click', (event) => {
            if (event.target === agendamentoModal || event.target === detalhesModal || event.target === alocacaoModal) {
                fecharModais();
            }
        });
    }

    // --- 6. INICIA A APLICAÇÃO ---
    setupEventListeners();
    carregarDadosIniciais();
    navigateTo('painel-visual');
});