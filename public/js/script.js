document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ESTADO DA APLICAÇÃO --
    let dataAtual = new Date();
    let agendamentos = [];
    let dadosSalas = [];
    let dadosCursos = [];
    let dadosInstrutores = [];
    let feriados = [];
    let sugestaoAlocacaoData = null; // Armazena os dados da última sugestão de alocação

    // --- 2. SELETORES DE ELEMENTOS DO DOM --
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const closeBtns = document.querySelectorAll('.close-btn');

    // Modais
    const agendamentoModal = document.getElementById('agendamento-modal');
    const detalhesModal = document.getElementById('detalhes-modal');
    const alocacaoModal = document.getElementById('alocacao-modal');

    // Formulários
    const agendamentoForm = document.getElementById('agendamento-form');
    const detalhesForm = document.getElementById('detalhes-form');

    // Botões
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const addTurmaBtn = document.getElementById('add-turma-btn');
    const cancelarTurmaBtn = document.getElementById('cancelar-turma-btn');

    // Elementos do Modal de Agendamento
    const agendamentoSalasDisplay = document.getElementById('agendamento-salas-display');
    const agendamentoSalasIdInput = document.getElementById('agendamento-salas-id-input');
    const buscarSalasAutomaticamenteBtn = document.getElementById('alocacao-manual-btn');
    const salasAlocadasInfo = document.getElementById('salasAlocadasInfo');

    // Elemento Modal de Alocação
    const alocacaoCursoSelect = document.getElementById('alocacao-curso');
    const sugestaoContainer = document.getElementById('sugestao-alocacao');
    const sugestaoMensagem = document.getElementById('sugestao-mensagem');
    const salasSugeridasLista = document.getElementById('salas-sugeridas-lista');
    const confirmarAlocacaoBtn = document.getElementById('confirmar-alocacao-btn');
    const cancelarAlocacaoBtn = document.getElementById('cancelar-alocacao-btn');

    // Elementos do Modal de Detalhes
    const detalhesTurmaId = document.getElementById('detalhes-turmaId');
    const detalhesStatusSelect = document.getElementById('detalhes-status-select');
    const detalhesInstrutorInput = document.getElementById('detalhes-instrutor-input');

    // Elementos da Calculadora Inteligente
    const DOM = {
        filterSegmento: document.getElementById('filter-segmento'),
        filterModalidade: document.getElementById('filter-modalidade'),
        filterNomeCurso: document.getElementById('filter-nome-curso'),
        filterChMin: document.getElementById('filter-ch-min'),
        filterChMax: document.getElementById('filter-ch-max'),
        filterTem: document.getElementById('filter-tem'),
        filterBolsa: document.getElementById('filter-bolsa'),
        applyFiltersButton: document.getElementById('apply-filters'),
        clearFiltersButton: document.getElementById('clear-filters'),
        courseSelect: document.getElementById('course-select'),
        courseForm: document.getElementById('course-form'),
        startDateInput: document.getElementById('start-date'),
        shiftSelect: document.getElementById('shift-select'),
        courseDetails: document.getElementById('course-details'),
        displayCh: document.getElementById('display-ch'),
        displayValor: document.getElementById('display-valor'),
        regularCourseOptions: document.getElementById('regular-course-options'),
        temOptions: document.getElementById('tem-options'),
        tem800hOptions: document.getElementById('tem-800h-options'),
        tem1200hOptions: document.getElementById('tem-1200h-options'),
        aprendizagemOptions: document.getElementById('aprendizagem-options'),
        aprendizagemTradicionalOptions: document.getElementById('aprendizagem-tradicional-options'),
        remoteOptionsPanel: document.getElementById('remote-options-panel'),
        remotePercentageSelect: document.getElementById('remote-percentage-select'),
        remoteDetailsOptions: document.getElementById('remote-details-options'),
        remoteDaysSelector: document.getElementById('remote-days-selector'),
        resultsSection: document.getElementById('results-section'),
        resultsContent: document.getElementById('results-content'),
        metricsPanel: document.getElementById('metrics-panel'),
        totalHoursValue: document.getElementById('total-hours-value'),
        durationValue: document.getElementById('duration-value'),
        progressPresencial: document.getElementById('progress-presencial'),
        progressRemoto: document.getElementById('progress-remoto'),
        progressEmpresa: document.getElementById('progress-empresa'),
        calendarVisual: document.getElementById('calendar-visual'),
        exportPdfButton: document.getElementById('export-pdf-button')
    };

    // --- 3. FUNÇÕES GERAIS E DE UTILIDADE --

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

    function abrirModal(modal) {
        modal.style.display = 'block';
    }

    function fecharModais() {
        agendamentoModal.style.display = 'none';
        detalhesModal.style.display = 'none';
        alocacaoModal.style.display = 'none'; 
    }

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
     * Popula os seletores de filtros com os dados de cursos e instrutores.
     * @param {Array<Object>} cursos - Lista de cursos.
     * @param {Array<Object>} instrutores - Lista de instrutores.
     */
    function popularFiltros(cursos, instrutores) {
        // 1. Popula os filtros de cursos na calculadora inteligente
        const cursoSelectFiltro = DOM.courseSelectFiltro;
        if (cursoSelectFiltro) {
            cursoSelectFiltro.innerHTML = '<option value="">Todos</option>';
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id_cursos;
                option.textContent = curso.nome_curso;
                cursoSelectFiltro.appendChild(option);
            });
        }

        // 2. Popula os filtros de instrutores
        const instrutorSelectFiltro = DOM.filterInstrutor;
        if (instrutorSelectFiltro) {
            instrutorSelectFiltro.innerHTML = '<option value="">Todos</option>';
            instrutores.forEach(instrutor => {
                const option = document.createElement('option');
                option.value = instrutor.id_instrutores;
                option.textContent = instrutor.nome_instrutor;
                instrutorSelectFiltro.appendChild(option);
            });
        }
    }

    function preencherDropdowns() {
        const cursoAgendamentoSelect = document.getElementById('curso-agendamento');
        if (cursoAgendamentoSelect) {
            popularSelect(cursoAgendamentoSelect, dadosCursos, 'id_cursos', 'nome_curso');
        }
        const instrutorAgendamentoSelect = document.getElementById('instrutor-agendamento');
        if (instrutorAgendamentoSelect) {
            popularSelect(instrutorAgendamentoSelect, dadosInstrutores, 'id_instrutores', 'nome_instrutor');
        }
        const alocacaoCursoSelect = document.getElementById('alocacao-curso');
        if (alocacaoCursoSelect) {
            popularSelect(alocacaoCursoSelect, dadosCursos, 'id_cursos', 'nome_curso');
        }
    }

    function abrirModalDetalhes(turmaId) {
        const turma = agendamentos.find(a => a.id_turmas == turmaId);
        if (!turma) return;

        document.getElementById('detalhes-titulo').textContent = `Detalhes da Turma ${turma.nome_curso}`;
        document.getElementById('detalhes-curso').textContent = turma.nome_curso;
        document.getElementById('detalhes-sala').textContent = turma.nome_sala;
        document.getElementById('detalhes-datas').textContent = `${turma.data_inicio} até ${turma.data_termino}`;
        document.getElementById('detalhes-turno').textContent = turma.turno;
        document.getElementById('detalhes-alunos').textContent = turma.total_alunos;
        document.getElementById('detalhes-instrutor').textContent = turma.instrutor || 'Não Atribuído';
        document.getElementById('detalhes-status').textContent = turma.status;

        detalhesTurmaId.value = turma.id_turmas;
        detalhesStatusSelect.value = turma.status;

        popularSelect(detalhesInstrutorInput, dadosInstrutores, 'id_instrutores', 'nome_instrutor');
        if (turma.instrutor) {
            const instrutorAtual = dadosInstrutores.find(i => i.nome_instrutor === turma.instrutor);
            if (instrutorAtual) {
                detalhesInstrutorInput.value = instrutorAtual.id_instrutores;
            }
        }
        abrirModal(detalhesModal);
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO --
    function renderizarCalendario() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        const numDays = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate();
        grid.style.gridTemplateColumns = `150px repeat(${numDays},1fr)`;

        // Cria a célula de cabeçalho das salas
        const salaHeaderCell = document.createElement('div');
        salaHeaderCell.className = 'grid-cell header-cell room-header';
        salaHeaderCell.textContent = 'Salas';
        grid.appendChild(salaHeaderCell);

        // Cria as células de cabeçalho dos dias do mês
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

        // Preenche o grid com os agendamentos
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
                cell.className = 'grid-cell multi-turno-cell'; // Adiciona a classe para suportar múltiplos agendamentos
                if (isWeekend) cell.classList.add('weekend');
                if (isHoliday) cell.classList.add('holiday');

                const agendamentosDoDia = agendamentos.filter(a => {
                    const dataAgendamento = a.data_aula.substring(0, 10);
                    return a.id_salas == sala.id_salas && dataAgendamento === dayString;
                });

                agendamentosDoDia.forEach(agendamento => {
                    const block = document.createElement('div');
                    block.className = 'appointment-block';
                    block.dataset.turmaId = agendamento.id_turmas;

                    let color;
                    switch (agendamento.turno) {
                        case 'Manhã':
                            color = '#ffdd00';
                            break;
                        case 'Tarde':
                            color = '#28a745';
                            break;
                        case 'Noite':
                            color = '#6f42c2';
                            break;
                        case 'Integral':
                            color = '#007bff';
                            break;
                        default:
                            color = '#6c757d';
                    }
                    block.style.backgroundColor = color;
                    block.innerHTML = `<h4>${agendamento.nome_curso}</h4><span>${agendamento.turno}</span><span>${agendamento.instrutor || 'Não Atribuído'}</span>`;
                    block.addEventListener('click', (event) => {
                        event.stopPropagation();
                        abrirModalDetalhes(agendamento.id_turmas);
                    });
                    cell.appendChild(block);
                });

                if (agendamentosDoDia.length === 0) {
                    cell.addEventListener('click', () => {
                        abrirModal(agendamentoModal);
                        document.getElementById('agendamento-salas-id-input').value = sala.id_salas;
                        agendamentoSalasDisplay.value = sala.nome_sala;
                        salasAlocadasInfo.innerHTML = '';
                    });
                }
                grid.appendChild(cell);
            }
        });
        document.getElementById('current-month-year').textContent = dataAtual.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });
    }


    // Função para buscar e renderizar os cursos no select
    async function carregarCursos() {
        try {
            const response = await fetch('./controllers/gerenciar_curso.php');
            if (!response.ok) {
                throw new Error('Erro ao carregar cursos: ' + response.statusText);
            }
            const cursos = await response.json();
            dadosCursos = cursos;
            
            // Popula o seletor da calculadora
            calculadoraDOM.courseSelect.innerHTML = '<option value="">Selecione um curso...</option>';
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id_cursos;
                option.textContent = curso.nome_curso;
                calculadoraDOM.courseSelect.appendChild(option);
            });
            
            console.log('Cursos carregados com sucesso.');
        } catch (error) {
            console.error('Erro ao buscar cursos:', error);
            alert('Não foi possível carregar os cursos. Por favor, verifique a conexão com o banco de dados.');
        }
    }

    // Função para buscar e renderizar as salas
    async function carregarSalas() {
        try {
            const response = await fetch('./controllers/gerenciar_sala.php');
            if (!response.ok) {
                throw new Error('Erro ao carregar salas: ' + response.statusText);
            }
            const salas = await response.json();
            dadosSalas = salas;
            console.log('Salas carregadas com sucesso.');
        } catch (error) {
            console.error('Erro ao buscar salas:', error);
            alert('Não foi possível carregar as salas. Verifique a conexão com o banco de dados.');
        }
    }

    // Função para buscar e renderizar os instrutores
    async function carregarInstrutores() {
        try {
            const response = await fetch('./controllers/gerenciar_instrutores.php');
            if (!response.ok) {
                throw new Error('Erro ao carregar instrutores: ' + response.statusText);
            }
            const instrutores = await response.json();
            dadosInstrutores = instrutores;
            console.log('Instrutores carregados com sucesso.');
        } catch (error) {
            console.error('Erro ao buscar instrutores:', error);
            alert('Não foi possível carregar os instrutores. Verifique a conexão com o banco de dados.');
        }
    }

    // Função para buscar e renderizar os agendamentos
    async function carregarAgendamentos() {
        try {
            const response = await fetch('./controllers/agendar_turma.php');
            if (!response.ok) {
                throw new Error('Erro ao carregar agendamentos: ' + response.statusText);
            }
            const agendamentosCarregados = await response.json();
            agendamentos = agendamentosCarregados;
            console.log('Agendamentos carregados com sucesso.');
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            alert('Não foi possível carregar os agendamentos. Verifique a conexão com o banco de dados.');
        }
    }

    async function carregarDadosIniciais() {
        try {
            const feriadosData = await fetchData('./controllers/get_feriados.php');
            feriados = feriadosData.feriados;
            agendamentos = await fetchData('./controllers/agendar_turma.php');
            dadosSalas = await fetchData('./controllers/gerenciar_sala.php');
            dadosCursos = await fetchData('./controllers/gerenciar_cursos.php');
            dadosInstrutores = await fetchData('./controllers/gerenciar_instrutores.php');
            renderizarCalendario();
            preencherDropdowns();
            popularFiltros();
            await Promise.all([
                carregarCursos(),
                carregarSalas(),
                carregarInstrutores(),
                carregarAgendamentos()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

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

    // --- CONFIGURAÇÃO DOS EVENTOS --
    function setupEventListeners() {
        // Eventos de navegação
        navItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                navigateTo(item.dataset.target);
            });
        });

        // Eventos do calendário
        prevMonthBtn.addEventListener('click', () => {
            dataAtual.setMonth(dataAtual.getMonth() - 1);
            renderizarCalendario();
        });
        nextMonthBtn.addEventListener('click', () => {
            dataAtual.setMonth(dataAtual.getMonth() + 1);
            renderizarCalendario();
        });

        // Botão "Agendar Turma"
        addTurmaBtn.addEventListener('click', () => {
            agendamentoForm.reset();
            agendamentoSalasDisplay.value = '';
            agendamentoSalasIdInput.value = '';
            salasAlocadasInfo.innerHTML = '';
            abrirModal(agendamentoModal);
        });

        // Evento de envio do formulário de Agendamento
        agendamentoForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const cursoId = document.getElementById('curso-agendamento').value;
            const instrutorId = document.getElementById('instrutor-agendamento').value;
            const dataInicio = document.getElementById('data-inicio-agendamento').value;
            const totalAlunos = document.getElementById('total-alunos-agendamento').value;
            const turno = document.getElementById('turno-agendamento').value;
            
            const salasIds = agendamentoSalasIdInput.value.split(',').map(s => parseInt(s));
            
            const diasSemana = Array.from(document.querySelectorAll('#dias-semana-agendamento input:checked')).map(cb => parseInt(cb.value));

            // Validação completa para garantir que todos os campos obrigatórios estão preenchidos
            if (!cursoId || !instrutorId || !dataInicio || !totalAlunos || !turno || salasIds.some(isNaN) || diasSemana.length === 0) {
                alert('Por favor, preencha todos os campos obrigatórios, incluindo o instrutor e a(s) sala(s) alocada(s).');
                return;
            }

            const formData = {
                cursoId: cursoId,
                instrutorId: instrutorId,
                dataInicio: dataInicio,
                totalAlunos: totalAlunos,
                turno: turno,
                salaId: salasIds,
                diasSemana: diasSemana
            };

            agendarTurma(formData);
        });
        
        // Evento de envio do formulário de Detalhes
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

        // Lógica para o botão "Buscar Salas Automaticamente" no modal de Agendamento 
        buscarSalasAutomaticamenteBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            const diasSemana = Array.from(document.querySelectorAll('#dias-semana-agendamento input:checked')).map(cb => cb.value); // Não converte para inteiro aqui

            const dadosAgendamento = {
                cursoId: document.getElementById('curso-agendamento').value,
                totalAlunos: document.getElementById('total-alunos-agendamento').value,
                turno: document.getElementById('turno-agendamento').value,
                diasSemana: diasSemana,
                dataInicio: document.getElementById('data-inicio-agendamento').value
            };

            if (!dadosAgendamento.cursoId || !dadosAgendamento.dataInicio || !dadosAgendamento.totalAlunos || !dadosAgendamento.turno || dadosAgendamento.diasSemana.length === 0) {
                alert('Por favor, preencha todos os campos do formulário para fazer a alocação automática.');
                return;
            }

            try {
                const response = await fetch('./controllers/alocar_turma.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dadosAgendamento)
                });
                const resultado = await response.json();

                if (response.ok && resultado.salas) {
                    const salaIds = resultado.salas.map(s => s.id_salas).join(',');
                    const salasNomes = resultado.salas.map(s => s.nome_sala).join(', ');
                    agendamentoSalasDisplay.value = salasNomes;
                    agendamentoSalasIdInput.value = salaIds;
                    salasAlocadasInfo.innerHTML = `<p style="color: green; font-weight: bold;">Salas disponíveis encontradas:</p><ul>${resultado.salas.map(s => `<li>${s.nome_sala} (Capacidade: ${s.capacidade_maxima})</li>`).join('')}</ul>`;
                    
                    // O objeto de dados para o agendamento precisa ser completo.
                    sugestaoAlocacaoData = {
                        cursoId: dadosAgendamento.cursoId,
                        totalAlunos: dadosAgendamento.totalAlunos,
                        turno: dadosAgendamento.turno,
                        diasSemana: dadosAgendamento.diasSemana,
                        dataInicio: resultado.dataInicio,
                        dataTermino: resultado.dataTermino,
                        salas: resultado.salas
                    };

                    abrirModal(alocacaoModal);
                    document.getElementById('alocacao-curso-nome').textContent = dadosCursos.find(c => c.id_cursos == dadosAgendamento.cursoId)?.nome_curso || 'N/A';
                    document.getElementById('alocacao-data-inicio').textContent = resultado.dataInicio;
                    document.getElementById('alocacao-data-termino').textContent = resultado.dataTermino;
                    document.getElementById('alocacao-salas-sugeridas').textContent = salasNomes;
                } else {
                    agendamentoSalasDisplay.value = 'Nenhuma sala disponível';
                    agendamentoSalasIdInput.value = '';
                    salasAlocadasInfo.innerHTML = `<p style="color: red; font-weight: bold;">Erro na alocação: ${resultado.error}</p>`;
                    alert(`Erro na alocação automática: ${resultado.error}`);
                }
            } catch (error) {
                console.error('Erro na requisição de alocação automática:', error);
                agendamentoSalasDisplay.value = '';
                agendamentoSalasIdInput.value = '';
                salasAlocadasInfo.innerHTML = `<p style="color: red; font-weight: bold;">Erro de comunicação: Não foi possível conectar ao servidor.</p>`;
                alert('Ocorreu um erro ao tentar alocar a turma automaticamente.');
            }
        });


        if (confirmarAlocacaoBtn) {
            confirmarAlocacaoBtn.addEventListener('click', async () => {
                if (!sugestaoAlocacaoData) {
                    alert('Não há dados de alocação para confirmar. Por favor, faça uma busca antes.');
                    return;
                }

                const formData = {
                    cursoId: sugestaoAlocacaoData.cursoId,
                    dataInicio: sugestaoAlocacaoData.dataInicio,
                    dataTermino: sugestaoAlocacaoData.dataTermino, 
                    totalAlunos: sugestaoAlocacaoData.totalAlunos,
                    turno: sugestaoAlocacaoData.turno,
                    salaId: sugestaoAlocacaoData.salas.map(s => s.id_salas), 
                    diasSemana: sugestaoAlocacaoData.diasSemana
                };
                
                try {
                    const response = await fetch('./controllers/agendar_turma.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const resultado = await response.json();

                    if (response.ok) {
                        alert('Turma agendada com sucesso!');
                        fecharModais();
                        navigateTo('painel-visual');
                    } else {
                        alert(`Erro ao agendar turma: ${resultado.error}`);
                    }
                } catch (error) {
                    console.error('Erro na requisição de agendamento:', error);
                    alert('Ocorreu um erro ao tentar agendar a turma. Verifique a conexão.');
                }
            });
        }
        
        // Lógica para o botão de cancelar alocação automática
        if (cancelarAlocacaoBtn) {
            cancelarAlocacaoBtn.addEventListener('click', () => {
                fecharModais();
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

    // Lógica para o formulário da Calculadora Inteligente
    document.addEventListener('DOMContentLoaded', () => {

        const DOM = {
            filterSegmento: document.getElementById('filter-segmento'),
            filterModalidade: document.getElementById('filter-modalidade'),
            filterNomeCurso: document.getElementById('filter-nome-curso'),
            filterChMin: document.getElementById('filter-ch-min'),
            filterChMax: document.getElementById('filter-ch-max'),
            filterTem: document.getElementById('filter-tem'),
            filterBolsa: document.getElementById('filter-bolsa'),
            applyFiltersButton: document.getElementById('apply-filters'),
            clearFiltersButton: document.getElementById('clear-filters'),
            courseSelect: document.getElementById('course-select'),
            courseForm: document.getElementById('course-form'),
            startDateInput: document.getElementById('start-date'),
            shiftSelect: document.getElementById('shift-select'),
            courseDetails: document.getElementById('course-details'),
            displayCh: document.getElementById('display-ch'),
            displayValor: document.getElementById('display-valor'),
            regularCourseOptions: document.getElementById('regular-course-options'),
            temOptions: document.getElementById('tem-options'),
            tem800hOptions: document.getElementById('tem-800h-options'),
            tem1200hOptions: document.getElementById('tem-1200h-options'),
            aprendizagemOptions: document.getElementById('aprendizagem-options'),
            aprendizagemTradicionalOptions: document.getElementById('aprendizagem-tradicional-options'),
            remoteOptionsPanel: document.getElementById('remote-options-panel'),
            remotePercentageSelect: document.getElementById('remote-percentage-select'),
            remoteDetailsOptions: document.getElementById('remote-details-options'),
            remoteDaysSelector: document.getElementById('remote-days-selector'),
            resultsSection: document.getElementById('results-section'),
            resultsContent: document.getElementById('results-content'),
            metricsPanel: document.getElementById('metrics-panel'),
            totalHoursValue: document.getElementById('total-hours-value'),
            durationValue: document.getElementById('duration-value'),
            progressPresencial: document.getElementById('progress-presencial'),
            progressRemoto: document.getElementById('progress-remoto'),
            progressEmpresa: document.getElementById('progress-empresa'),
            calendarVisual: document.getElementById('calendar-visual'),
            exportPdfButton: document.getElementById('export-pdf-button')
        };

        let allCourses = [];
        let nonWorkingDates = {
            "feriados": [
                "2025-01-01", "2025-02-25", "2025-02-26", "2025-02-27", "2025-04-18", "2025-04-21",
                "2025-05-01", "2025-06-19", "2025-07-09", "2025-09-07", "2025-10-12", "2025-10-28",
                "2025-11-02", "2025-11-15", "2025-11-20", "2025-12-25", "2026-01-01", "2026-02-17",
                "2026-02-18", "2026-02-19", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04",
                "2026-07-09", "2026-09-07", "2026-10-12", "2026-10-28", "2026-11-02", "2026-11-15",
                "2026-11-20", "2026-12-25"
            ],
            "pontes": [
                "2025-02-28", "2025-04-19", "2025-06-20", "2025-07-10", "2025-10-13", "2025-10-29",
                "2025-11-03", "2025-11-14", "2025-11-16", "2026-02-20", "2026-04-04", "2026-06-05"
            ],
            "recessos": {
                "REGULAR": [
                    {"start": "2025-07-14", "end": "2025-07-26"},
                    {"start": "2026-07-13", "end": "2026-08-01"}
                ],
                "EAD": [
                    {"start": "2025-07-14", "end": "2025-07-26"},
                    {"start": "2026-07-13", "end": "2026-08-01"}
                ],
                "TEM": [
                    {"start": "2025-07-14", "end": "2025-07-26"},
                    {"start": "2026-07-13", "end": "2026-08-01"}
                ],
                "APRENDIZAGEM": [
                    {"start": "2025-07-14", "end": "2025-07-26"},
                    {"start": "2026-07-13", "end": "2026-07-25"}
                ]
            },
            "nao_letivos": [
                "2025-01-02", "2025-01-03", "2025-01-06", "2025-01-07", "2025-01-08", "2025-01-09", "2025-01-10", "2025-01-13", "2025-01-14", "2025-01-15", "2025-01-16", "2025-01-17", "2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24", "2025-01-27", "2025-01-28", "2025-01-29", "2025-01-30", "2025-01-31",
                "2026-01-02", "2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-12", "2026-01-13", "2026-01-14", "2026-01-15", "2026-01-16", "2026-01-19", "2026-01-20", "2026-01-21", "2026-01-22", "2026-01-23", "2026-01-26", "2026-01-27", "2026-01-28", "2026-01-29", "2026-01-30", "2026-02-02", "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06", "2026-02-09", "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13"
            ]
        };
        
        const API_URL = './controllers/get_feriados.php';

        async function fetchData() {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                allCourses = await response.json();
                populateFilters();
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                DOM.courseSelect.innerHTML = '<option value="">Erro ao carregar cursos. Tente novamente.</option>';
            }
        }

        function populateFilters() {
            const segmentos = [...new Set(allCourses.map(c => c.segmento))].sort();
            const modalidades = [...new Set(allCourses.map(c => c.modalidade))].sort();

            DOM.filterSegmento.innerHTML = '<option value="">Todos</option>';
            segmentos.forEach(s => {
                const option = document.createElement('option');
                option.value = s;
                option.textContent = s;
                DOM.filterSegmento.appendChild(option);
            });

            DOM.filterModalidade.innerHTML = '<option value="">Todos</option>';
            modalidades.forEach(m => {
                const option = document.createElement('option');
                option.value = m;
                option.textContent = m;
                DOM.filterModalidade.appendChild(option);
            });

            filterAndPopulateCourses();
        }

        async function filterAndPopulateCourses() {
            const segmento = DOM.filterSegmento.value;
            const modalidade = DOM.filterModalidade.value;
            const nomeCurso = DOM.filterNomeCurso.value.toLowerCase();
            const chMin = parseInt(DOM.filterChMin.value) || 0;
            const chMax = parseInt(DOM.filterChMax.value) || Infinity;
            const temChecked = DOM.filterTem.checked;
            const bolsaChecked = DOM.filterBolsa.checked;

            const queryParams = new URLSearchParams();
            if (segmento) queryParams.append('segmento', segmento);
            if (modalidade) queryParams.append('modalidade', modalidade);
            if (nomeCurso) queryParams.append('nome_curso', nomeCurso);
            if (chMin > 0) queryParams.append('ch_min', chMin);
            if (chMax < Infinity) queryParams.append('ch_max', chMax);
            if (temChecked) queryParams.append('tem', 'true');
            if (bolsaChecked) queryParams.append('bolsa', 'true');

            try {
                const response = await fetch(`${API_URL}?${queryParams.toString()}`);
                const filteredCourses = await response.json();

                DOM.courseSelect.innerHTML = '<option value="">Selecione um curso</option>';
                if (filteredCourses.length === 0) {
                    const noResultOption = document.createElement('option');
                    noResultOption.textContent = "Nenhum curso encontrado.";
                    noResultOption.disabled = true;
                    DOM.courseSelect.appendChild(noResultOption);
                } else {
                    filteredCourses.forEach(course => {
                        const option = document.createElement('option');
                        option.value = course.id;
                        option.textContent = `${course.nome_curso} (${course.carga_horaria}h)`;
                        option.setAttribute('data-ch', course.carga_horaria);
                        option.setAttribute('data-valor', course.valor);
                        option.setAttribute('data-modalidade', course.modalidade);
                        option.setAttribute('data-tem', course.tem);
                        DOM.courseSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Erro ao filtrar cursos:', error);
                DOM.courseSelect.innerHTML = '<option value="">Erro ao carregar cursos. Tente novamente.</option>';
            }
        }

        // A lógica de cálculo e geração do cronograma é mantida, adaptada para os novos elementos
        function calculateSchedule() {
            const selectedOption = DOM.courseSelect.options[DOM.courseSelect.selectedIndex];
            if (!selectedOption || !selectedOption.value) {
                DOM.resultsSection.classList.add('hidden');
                return;
            }

            const courseCH = parseInt(selectedOption.dataset.ch);
            const courseModalidade = selectedOption.dataset.modalidade;
            const isTem = selectedOption.dataset.tem === '1';
            const startDateString = DOM.startDateInput.value;
            const shift = DOM.shiftSelect.value;
            const remotePercentage = parseInt(DOM.remotePercentageSelect.value);
            const isAprendizagem = courseModalidade.includes('Aprendizagem');

            if (!startDateString) {
                DOM.resultsSection.classList.add('hidden');
                return;
            }

            const startDate = new Date(startDateString + 'T00:00:00');
            let currentDate = new Date(startDate);
            let hoursRemaining = courseCH * 60; // Convert to minutes
            let totalDays = 0;
            let schedule = [];
            let totalPresencialHours = 0;
            let totalRemoteHours = 0;
            let totalEmpresaHours = 0;

            let presencialHours = 0;
            let remoteHours = 0;
            let empresaHours = 0;

            while (hoursRemaining > 0) {
                if (isNonClassDay(currentDate, courseModalidade)) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                const dayOfWeek = currentDate.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                const { classHours, remoteStudy, companyHours } = calculateClassHours(dayOfWeek, shift, remotePercentage, isTem, isAprendizagem, courseCH);
                
                let currentDayHours = 0;
                if (hoursRemaining > 0) {
                    if (isAprendizagem) {
                        if (companyHours > 0) {
                            currentDayHours = Math.min(hoursRemaining / 60, companyHours);
                            totalEmpresaHours += currentDayHours;
                            hoursRemaining -= currentDayHours * 60;
                        }
                    } else if (isTem) {
                        currentDayHours = Math.min(hoursRemaining / 60, classHours);
                        totalPresencialHours += currentDayHours;
                        hoursRemaining -= currentDayHours * 60;
                    } else if (remotePercentage === 100) {
                        currentDayHours = Math.min(hoursRemaining / 60, remoteStudy);
                        totalRemoteHours += currentDayHours;
                        hoursRemaining -= currentDayHours * 60;
                    } else if (remotePercentage > 0) {
                        const presencialComponent = classHours * (1 - remotePercentage / 100);
                        const remoteComponent = remoteStudy;
                        const totalComponent = presencialComponent + remoteComponent;
                        
                        const presencialToTake = Math.min(hoursRemaining / 60, presencialComponent);
                        totalPresencialHours += presencialToTake;
                        hoursRemaining -= presencialToTake * 60;

                        if (hoursRemaining > 0) {
                            const remoteToTake = Math.min(hoursRemaining / 60, remoteComponent);
                            totalRemoteHours += remoteToTake;
                            hoursRemaining -= remoteToTake * 60;
                        }

                        currentDayHours = presencialToTake + (remoteToTake || 0);

                    } else { // 0% remoto
                        currentDayHours = Math.min(hoursRemaining / 60, classHours);
                        totalPresencialHours += currentDayHours;
                        hoursRemaining -= currentDayHours * 60;
                    }
                }

                if (currentDayHours > 0) {
                    const dayType = isAprendizagem ? 'aprendizagem' : (isTem ? 'tem' : (remotePercentage > 0 ? 'remote' : 'presencial'));
                    schedule.push({ date: new Date(currentDate), hours: currentDayHours, type: dayType });
                }

                currentDate.setDate(currentDate.getDate() + 1);
                totalDays++;
                
                if (totalDays > 5000) { // Safety break
                    console.error("Loop de cálculo excedeu o limite de segurança.");
                    break;
                }
            }

            const durationInDays = Math.round((currentDate - startDate) / (1000 * 60 * 60 * 24));
            
            DOM.totalHoursValue.textContent = (totalPresencialHours + totalRemoteHours + totalEmpresaHours).toFixed(2);
            DOM.durationValue.textContent = durationInDays;

            updateProgressBars(totalPresencialHours, totalRemoteHours, totalEmpresaHours);
            generateCalendar(schedule);
            DOM.resultsSection.classList.remove('hidden');
            DOM.metricsPanel.classList.remove('hidden');
            DOM.progressBarsContainer.classList.remove('hidden');
            DOM.progressLegend.classList.remove('hidden');
            DOM.calendarVisual.classList.remove('hidden');
            DOM.exportPdfButton.classList.remove('hidden');
            
            console.log("Cronograma final:", schedule);
            console.log("Horas presenciais:", totalPresencialHours);
            console.log("Horas remotas:", totalRemoteHours);
            console.log("Horas empresa:", totalEmpresaHours);
            console.log("Duração:", durationInDays);
        }

        function isNonClassDay(date, modalidade) {
            const formattedDate = date.toISOString().slice(0, 10);

            if (nonWorkingDates.feriados.includes(formattedDate)) return true;
            if (nonWorkingDates.pontes.includes(formattedDate)) return true;
            if (nonWorkingDates.nao_letivos.includes(formattedDate)) return true;

            const recessos = nonWorkingDates.recessos;
            let recessosToCheck = [];
            if (modalidade.includes('Aprendizagem')) {
                recessosToCheck = recessos.APRENDIZAGEM;
            } else if (modalidade.includes('Técnico')) {
                recessosToCheck = recessos.TEM;
            } else {
                recessosToCheck = recessos.REGULAR;
            }

            for (const recesso of recessosToCheck) {
                const start = new Date(recesso.start + 'T00:00:00');
                const end = new Date(recesso.end + 'T00:00:00');
                if (date >= start && date <= end) {
                    return true;
                }
            }
            
            return false;
        }

        function calculateClassHours(dayOfWeek, shift, remotePercentage, isTem, isAprendizagem) {
            let classHours = 0;
            let remoteStudy = 0;
            let companyHours = 0;

            if (isAprendizagem) {
                if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) { // Seg a Qui
                    companyHours = 8;
                } else if (dayOfWeek === 5) { // Sex
                    classHours = 8;
                }
            } else if (isTem) {
                const selectedTemModel = document.querySelector('input[name="tem-model"]:checked')?.value;
                if (selectedTemModel === '120h') {
                    classHours = 4;
                } else if (selectedTemModel === '260h') {
                    classHours = 4;
                } else { // Padrão
                    classHours = 4;
                }
            } else { // Cursos regulares
                const remoteDays = Array.from(DOM.remoteDaysSelector.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.dataset.day);
                const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
                const currentDayName = dayNames[dayOfWeek];
                
                if (remotePercentage > 0 && remoteDays.includes(currentDayName)) {
                    remoteStudy = 4; 
                    classHours = 4; 
                } else {
                    switch (shift) {
                        case 'manhã':
                        case 'tarde':
                        case 'noite':
                            classHours = 4;
                            break;
                        case 'integral':
                            classHours = 8;
                            break;
                    }
                }
            }
            
            return { classHours, remoteStudy, companyHours };
        }

        function updateProgressBars(presencial, remoto, empresa) {
            const total = presencial + remoto + empresa;
            const presencialPct = total > 0 ? (presencial / total) * 100 : 0;
            const remotoPct = total > 0 ? (remoto / total) * 100 : 0;
            const empresaPct = total > 0 ? (empresa / total) * 100 : 0;
            
            DOM.progressPresencial.style.width = `${presencialPct}%`;
            DOM.progressRemoto.style.width = `${remotoPct}%`;
            DOM.progressEmpresa.style.width = `${empresaPct}%`;
        }

        function generateCalendar(schedule) {
            DOM.calendarVisual.innerHTML = '';
            if (schedule.length === 0) return;

            const months = {};
            schedule.forEach(day => {
                const date = day.date;
                const year = date.getFullYear();
                const month = date.getMonth();
                const key = `${year}-${month}`;
                if (!months[key]) {
                    months[key] = [];
                }
                months[key].push(day);
            });

            const sortedMonths = Object.keys(months).sort();

            sortedMonths.forEach(key => {
                const [year, month] = key.split('-');
                const firstDayOfMonth = new Date(year, month, 1);
                const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();
                const startingDay = firstDayOfMonth.getDay();
                const monthName = firstDayOfMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

                const calendarContainer = document.createElement('div');
                calendarContainer.className = 'calendar-container';
                const header = document.createElement('div');
                header.className = 'calendar-header';
                header.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                calendarContainer.appendChild(header);

                const grid = document.createElement('div');
                grid.className = 'calendar-grid';
                ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(day => {
                    const dayName = document.createElement('div');
                    dayName.className = 'day-name';
                    dayName.textContent = day;
                    grid.appendChild(dayName);
                });

                for (let i = 0; i < startingDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'day-number empty-day';
                    grid.appendChild(emptyDay);
                }
                
                let hoursInMonth = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayNumber = document.createElement('div');
                    dayNumber.className = 'day-number';
                    dayNumber.textContent = day;

                    const dayInSchedule = months[key].find(d => d.date.getDate() === day);
                    if (dayInSchedule) {
                        dayNumber.textContent += ` (${dayInSchedule.hours}h)`;
                        dayNumber.classList.add(`${dayInSchedule.type}-day`);
                        hoursInMonth += dayInSchedule.hours;
                    }
                    
                    grid.appendChild(dayNumber);
                }
                calendarContainer.appendChild(grid);
                
                const footer = document.createElement('div');
                footer.className = 'calendar-footer';
                footer.textContent = `Horas no mês: ${hoursInMonth}h`;
                calendarContainer.appendChild(footer);

                DOM.calendarVisual.appendChild(calendarContainer);
            });
        }

        function handlePdfExport() {
            const { jsPDF } = window.jspdf;
            const content = DOM.resultsContent;
            DOM.exportPdfButton.classList.add('hidden');
            html2canvas(content, { scale: 2, logging: false, useCORS: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const margin = 10;
                const effectiveWidth = pdfWidth - 2 * margin;
                const effectiveHeight = (canvas.height * effectiveWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', margin, margin, effectiveWidth, effectiveHeight);
                pdf.save("relatorio-cronograma-curso.pdf");
                DOM.exportPdfButton.classList.remove('hidden');
            }).catch(err => {
                console.error("PDF Export failed:", err);
                DOM.exportPdfButton.classList.remove('hidden');
            });
        }

        function updateFormOptions() {
            const selectedOption = DOM.courseSelect.options[DOM.courseSelect.selectedIndex];
            if (!selectedOption || !selectedOption.value) {
                DOM.courseDetails.classList.add('hidden');
                DOM.remoteOptionsPanel.classList.add('hidden');
                DOM.temOptions.classList.add('hidden');
                DOM.aprendizagemOptions.classList.add('hidden');
                return;
            }

            const courseCH = selectedOption.dataset.ch;
            const courseValor = selectedOption.dataset.valor;
            const courseModalidade = selectedOption.dataset.modalidade;
            const isTem = selectedOption.dataset.tem === '1';

            DOM.displayCh.textContent = courseCH;
            DOM.displayValor.textContent = courseValor && courseValor !== 'null' ? courseValor : 'Não informado';
            DOM.courseDetails.classList.remove('hidden');

            DOM.remoteOptionsPanel.classList.add('hidden');
            DOM.temOptions.classList.add('hidden');
            DOM.aprendizagemOptions.classList.add('hidden');

            if (courseModalidade === 'Técnico de Nível Médio' && isTem) {
                DOM.temOptions.classList.remove('hidden');
                if (courseCH == 800) {
                    DOM.tem800hOptions.classList.remove('hidden');
                    DOM.tem1200hOptions.classList.add('hidden');
                } else if (courseCH == 1200) {
                    DOM.tem1200hOptions.classList.remove('hidden');
                    DOM.tem800hOptions.classList.add('hidden');
                }
            } else if (courseModalidade.includes('Aprendizagem')) {
                DOM.aprendizagemOptions.classList.remove('hidden');
                DOM.aprendizagemTradicionalOptions.classList.remove('hidden');
            } else {
                DOM.remoteOptionsPanel.classList.remove('hidden');
            }
        }

        DOM.remotePercentageSelect.addEventListener('change', () => {
            const percentage = parseInt(DOM.remotePercentageSelect.value);
            if (percentage > 0) {
                DOM.remoteDetailsOptions.classList.remove('hidden');
            } else {
                DOM.remoteDetailsOptions.classList.add('hidden');
            }
        });

        DOM.courseSelect.addEventListener('change', () => {
            updateFormOptions();
            calculateSchedule();
        });

        DOM.applyFiltersButton.addEventListener('click', filterAndPopulateCourses);
        DOM.clearFiltersButton.addEventListener('click', () => {
            DOM.filterSegmento.value = "";
            DOM.filterModalidade.value = "";
            DOM.filterNomeCurso.value = "";
            DOM.filterChMin.value = "";
            DOM.filterChMax.value = "";
            DOM.filterTem.checked = false;
            DOM.filterBolsa.checked = false;
            filterAndPopulateCourses();
        });

        DOM.courseForm.addEventListener('change', calculateSchedule);
        DOM.exportPdfButton.addEventListener('click', handlePdfExport);
        
        fetchData();
    });

    // --- 7. INICIA A APLICAÇÃO --
    setupEventListeners();
    carregarDadosIniciais();
    navigateTo('painel-visual');
});