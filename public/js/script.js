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
    const alocacaoForm = document.getElementById('alocacao-form');

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

    // Função para exibir a sugestão de alocação
    function exibirSugestao(sugestao) {
        const cursoNome = dadosCursos.find(c => c.id_cursos == sugestao.cursoId)?.nome_curso;
        sugestaoMensagem.textContent = `Encontrada(s) sala(s) disponível(is) para o curso de ${cursoNome}.`;
        salasSugeridasLista.innerHTML = '';
        sugestao.salas.forEach(sala => {
            const li = document.createElement('li');
            li.textContent = `Sala: ${sala.nome_sala} (Capacidade: ${sala.capacidade_maxima})`;
            salasSugeridasLista.appendChild(li);
        });
        sugestaoContainer.style.display = 'block';
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

        // // Lógica para o formulário da Calculadora Inteligente
        // alocacaoForm.addEventListener('submit', async (event) => {
        //     event.preventDefault();
        //     const dadosAlocacao = {
        //         cursoId: document.getElementById('alocacao-curso').value,
        //         totalAlunos: document.getElementById('alocacao-alunos').value,
        //         turno: document.getElementById('alocacao-turno').value,
        //         diasSemana: Array.from(document.querySelectorAll('#alocacao-form input[name="diasSemana"]:checked')).map(cb => parseInt(cb.value)),
        //         dataInicio: new Date().toISOString().split('T')[0]
        //     };
            
        //     if (!dadosAlocacao.cursoId || !dadosAlocacao.totalAlunos || !dadosAlocacao.turno || dadosAlocacao.diasSemana.length === 0) {
        //          alert('Por favor, preencha todos os campos do formulário para a alocação.');
        //          return;
        //     }

        //     try {
        //         const response = await fetch('./controllers/alocar_turma.php', {
        //             method: 'POST',
        //             headers: { 'Content-Type': 'application/json' },
        //             body: JSON.stringify(dadosAlocacao)
        //         });
        //         const resultado = await response.json();
                
        //         if (!response.ok) {
        //             alert(`Erro na Alocação Automática: ${resultado.error}`);
        //             sugestaoContainer.style.display = 'none';
        //             return;
        //         }
                
        //         sugestaoAlocacaoData = resultado;
        //         exibirSugestao(sugestaoAlocacaoData);

        //     } catch (error) {
        //         alert('Ocorreu um erro ao tentar a alocação automática.');
        //         console.error(error);
        //     }
        // });

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

    const calculadoraDOM = {
        filterNomeCurso: document.getElementById('filter-nome-curso'),
        filterSegmento: document.getElementById('filter-segmento'),
        filterModalidade: document.getElementById('filter-modalidade'),
        filterChMin: document.getElementById('filter-ch-min'),
        filterChMax: document.getElementById('filter-ch-max'),
        filterTem: document.getElementById('filter-tem'),
        filterBolsa: document.getElementById('filter-bolsa'),
        applyFilters: document.getElementById('apply-filters'),
        clearFilters: document.getElementById('clear-filters'),
        courseSelect: document.getElementById('course-select'),
        courseDetails: document.getElementById('course-details'),
        displayCh: document.getElementById('display-ch'),
        displayValor: document.getElementById('display-valor'),
        startDate: document.getElementById('start-date'),
        shiftSelect: document.getElementById('shift-select'),
        tecnicoTypeOptions: document.getElementById('tecnico-type-options'),
        isTemCheckbox: document.getElementById('is-tem-checkbox'),
        regularCourseOptions: document.getElementById('regular-course-options'),
        remoteOptionsPanel: document.getElementById('remote-options-panel'),
        remotePercentageSelect: document.getElementById('remote-percentage-select'),
        remoteDetailsOptions: document.getElementById('remote-details-options'),
        remoteFrequencySelect: document.getElementById('remote-frequency-select'),
        remotePeriodSelect: document.getElementById('remote-period-select'),
        aprendizagemOptions: document.getElementById('aprendizagem-options'),
        aprendizagemExclusiva: document.getElementById('aprendizagem-exclusiva'),
        aprendizagemTradicionalOptions: document.getElementById('aprendizagem-tradicional-options'),
        aprendizagemModeloNovo: document.getElementById('aprendizagem-modelo-novo'),
        calculateButton: document.getElementById('calculate-button'),
        resultsSection: document.getElementById('results-section'),
        resultsContent: document.getElementById('results-content'),
        exportPdfButton: document.getElementById('export-pdf-button'),
        calendarVisual: document.getElementById('calendar-visual'),
    };

    function filterCourses() {
        const filters = {
            nome: calculadoraDOM.filterNomeCurso.value.toLowerCase(),
            segmento: calculadoraDOM.filterSegmento.value,
            modalidade: calculadoraDOM.filterModalidade.value,
            chMin: parseInt(calculadoraDOM.filterChMin.value) || 0,
            chMax: parseInt(calculadoraDOM.filterChMax.value) || Infinity,
            tem: calculadoraDOM.filterTem.checked,
            bolsa: calculadoraDOM.filterBolsa.checked
        };
        const filtered = dadosCursos.filter(course => {
            const matchesNome = course.nome_curso.toLowerCase().includes(filters.nome);
            const matchesSegmento = filters.segmento === "Todos" || filters.segmento === "" || course.segmento === filters.segmento;
            const matchesModalidade = filters.modalidade === "Todas" || filters.modalidade === "" || course.modalidade === filters.modalidade;
            const matchesCh = course.carga_horaria >= filters.chMin && course.carga_horaria <= filters.chMax;
            const matchesTem = !filters.tem || course.tem;
            const matchesBolsa = !filters.bolsa || course.bolsa;
            return matchesNome && matchesSegmento && matchesModalidade && matchesCh && matchesTem && matchesBolsa;
        });
        populateCourseSelect(filtered);
    }
    
    function populateCourseSelect(courses) {
        calculadoraDOM.courseSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Selecione um curso";
        calculadoraDOM.courseSelect.appendChild(defaultOption);
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id_cursos;
            option.textContent = course.nome_curso;
            option.dataset.ch = course.carga_horaria;
            option.dataset.valor = course.valor;
            option.dataset.isTem = course.tem;
            option.dataset.modalidade = course.modalidade;
            calculadoraDOM.courseSelect.appendChild(option);
        });
    }

    function updateCourseDetails() {
        const selectedOption = calculadoraDOM.courseSelect.options[calculadoraDOM.courseSelect.selectedIndex];
        if (selectedOption && selectedOption.value !== "") {
            calculadoraDOM.courseDetails.classList.remove('hidden');
            calculadoraDOM.displayCh.textContent = selectedOption.dataset.ch;
            calculadoraDOM.displayValor.textContent = `R$ ${parseFloat(selectedOption.dataset.valor).toFixed(2).replace('.', ',')}`;

            const isTem = selectedOption.dataset.isTem === 'true';
            const isRemote = selectedOption.dataset.modalidade === 'Remoto';
            const isHibrido = selectedOption.dataset.modalidade === 'Híbrido';

            calculadoraDOM.tecnicoTypeOptions.classList.toggle('hidden', !isTem);
            calculadoraDOM.regularCourseOptions.classList.toggle('hidden', isTem);
            calculadoraDOM.remoteOptionsPanel.classList.toggle('hidden', !(isRemote || isHibrido));
            calculadoraDOM.aprendizagemOptions.classList.add('hidden');
        } else {
            calculadoraDOM.courseDetails.classList.add('hidden');
            calculadoraDOM.tecnicoTypeOptions.classList.add('hidden');
            calculadoraDOM.regularCourseOptions.classList.add('hidden');
            calculadoraDOM.remoteOptionsPanel.classList.add('hidden');
            calculadoraDOM.aprendizagemOptions.classList.add('hidden');
        }
    }

    function setupCalculatorEvents() {
        calculadoraDOM.applyFilters.addEventListener('click', filterCourses);
        calculadoraDOM.clearFilters.addEventListener('click', () => {
            document.getElementById('calculadora-inteligente-form').reset();
            filterCourses();
        });
        calculadoraDOM.courseSelect.addEventListener('change', updateCourseDetails);
        calculadoraDOM.remotePercentageSelect.addEventListener('change', () => {
            if (calculadoraDOM.remotePercentageSelect.value > 0) {
                calculadoraDOM.remoteDetailsOptions.classList.remove('hidden');
            } else {
                calculadoraDOM.remoteDetailsOptions.classList.add('hidden');
            }
        });
        calculadoraDOM.aprendizagemExclusiva.addEventListener('change', () => {
            calculadoraDOM.aprendizagemTradicionalOptions.classList.toggle('hidden', calculadoraDOM.aprendizagemExclusiva.checked);
            calculadoraDOM.aprendizagemModeloNovo.classList.toggle('hidden', !calculadoraDOM.aprendizagemExclusiva.checked);
        });
    }

    function popularFiltros() {
        // Extrai os segmentos e modalidades de forma dinâmica
        const segmentsData = [...new Set(dadosCursos.map(c => c.segmento))];
        const modalitiesData = [...new Set(dadosCursos.map(c => c.modalidade))];
        
        const segmentoSelect = calculadoraDOM.filterSegmento;
        const modalidadeSelect = calculadoraDOM.filterModalidade;

        segmentsData.forEach(segmento => {
            const option = document.createElement('option');
            option.value = segmento;
            option.textContent = segmento;
            segmentoSelect.appendChild(option);
        });
        
        modalitiesData.forEach(modalidade => {
            const option = document.createElement('option');
            option.value = modalidade;
            option.textContent = modalidade;
            modalidadeSelect.appendChild(option);
        });
    }

    // --- 7. INICIA A APLICAÇÃO --
    setupEventListeners();
    carregarDadosIniciais();
    navigateTo('painel-visual');
});