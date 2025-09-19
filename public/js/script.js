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

    // Elementos do Modal de Agendamento Manual
    const agendamentoSalasDisplay = document.getElementById('agendamento-salas-display');
    const agendamentoSalasIdInput = document.getElementById('agendamento-salas-id-input');
    const buscarSalasAutomaticamenteBtn = document.getElementById('alocacao-manual-btn');
    const salasAlocadasInfo = document.getElementById('salasAlocadasInfo');

    // Elementos da Calculadora Inteligente e do Modal de Alocação Automática
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

    // ---  SELETORES DA CALCULADORA ---
    const calculadoraDOM = {
        form: document.getElementById('course-form'),
        courseSelect: document.getElementById('course-select'),
        courseDetails: document.getElementById('course-details'),
        displayCH: document.getElementById('display-ch'),
        displayValor: document.getElementById('display-valor'),
        startDate: document.getElementById('start-date'),
        shiftSelect: document.getElementById('shift-select'),
        isTemCheckbox: document.getElementById('is-tem-checkbox'),
        tecnicoTypeOptions: document.getElementById('tecnico-type-options'),
        regularCourseOptions: document.getElementById('regular-course-options'),
        remoteOptionsPanel: document.getElementById('remote-options-panel'),
        aprendizagemOptions: document.getElementById('aprendizagem-options'),
        temOptions: document.getElementById('tem-options'),
        weekdayChecks: document.querySelectorAll('.weekday-check'),
        remotePercentageSelect: document.getElementById('remote-percentage-select'),
        remoteDetailsOptions: document.getElementById('remote-details-options'),
        aprendizagemExclusiva: document.getElementById('aprendizagem-exclusiva'),
        aprendizagemTradicionalOptions: document.getElementById('aprendizagem-tradicional-options'),
        aprendizagemModeloNovo: document.getElementById('aprendizagem-modelo-novo'),
        temRemoteDay: document.getElementById('tem-remote-day'),
        temPresentialDaysSelector: document.getElementById('tem-presencial-days-selector'),
        temWeekdayChecks: document.querySelectorAll('.tem-weekday-check'),
        // Seção de resultados
        calculationResults: document.getElementById('calculation-results'),
        resultCH: document.getElementById('result-ch'),
        resultEndDate: document.getElementById('result-end-date'),
        resultTotalDays: document.getElementById('result-total-days'),
        resultPresentialDays: document.getElementById('result-presential-days'),
        resultRemoteDays: document.getElementById('result-remote-days'),
        calendarView: document.getElementById('calendar-view'),
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

    // --- 4. FUNÇÕES DE RENDERIZAÇÃO --
    function renderizarCalendario() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        const numDays = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate();
        grid.style.gridTemplateColumns = `150px repeat(${numDays},1fr)`;

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

    // --- 5. FUNÇÕES DE REQUISIÇÃO E LÓGICA DE NEGÓCIO --

    async function carregarDadosIniciais() {
        try {
            const feriadosData = await fetchData('./controllers/get_feriados.php');
            feriados = feriadosData.feriados;
            agendamentos = await fetchData('./controllers/get_agendamentos.php');
            dadosSalas = await fetchData('./controllers/get_sala.php');
            dadosCursos = await fetchData('./controllers/get_cursos.php');
            dadosInstrutores = await fetchData('./controllers/get_instrutores.php');
            renderizarCalendario();
            preencherDropdowns();
            popularFiltros();
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


    // --- LÓGICA DA CALCULADORA INTELIGENTE ---
    function renderizarCalendarioCalculadora(data) {
        const {
            total_dias_aula,
            data_termino,
            dias_presenciais,
            dias_remotos,
            total_carga_horaria,
            calendario
        } = data;
        
        calculadoraDOM.resultCH.textContent = total_carga_horaria;
        calculadoraDOM.resultEndDate.textContent = data_termino;
        calculadoraDOM.resultTotalDays.textContent = total_dias_aula;
        calculadoraDOM.resultPresentialDays.textContent = dias_presenciais;
        calculadoraDOM.resultRemoteDays.textContent = dias_remotos;
        calculadoraDOM.calculationResults.classList.remove('hidden');
        
        const calendarView = calculadoraDOM.calendarView;
        calendarView.innerHTML = '';
        
        // Renderiza o calendário detalhado da calculadora aqui
        // (A lógica completa de renderização do calendário aqui pode ser complexa e requer a API de cálculo)
    }

    function popularFiltros() {
        // Extrai os segmentos e modalidades de forma dinâmica
        const segmentsData = [...new Set(dadosCursos.map(c => c.segmento))];
        const modalitiesData = [...new Set(dadosCursos.map(c => c.modalidade))];
        
        const segmentoSelect = document.getElementById('filter-segmento');
        const modalidadeSelect = document.getElementById('filter-modalidade');

        // Garante que os seletores existem antes de tentar populá-los
        if (segmentoSelect) {
             segmentsData.forEach(segmento => {
                const option = document.createElement('option');
                option.value = segmento;
                option.textContent = segmento;
                segmentoSelect.appendChild(option);
            });
        }
       
        if (modalidadeSelect) {
             modalitiesData.forEach(modalidade => {
                const option = document.createElement('option');
                option.value = modalidade;
                option.textContent = modalidade;
                modalidadeSelect.appendChild(option);
            });
        }
    }

    // --- 6. CONFIGURAÇÃO DOS EVENTOS --
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

        // Evento de envio do formulário de Agendamento Manual
        agendamentoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = {
                cursoId: document.getElementById('curso-agendamento').value,
                instrutorId: document.getElementById('instrutor-agendamento').value,
                dataInicio: document.getElementById('data-inicio-agendamento').value,
                totalAlunos: document.getElementById('total-alunos-agendamento').value,
                turno: document.getElementById('turno-agendamento').value,
                salaId: agendamentoSalasIdInput.value.split(',').map(s => parseInt(s)),
                diasSemana: Array.from(document.querySelectorAll('#dias-semana-agendamento input:checked')).map(cb => parseInt(cb.value))
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

        // Função para carregar os cursos no select do modal de alocação
        async function popularAlocacaoCursos() {
            try {
                const response = await fetch('./controllers/get_cursos.php');
                dadosCursos = await response.json();
                alocacaoCursoSelect.innerHTML = ''; // Limpa o select
                dadosCursos.forEach(curso => {
                    const option = document.createElement('option');
                    option.value = curso.id_cursos;
                    option.textContent = curso.nome_curso;
                    alocacaoCursoSelect.appendChild(option);
                });
            } catch (error) {
                console.error("Erro ao buscar cursos:", error);
            }
        }  

        // Lógica para o botão "Buscar Salas Automaticamente" no modal de Agendamento Manual
        buscarSalasAutomaticamenteBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            const dadosAgendamento = {
                cursoId: document.getElementById('curso-agendamento').value,
                totalAlunos: document.getElementById('total-alunos-agendamento').value,
                turno: document.getElementById('turno-agendamento').value,
                diasSemana: Array.from(document.querySelectorAll('#dias-semana-agendamento input:checked')).map(cb => cb.value),
                dataInicio: document.getElementById('data-inicio-agendamento').value
            };

            // Validação de dados adicionada
            if (!dadosAgendamento.cursoId || !dadosAgendamento.dataInicio || !dadosAgendamento.totalAlunos || !dadosAgendamento.turno || dadosAgendamento.diasSemana.length === 0) {
                alert('Por favor, preencha todos os campos do formulário para fazer a alocação automática.');
                return;
            }

            try {
                const response = await fetch('./controllers/alocar_turma.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAgendamento)
                });

                const resultado = await response.json();

                if (response.ok && resultado.salas) {
                    const salaIds = resultado.salas.map(s => s.id_salas).join(',');
                    const salasNomes = resultado.salas.map(s => s.nome_sala).join(', ');
                    agendamentoSalasDisplay.value = salasNomes;
                    agendamentoSalasIdInput.value = salaIds;
                    salasAlocadasInfo.innerHTML = `<p style="color: green; font-weight: bold;">Salas disponíveis encontradas:</p><ul>${resultado.salas.map(s => `<li>${s.nome_sala} (Capacidade: ${s.capacidade_maxima})</li>`).join('')}</ul>`;
                    
                    await popularAlocacaoCursos();
                    alocacaoModal.style.display = 'block';

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
    calculadoraDOM.form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const diasSemanaSelecionados = Array.from(document.querySelectorAll('#dias-semana-tradicional input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
        const dadosCalculadora = {
            courseId: calculadoraDOM.courseSelect.value,
            startDate: calculadoraDOM.startDate.value,
            shift: calculadoraDOM.shiftSelect.value,
            isTem: calculadoraDOM.isTemCheckbox.checked,
            isAprendizagem: calculadoraDOM.aprendizagemExclusiva.checked,
            remotePercentage: calculadoraDOM.remotePercentageSelect.value,
            remotePeriod: calculadoraDOM.remotePeriodSelect.value,
            diasSemana: diasSemanaSelecionados,
            weekdayChecks: Array.from(calculadoraDOM.weekdayChecks)
                .filter(cb => cb.checked)
                .map(cb => parseInt(cb.value)),
        };

        console.log('Dados a serem enviados:', dadosCalculadora);

        try {
            const response = await fetch('/controllers/calculadora_inteligente.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCalculadora)
            });
            const result = await response.json();
            if (response.ok) {
                console.log('Resultado do cálculo:', result);
                renderizarCalendarioCalculadora(result);
            } else {
                alert(`Erro na comunicação com o servidor: ${result.error}`);
                console.error('Erro na requisição:', result);
            }
        } catch (error) {
            console.error('Erro ao calcular:', error);
            alert('Erro ao calcular a duração. Verifique os dados e tente novamente.');
        }
    });

    // Eventos para mostrar/esconder painéis de opções
    calculadoraDOM.courseSelect.addEventListener('change', () => {
        const selectedCourse = dadosCursos.find(c => c.id_cursos == calculadoraDOM.courseSelect.value);
        if (selectedCourse) {
            calculadoraDOM.courseDetails.classList.remove('hidden');
            calculadoraDOM.displayCH.textContent = selectedCourse.ch_total;
            calculadoraDOM.displayValor.textContent = selectedCourse.valor_curso;
            // Lógica para mostrar/esconder as opções com base no tipo de curso
            calculadoraDOM.regularCourseOptions.classList.toggle('hidden', selectedCourse.tipo_curso === 'TEM' || selectedCourse.tipo_curso === 'Aprendizagem');
            calculadoraDOM.tecnicoTypeOptions.classList.toggle('hidden', selectedCourse.tipo_curso !== 'Técnico');
            calculadoraDOM.aprendizagemOptions.classList.toggle('hidden', selectedCourse.tipo_curso !== 'Aprendizagem');
            calculadoraDOM.temOptions.classList.toggle('hidden', selectedCourse.tipo_curso !== 'TEM');
        }
    });

    calculadoraDOM.isTemCheckbox.addEventListener('change', () => {
        calculadoraDOM.temManualOptions.classList.toggle('hidden', !calculadoraDOM.isTemCheckbox.checked);
    });

if (calculadoraDOM.remotePercentageSelect) {
    calculadoraDOM.remotePercentageSelect.addEventListener('change', () => {
        const hasRemote = calculadoraDOM.remotePercentageSelect.value !== '0';
        if (calculadoraDOM.remoteDetailsOptions) {
            calculadoraDOM.remoteDetailsOptions.classList.toggle('hidden', !hasRemote);
        }
    });
}
    
if (calculadoraDOM.aprendizagemExclusiva) {
    calculadoraDOM.aprendizagemExclusiva.addEventListener('change', () => {
        if (calculadoraDOM.aprendizagemTradicionalOptions) {
            calculadoraDOM.aprendizagemTradicionalOptions.classList.toggle('hidden', calculadoraDOM.aprendizagemExclusiva.checked);
        }
    });
}

    // --- 7. INICIA A APLICAÇÃO --
    setupEventListeners();
    carregarDadosIniciais();
    navigateTo('painel-visual');
});