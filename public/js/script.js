document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ESTADO DA APLICAÇÃO ---
    let dataAtual = new Date(2025, 7, 1);
    let agendamentos = [];
    let dadosSalas = [];
    let dadosCursos = [];
    let agendamentoSelecionado = null; // Armazena a info do agendamento clicado

    // --- 2. SELETORES DE ELEMENTOS DO DOM ---
    const currentMonthYearEl = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const timelineHeaderEl = document.querySelector('.timeline-header');
    const scheduleGridEl = document.querySelector('.schedule-grid');

    const agendamentoModal = document.getElementById('agendamento-modal');
    const detalhesModal = document.getElementById('detalhes-modal');
    const agendamentoForm = document.getElementById('agendamento-form');
    const cursoSelect = document.getElementById('curso-select');
    const dataInicioInput = document.getElementById('data-inicio');
    const totalAlunosInput = document.getElementById('total-alunos');
    const agendamentoDataInput = document.getElementById('agendamento-data');
    const agendamentoSalaIdInput = document.getElementById('agendamento-sala-id');
    const turnoSelect = document.getElementById('turno-select-agendamento');
    const addTurmaBtn = document.getElementById('add-turma-btn');
    
    const detalhesCursoNome = document.getElementById('detalhes-curso-nome');
    const detalhesForm = document.getElementById('detalhes-form');
    const detalhesTurmaId = document.getElementById('detalhes-turma-id');
    const detalhesInstrutorInput = document.getElementById('detalhes-instrutor');
    const detalhesStatusSelect = document.getElementById('detalhes-status');
    const detalhesCodigo = document.getElementById('detalhes-codigo');
    const detalhesTotalAlunos = document.getElementById('detalhes-total-alunos');
    const detalhesSala = document.getElementById('detalhes-sala');
    const cancelarTurmaBtn = document.getElementById('cancelar-turma-btn');

    // Fechar modais
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeModal(agendamentoModal);
            closeModal(detalhesModal);
        });
    });

    // --- 3. FUNÇÕES DE EXIBIÇÃO ---
    function mostrarModal(modal) {
        modal.style.display = 'block';
    }

    function fecharModal(modal) {
        modal.style.display = 'none';
    }

    // --- 4. FUNÇÕES DE RENDERIZAÇÃO ---
    function renderizarCabecalhoLinhaDoTempo() {
        // ... (código existente)
        timelineHeaderEl.innerHTML = '';
        const data = new Date(dataAtual);
        const diasNoMes = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= diasNoMes; i++) {
            const diaEl = document.createElement('div');
            diaEl.className = 'timeline-cell';
            const diaSemana = new Date(data.getFullYear(), data.getMonth(), i).toLocaleDateString('pt-BR', { weekday: 'short' });
            diaEl.innerHTML = `<span class="dia-semana">${diaSemana}</span><br>${i}`;
            timelineHeaderEl.appendChild(diaEl);
        }
    }

    function renderizarGradeDeAgendamentos() {
        scheduleGridEl.innerHTML = '';
        const data = new Date(dataAtual);
        const diasNoMes = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
        
        if (dadosSalas.length === 0 || agendamentos.length === 0) {
            console.log("Aguardando dados para renderizar a grade.");
            return;
        }

        dadosSalas.forEach(sala => {
            const salaRowEl = document.createElement('div');
            salaRowEl.className = 'schedule-row';

            const salaNomeEl = document.createElement('div');
            salaNomeEl.className = 'schedule-row-header';
            salaNomeEl.textContent = sala.nome_sala;
            salaRowEl.appendChild(salaNomeEl);

            for (let i = 1; i <= diasNoMes; i++) {
                const diaCellEl = document.createElement('div');
                diaCellEl.className = 'schedule-cell';
                diaCellEl.dataset.salaId = sala.id_salas;
                const dia = new Date(data.getFullYear(), data.getMonth(), i);
                diaCellEl.dataset.data = dia.toISOString().split('T')[0];

                // Adiciona o evento de clique para abrir o modal de agendamento
                diaCellEl.addEventListener('click', () => {
                    agendamentoDataInput.value = dia.toISOString().split('T')[0];
                    agendamentoSalaIdInput.value = sala.id_salas;
                    mostrarModal(agendamentoModal);
                });

                // Renderiza agendamentos para este dia e sala
                agendamentos.filter(ag => {
                    const agendamentoData = new Date(ag.data_aula);
                    return ag.id_salas === sala.id_salas &&
                           agendamentoData.getFullYear() === dia.getFullYear() &&
                           agendamentoData.getMonth() === dia.getMonth() &&
                           agendamentoData.getDate() === dia.getDate();
                }).forEach(ag => {
                    const agendamentoBloco = document.createElement('div');
                    agendamentoBloco.className = 'agendamento-bloco';
                    agendamentoBloco.textContent = ag.nome_curso;
                    agendamentoBloco.style.backgroundColor = getCorPorStatus(ag.status);
                    agendamentoBloco.style.left = `0`;
                    agendamentoBloco.style.width = `100%`;
                    agendamentoBloco.dataset.idTurma = ag.id_turmas;

                    agendamentoBloco.addEventListener('click', (event) => {
                        event.stopPropagation(); // Evita que o evento de clique da célula também dispare
                        agendamentoSelecionado = ag;
                        renderizarDetalhesModal(agendamentoSelecionado);
                        mostrarModal(detalhesModal);
                    });
                    diaCellEl.appendChild(agendamentoBloco);
                });

                salaRowEl.appendChild(diaCellEl);
            }
            scheduleGridEl.appendChild(salaRowEl);
        });
    }

    function renderizarDetalhesModal(agendamento) {
        detalhesCursoNome.textContent = agendamento.nome_curso;
        detalhesTurmaId.value = agendamento.id_turmas;
        detalhesInstrutorInput.value = agendamento.instrutor || '';
        detalhesStatusSelect.value = agendamento.status;
        detalhesCodigo.textContent = agendamento.id_turmas; // Supondo que id_turmas seja o código
        detalhesTotalAlunos.textContent = agendamento.total_alunos;
        detalhesSala.textContent = agendamento.nome_sala;
    }

    function getCorPorStatus(status) {
        switch (status) {
            case 'Em Andamento': return '#ff6a1e';
            case 'Concluída': return '#1a75ff';
            case 'Cancelada': return '#d9534f';
            case 'Planejada':
            default: return '#005a9c';
        }
    }

    function renderizarSelectCursos() {
        cursoSelect.innerHTML = '<option value="">Selecione um Curso</option>';
        dadosCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id_cursos;
            option.textContent = curso.nome_curso;
            cursoSelect.appendChild(option);
        });
    }

    function renderizarCalendario() {
        currentMonthYearEl.textContent = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        renderizarCabecalhoLinhaDoTempo();
        renderizarGradeDeAgendamentos();
    }

    // --- 5. FUNÇÕES DE FETCH (COM TRATAMENTO DE ERRO) ---

    async function fetchSalas() {
        try {
            const response = await fetch('controllers/get_sala.php');
            if (!response.ok) {
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            const data = await response.json();
            dadosSalas = data;
        } catch (error) {
            console.error('Erro ao buscar salas:', error);
            alert('Não foi possível carregar as salas. Verifique a conexão com o servidor.');
        }
    }

    async function fetchCursos() {
        try {
            const response = await fetch('controllers/get_cursos.php');
            if (!response.ok) {
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            const data = await response.json();
            dadosCursos = data;
            renderizarSelectCursos();
        } catch (error) {
            console.error('Erro ao buscar cursos:', error);
            alert('Não foi possível carregar os cursos. Verifique a conexão com o servidor.');
        }
    }

    async function fetchAgendamentos() {
        try {
            const response = await fetch('controllers/get_agendamentos.php');
            if (!response.ok) {
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            const data = await response.json();
            agendamentos = data;
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            alert('Não foi possível carregar os agendamentos. Verifique a conexão com o servidor.');
        }
    }
    
    // Agendar nova turma
    async function agendarNovaTurma(dados) {
        try {
            const response = await fetch('controllers/agendar_turma.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Erro desconhecido ao agendar a turma.');
            }
            alert(result.message);
            fecharModal(agendamentoModal);
            await fetchDadosIniciais(); // Recarrega os dados para atualizar a grade
        } catch (error) {
            console.error('Erro no agendamento:', error);
            alert('Erro ao agendar a turma: ' + error.message);
        }
    }

    // Gerenciar (salvar/cancelar) turma
    async function gerenciarTurma(turmaId, dados) {
        try {
            const response = await fetch(`controllers/gerenciar_turma.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro desconhecido ao gerenciar a turma.');
            }
            alert(result.message);
            fecharModal(detalhesModal);
            await fetchDadosIniciais(); // Recarrega os dados para atualizar a grade
        } catch (error) {
            console.error('Erro ao gerenciar turma:', error);
            alert('Erro ao gerenciar a turma: ' + error.message);
        }
    }

    async function fetchDadosIniciais() {
        await fetchSalas();
        await fetchCursos();
        await fetchAgendamentos();
        renderizarCalendario();
    }

    // --- 6. EVENT LISTENERS ---
    prevMonthBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        renderizarCalendario();
    });

    nextMonthBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        renderizarCalendario();
    });

    addTurmaBtn.addEventListener('click', () => {
        agendamentoForm.reset();
        mostrarModal(agendamentoModal);
    });
    
    agendamentoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dadosAgendamento = {
            cursoId: parseInt(cursoSelect.value),
            instrutorNome: document.getElementById('instrutor-select').value,
            dataInicio: dataInicioInput.value,
            totalAlunos: totalAlunosInput.value,
            salaId: parseInt(agendamentoSalaIdInput.value),
            turno: turnoSelect.value
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
                instrutorNome: detalhesInstrutorInput.value, // Mantém o instrutor na requisição
                status: 'Cancelada'
            };
            await gerenciarTurma(detalhesTurmaId.value, dadosCancelamento);
        }
    });

    // --- 7. INICIALIZAÇÃO ---
    fetchDadosIniciais();

});