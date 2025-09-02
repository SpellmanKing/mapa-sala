document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ESTADO DA APLICAÇÃO ---
    let dataAtual = new Date();
    let agendamentos = [];
    let dadosSalas = [];
    let dadosCursos = [];
    let dadosInstrutores = [];

    // Lista de feriados (formato 'YYYY-MM-DD')
    const feriados = [
        '2025-01-01', '2025-02-24', '2025-02-25', '2025-02-26', '2025-04-18', '2025-04-21',
        '2025-05-01', '2025-06-19', '2025-09-07', '2025-10-12', '2025-10-28', '2025-11-02',
        '2025-11-15', '2025-11-20', '2025-11-30', '2025-12-25',
    ];

    // --- 2. SELETORES DE ELEMENTOS DO DOM ---
    const currentMonthYearEl = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const scheduleGridEl = document.getElementById('schedule-grid');
    const addTurmaBtn = document.getElementById('add-turma-btn');

    // Modais e formulários
    const agendamentoModal = document.getElementById('agendamento-modal');
    const agendamentoForm = document.getElementById('agendamento-form');
    const agendamentoInfo = document.getElementById('agendamento-info');
    const cursoSelect = document.getElementById('agendamento-curso');
    const instrutorSelect = document.getElementById('agendamento-instrutor');
    const dataInicioInput = document.getElementById('agendamento-data-inicio');
    const totalAlunosInput = document.getElementById('agendamento-total-alunos');
    const agendamentoSalaDisplay = document.getElementById('agendamento-sala-display');
    const agendamentoSalaIdInput = document.getElementById('agendamento-sala-id-input');
    const detalhesModal = document.getElementById('detalhes-modal');
    const detalhesForm = document.getElementById('detalhes-form');
    const detalhesTurmaId = document.getElementById('detalhes-turma-id');
    const detalhesCursoNome = document.getElementById('detalhes-curso-nome');
    const detalhesCodigo = document.getElementById('detalhes-codigo');
    const detalhesTotalAlunos = document.getElementById('detalhes-total-alunos');
    const detalhesSala = document.getElementById('detalhes-sala');
    const detalhesTurno = document.getElementById('detalhes-turno');
    const detalhesInstrutorInput = document.getElementById('detalhes-instrutor');
    const detalhesStatusSelect = document.getElementById('detalhes-status');
    const cancelarTurmaBtn = document.getElementById('cancelar-turma-btn');
    const closeBtns = document.querySelectorAll('.close-btn');
    const alocarAutomaticoBtn = document.getElementById('alocar-automatico-btn');
    const diasSemanaCheckboxes = document.querySelectorAll('input[name="dias-semana"]');

    // --- 3. FUNÇÕES AUXILIARES ---
    function getFormattedDate(date) {
        return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function getMonthName(month) {
        return new Date(2025, month, 1).toLocaleDateString('pt-BR', { month: 'long' });
    }
    
    function getTurnoSelecionado() {
        const turnoSelecionadoEl = document.querySelector('input[name="turno"]:checked');
        if (!turnoSelecionadoEl) {
            alert('Por favor, selecione um turno.');
            return null;
        }
        return turnoSelecionadoEl.value;
    }


    // --- 4. FUNÇÕES DE RENDERIZAÇÃO E LÓGICA DO CALENDÁRIO ---
    function renderCalendar() {
        const year = dataAtual.getFullYear();
        const month = dataAtual.getMonth();
        currentMonthYearEl.textContent = `${getMonthName(month)} ${year}`;
        scheduleGridEl.innerHTML = '';

        const lastDay = new Date(year, month + 1, 0);
        scheduleGridEl.style.gridTemplateColumns = `150px repeat(${lastDay.getDate()}, 1fr)`;

        const headerCell = document.createElement('div');
        headerCell.className = 'schedule-cell schedule-header-cell';
        headerCell.textContent = 'Sala';
        scheduleGridEl.appendChild(headerCell);

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            const headerDateCell = document.createElement('div');
            headerDateCell.className = 'schedule-cell schedule-header-cell';
            headerDateCell.innerHTML = `<span class="day-number">${i}</span><span class="day-of-week">${date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>`;
            scheduleGridEl.appendChild(headerDateCell);
        }

        dadosSalas.forEach(sala => {
            const salaCell = document.createElement('div');
            salaCell.className = 'schedule-cell schedule-day-cell';
            salaCell.textContent = sala.nome_sala;
            salaCell.dataset.salaId = sala.id_salas;
            scheduleGridEl.appendChild(salaCell);

            for (let i = 1; i <= lastDay.getDate(); i++) {
                const date = new Date(year, month, i);
                const isoDate = date.toISOString().split('T')[0];
                const cell = document.createElement('div');
                cell.className = 'schedule-cell';

                const agendamentosDoDia = agendamentos.filter(agendamento =>
                    agendamento.data_aula === isoDate && parseInt(agendamento.id_salas) === parseInt(sala.id_salas)
                );

                if (agendamentosDoDia.length > 0) {
                    agendamentosDoDia.forEach(agendamento => {
                        const eventDiv = document.createElement('div');
                        eventDiv.className = 'schedule-event';
                        eventDiv.style.backgroundColor = agendamento.turno === 'Manhã' ? '#007bff' :
                            agendamento.turno === 'Tarde' ? '#28a745' :
                            agendamento.turno === 'Noite' ? '#6f42c2' : '#dc3545';
                        eventDiv.innerHTML = `<strong>${agendamento.nome_curso}</strong><small>${agendamento.turno}</small>`;
                        eventDiv.dataset.turmaId = agendamento.id_turmas;
                        eventDiv.addEventListener('click', () => {
                            abrirModalDetalhes(agendamento.id_turmas);
                        });
                        cell.appendChild(eventDiv);
                    });
                } else {
                    cell.classList.add('free');
                    cell.addEventListener('click', () => {
                        abrirModalAgendamento(isoDate, sala.id_salas, sala.nome_sala);
                    });
                }
                const diaDaSemana = date.getDay();
                if (diaDaSemana === 0 || diaDaSemana === 6) {
                    cell.classList.add('weekend');
                }
                if (feriados.includes(isoDate)) {
                    cell.classList.add('holiday');
                }
                scheduleGridEl.appendChild(cell);
            }
        });
    }

    // --- 5. FUNÇÕES DE INTERAÇÃO COM A API (AJAX/Fetch) ---
    async function carregarDados() {
        try {
            const [cursosRes, salasRes, instrutoresRes, agendamentosRes] = await Promise.all([
                fetch('./controllers/get_cursos.php'),
                fetch('./controllers/get_sala.php'),
                fetch('./controllers/get_instrutores.php'),
                fetch('./controllers/get_agendamentos.php')
            ]);
            dadosCursos = await cursosRes.json();
            dadosSalas = await salasRes.json();
            dadosInstrutores = await instrutoresRes.json();
            agendamentos = await agendamentosRes.json();
            popularSelects();
            renderCalendar();
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            alert('Não foi possível carregar os dados. Verifique a conexão com o servidor.');
        }
    }

    async function agendarNovaTurma(dados) {
        try {
            const response = await fetch('./controllers/agendar_turma.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                agendamentoModal.style.display = 'none';
                carregarDados();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro ao agendar turma:', error);
            alert('Erro ao agendar turma. Tente novamente.');
        }
    }

    async function alocarAutomaticamente() {
        const cursoId = cursoSelect.value;
        const dataInicio = dataInicioInput.value;
        const totalAlunos = totalAlunosInput.value;
        const turno = getTurnoSelecionado();

        if (!turno) {
            return;
        }

        const diasSemanaSelecionados = Array.from(diasSemanaCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => parseInt(checkbox.value));

        if (!cursoId || !dataInicio || !totalAlunos || diasSemanaSelecionados.length === 0) {
            alert('Por favor, preencha Curso, Data de Início, Total de Alunos e selecione pelo menos um dia da semana para a alocação automática.');
            return;
        }

        const dadosAlocacao = {
            cursoId: parseInt(cursoId),
            dataInicio: dataInicio,
            totalAlunos: parseInt(totalAlunos),
            turno: turno,
            diasSemana: diasSemanaSelecionados
        };

        try {
            const response = await fetch('./controllers/alocar_turma.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAlocacao)
            });
            const result = await response.json();
            if (response.ok) {
                const nomesSalas = result.salas.map(s => s.nome_sala).join(', ');
                const idsSalas = result.salas.map(s => s.id_salas).join(',');
                agendamentoSalaDisplay.value = nomesSalas;
                agendamentoSalaIdInput.value = idsSalas;
                alert(`Alocação automática bem-sucedida! Sala(s): ${nomesSalas}`);
            } else {
                alert(`Erro na alocação: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro ao chamar a alocação automática:', error);
            alert('Ocorreu um erro ao tentar alocar a turma. Verifique a conexão com o servidor.');
        }
    }


    async function gerenciarTurma(turmaId, dados) {
        try {
            const response = await fetch('./controllers/gerenciar_turma.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                detalhesModal.style.display = 'none';
                carregarDados();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro ao gerenciar turma:', error);
            alert('Erro ao gerenciar turma. Tente novamente.');
        }
    }


    // --- 6. FUNÇÕES DE INTERAÇÃO COM A UI ---
    function abrirModalAgendamento(data, salaId, salaNome) {
        agendamentoInfo.textContent = `Você está agendando uma turma para a sala: ${salaNome} em ${getFormattedDate(new Date(data))}.`;
        agendamentoSalaDisplay.value = salaNome;
        agendamentoSalaIdInput.value = salaId;
        agendamentoModal.style.display = 'block';
    }

    async function abrirModalDetalhes(turmaId) {
        const agendamento = agendamentos.find(a => a.id_turmas == turmaId);
        if (!agendamento) {
            console.error('Agendamento não encontrado para o ID:', turmaId);
            return;
        }

        detalhesTurmaId.value = agendamento.id_turmas;
        detalhesCursoNome.textContent = agendamento.nome_curso;
        detalhesCodigo.textContent = agendamento.codigo_turma || 'N/A';
        detalhesTotalAlunos.textContent = agendamento.total_alunos;
        detalhesSala.textContent = agendamento.nome_sala;
        detalhesTurno.textContent = agendamento.turno;
        detalhesInstrutorInput.value = agendamento.instrutor || '';
        detalhesStatusSelect.value = agendamento.status;
        detalhesModal.style.display = 'block';
    }

    function fecharModais() {
        agendamentoModal.style.display = 'none';
        detalhesModal.style.display = 'none';
        agendamentoForm.reset();
        agendamentoInfo.textContent = '';
        agendamentoSalaDisplay.value = '';
    }

    function popularSelects() {
        cursoSelect.innerHTML = '<option value="">Selecione o Curso</option>';
        dadosCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id_cursos;
            option.textContent = curso.nome_curso;
            cursoSelect.appendChild(option);
        });

        const instrutoresDatalist = document.getElementById('agendamento-instrutores-list');
        const detalhesInstrutoresDatalist = document.getElementById('detalhes-instrutores-list');
        instrutoresDatalist.innerHTML = '';
        detalhesInstrutoresDatalist.innerHTML = '';
        dadosInstrutores.forEach(instrutor => {
            const option = document.createElement('option');
            option.value = instrutor.nome_instrutor;
            instrutoresDatalist.appendChild(option);
            detalhesInstrutoresDatalist.appendChild(option.cloneNode(true));
        });
    }

    // --- 7. LISTENERS DE EVENTOS ---
    prevMonthBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        renderCalendar();
    });

    addTurmaBtn.addEventListener('click', () => {
        agendamentoInfo.textContent = 'Preencha os dados abaixo para agendar uma nova turma.';
        agendamentoSalaDisplay.value = '';
        agendamentoSalaIdInput.value = '';
        agendamentoForm.reset();
        agendamentoModal.style.display = 'block';
    });

    alocarAutomaticoBtn.addEventListener('click', alocarAutomaticamente);

    agendamentoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const turnoValue = getTurnoSelecionado();
        if (!turnoValue) {
            return;
        }

        const dadosAgendamento = {
            cursoId: parseInt(cursoSelect.value),
            instrutorNome: instrutorSelect.value,
            dataInicio: dataInicioInput.value,
            totalAlunos: parseInt(totalAlunosInput.value),
            salaId: agendamentoSalaIdInput.value.split(',').map(id => parseInt(id)),
            turno: turnoValue,
            diasSemana: Array.from(diasSemanaCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => parseInt(checkbox.value))
        };

        await agendarNovaTurma(dadosAgendamento);
    });

    detalhesForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dadosDetalhes = {
            turmaId: detalhesTurmaId.value,
            instrutorNome: detalhesInstrutorInput.value,
            status: detalhesStatusSelect.value
        };
        await gerenciarTurma(detalhesTurmaId.value, dadosDetalhes);
    });

    cancelarTurmaBtn.addEventListener('click', async () => {
        const confirmacao = confirm("Tem certeza que deseja CANCELAR esta turma? Esta ação não pode ser desfeita.");
        if (confirmacao) {
            const dadosCancelamento = {
                turmaId: detalhesTurmaId.value,
                instrutorNome: detalhesInstrutorInput.value,
                status: 'Cancelada'
            };
            await gerenciarTurma(detalhesTurmaId.value, dadosCancelamento);
        }
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', fecharModais);
    });

    window.addEventListener('click', (event) => {
        if (event.target === agendamentoModal) {
            fecharModais();
        }
        if (event.target === detalhesModal) {
            fecharModais();
        }
    });

    // Inicia a aplicação
    carregarDados();
});