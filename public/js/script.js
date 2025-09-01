document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ESTADO DA APLICAÇÃO ---
    let dataAtual = new Date();
    let agendamentos = [];
    let dadosSalas = [];
    let dadosCursos = [];
    let dadosInstrutores = []; // Novo array para os dados dos instrutores

    // --- 2. SELETORES DE ELEMENTOS DO DOM ---
    const currentMonthYearEl = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const timelineHeaderEl = document.querySelector('.timeline-header');
    const scheduleGridEl = document.querySelector('.schedule-grid');
    const addTurmaBtn = document.getElementById('add-turma-btn');
    const agendamentoModal = document.getElementById('agendamento-modal');
    const detalhesModal = document.getElementById('detalhes-modal');
    const agendamentoForm = document.getElementById('agendamento-form');
    const detalhesForm = document.getElementById('detalhes-form');
    const cancelarTurmaBtn = document.getElementById('cancelar-turma-btn');
    const agendarBtn = document.getElementById('agendar-btn');
    const alocacaoAutomaticaBtn = document.getElementById('alocacao-automatica-btn');

    // Campos do formulário de agendamento
    const cursoSelect = document.getElementById('curso-select');
    const dataInicioInput = document.getElementById('data-inicio');
    const totalAlunosInput = document.getElementById('total-alunos');
    const agendamentoSalaIdInput = document.getElementById('agendamento-sala-id');
    const turnoSelect = document.getElementById('turno-select-agendamento');
    const instrutorSelect = document.getElementById('instrutor-select');
    const instrutoresList = document.getElementById('instrutores-list');
    

    // Campos do formulário de detalhes
    const detalhesTurmaId = document.getElementById('detalhes-turma-id');
    const detalhesCursoNome = document.getElementById('detalhes-curso-nome');
    const detalhesInstrutorInput = document.getElementById('detalhes-instrutor');
    const detalhesInstrutoresList = document.getElementById('detalhes-instrutores-list'); // Novo seletor para a datalist de detalhes
    const detalhesStatusSelect = document.getElementById('detalhes-status');
    
    // Filtros
    const turnoFilter = document.getElementById('turno-filter');
    const tipoSalaFilter = document.getElementById('tipo-sala-filter');

    // --- 3. FUNÇÕES DE UTILIDADE E DE RENDERIZAÇÃO ---
    function formatarData(data) {
        const d = new Date(data + 'T00:00:00'); // Garante que a data é tratada como local
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    function renderizarMes() {
        currentMonthYearEl.textContent = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        renderizarGrid();
    }

    // Função de renderização da grade (Versão 2.1)
    function renderizarGrid() {
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth();
        const diasNoMes = new Date(ano, mes + 1, 0).getDate();

        // Limpa a grade antes de renderizar
        scheduleGridEl.innerHTML = '';

        // -- Mágica do CSS Grid Dinâmico --
        // Define a variável CSS que controla o número de colunas de dias
        scheduleGridEl.style.setProperty('--grid-columns', diasNoMes);

        // 1. Renderiza o cabeçalho superior
        // Célula vazia no canto superior esquerdo
        const cantoVazio = document.createElement('div');
        cantoVazio.classList.add('grid-header');
        cantoVazio.textContent = 'Salas';
        scheduleGridEl.appendChild(cantoVazio);

        // Cabeçalhos dos dias do mês (1, 2, 3...)
        for (let i = 1; i <= diasNoMes; i++) {
            const diaEl = document.createElement('div');
            diaEl.classList.add('grid-header');
            diaEl.textContent = i;
            scheduleGridEl.appendChild(diaEl);
        }

        // 2. Renderiza as linhas das salas e os agendamentos
        dadosSalas.forEach(sala => {
            // Cria a célula com o nome da sala na primeira coluna
            const salaCol = document.createElement('div');
            salaCol.classList.add('sala-col');
            salaCol.textContent = sala.nome_sala;
            scheduleGridEl.appendChild(salaCol);

            // Cria as células para cada dia do mês nesta linha de sala
            for (let i = 1; i <= diasNoMes; i++) {
                const dataDia = new Date(ano, mes, i);
                // Formata a data como YYYY-MM-DD para comparação
                const dataString = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                
                const diaCell = document.createElement('div');
                diaCell.classList.add('schedule-cell');
                diaCell.dataset.salaId = sala.id_salas;
                diaCell.dataset.data = dataString;

                // Filtra e renderiza o agendamento para este dia e sala
                const agendamentoDia = agendamentos.find(a => 
                    a.id_salas == sala.id_salas && a.data_aula === dataString
                );
                
                if (agendamentoDia) {
                    const agendamentoEl = document.createElement('div');
                    agendamentoEl.classList.add('agendamento');
                    // Simplificando a exibição para caber melhor na célula
                    agendamentoEl.innerHTML = `
                        <strong>${agendamentoDia.nome_curso}</strong>
                        <span>${agendamentoDia.instrutor || 'A definir'}</span>
                    `;
                    agendamentoEl.dataset.turmaId = agendamentoDia.id_turmas;
                    agendamentoEl.style.backgroundColor = getStatusColor(agendamentoDia.status);
                    
                    // Adiciona o listener para abrir o modal de detalhes
                    agendamentoEl.addEventListener('click', (e) => {
                        e.stopPropagation(); // Impede que o clique na célula também seja acionado
                        abrirModalDetalhes(agendamentoDia);
                    });
                    
                    diaCell.appendChild(agendamentoEl);
                } else {
                    // Adiciona o listener para o agendamento de novas turmas em células vazias
                    diaCell.addEventListener('click', () => {
                        // Passando também o nome da sala e a data formatada para o modal
                        abrirModalAgendamento(sala.id_salas, sala.nome_sala, dataString);
                    });
                }
                
                scheduleGridEl.appendChild(diaCell);
            }
        });
    }

    // Também precisamos ajustar a função que abre o modal de agendamento
    function abrirModalAgendamento(salaId, salaNome, data) {
        agendamentoForm.reset(); // Limpa o formulário
        agendamentoSalaIdInput.value = salaId;
        dataInicioInput.value = data;
        
        // Exibe o nome da sala e a data no título ou em um parágrafo
        document.getElementById('agendamento-info').textContent = `Agendando para a sala "${salaNome}" no dia ${formatarData(data)}.`;

        abrirModal(agendamentoModal);
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Planejada':
                return '#A9D0F5'; // Azul claro
            case 'Em Andamento':
                return '#81F781'; // Verde claro
            case 'Concluída':
                return '#D8D8D8'; // Cinza claro
            case 'Cancelada':
                return '#F5A9A9'; // Vermelho claro
            default:
                return '#D8D8D8';
        }
    }

    // --- 4. FUNÇÕES DE INTERAÇÃO COM A API ---

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro de rede ao buscar dados de ${url}.`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro:', error);
            alert(`Falha ao carregar os dados. Verifique a conexão com o servidor e a rota da API.`);
            return [];
        }
    }

    async function fetchDadosIniciais() {
        try {
            // Busca dados de todas as APIs
            dadosCursos = await fetchData('controllers/get_cursos.php');
            dadosSalas = await fetchData('controllers/get_sala.php');
            agendamentos = await fetchData('controllers/get_agendamentos.php');
            dadosInstrutores = await fetchData('controllers/get_instrutores.php');

            // Popular select de cursos
            cursoSelect.innerHTML = dadosCursos.map(curso => `<option value="${curso.id_cursos}">${curso.nome_curso}</option>`).join('');

            // Popular datalist de instrutores
            instrutoresList.innerHTML = dadosInstrutores.map(instrutor => `<option value="${instrutor.nome_instrutor}">`).join('');
            detalhesInstrutoresList.innerHTML = instrutoresList.innerHTML; // Reutiliza para o modal de detalhes

            renderizarMes();
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    async function agendarNovaTurma(dados) {
        try {
            const response = await fetch('controllers/agendar_turma.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const resultado = await response.json();
            if (response.ok) {
                alert(resultado.message);
                fecharModal(agendamentoModal);
                await fetchDadosIniciais(); // Recarrega os dados para atualizar a grade
            } else {
                alert(`Erro: ${resultado.error}`);
            }
        } catch (error) {
            console.error('Erro ao agendar turma:', error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        }
    }

    async function gerenciarTurma(turmaId, dados) {
        try {
            // O backend espera o nome do instrutor para fazer a busca do ID.
            const dadosApi = {
                turmaId: turmaId,
                status: dados.status,
                instrutorNome: dados.instrutorNome // Enviando o nome diretamente
            };

            const response = await fetch('controllers/gerenciar_turma.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosApi)
            });

            const resultado = await response.json();
            if (response.ok) {
                alert(resultado.message);
                fecharModal(detalhesModal);
                await fetchDadosIniciais(); // Recarrega os dados para atualizar a grade
            } else {
                alert(`Erro: ${resultado.error}`);
            }
        } catch (error) {
            console.error('Erro ao gerenciar turma:', error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        }
    }

    // --- 5. FUNÇÕES DE CONTROLE DE MODAL ---
    function abrirModal(modal) {
        modal.style.display = 'block';
    }

    function fecharModal(modal) {
        modal.style.display = 'none';
    }

    function abrirModalAgendamento(salaId, salaNome, data) {
        agendamentoForm.reset(); 

        // Linhas importantes: Preenchem os dados da célula clicada no formulário
        agendamentoSalaIdInput.value = salaId;
        dataInicioInput.value = data;

        // Exibe uma mensagem útil para o usuário no modal
        const infoEl = document.getElementById('agendamento-info');
        if(infoEl) {
            infoEl.textContent = `Agendando para a sala "${salaNome}" no dia ${formatarData(data)}.`;
        }

        abrirModal(agendamentoModal);
    }

    function abrirModalDetalhes(agendamento) {
        detalhesTurmaId.value = agendamento.id_turmas;
        detalhesCursoNome.textContent = agendamento.nome_curso;
        detalhesInstrutorInput.value = agendamento.instrutor;
        detalhesStatusSelect.value = agendamento.status;
        document.getElementById('detalhes-codigo').textContent = agendamento.codigo_turma || 'N/A';
        document.getElementById('detalhes-total-alunos').textContent = agendamento.total_alunos;
        document.getElementById('detalhes-sala').textContent = agendamento.nome_sala;
        document.getElementById('detalhes-turno').textContent = agendamento.turno;

        abrirModal(detalhesModal);
    }

    // --- 6. LISTENERS DE EVENTOS ---
    prevMonthBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        renderizarMes();
    });

    nextMonthBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        renderizarMes();
    });

    addTurmaBtn.addEventListener('click', () => {
        agendamentoForm.reset();
        abrirModal(agendamentoModal);
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            fecharModal(event.target.closest('.modal'));
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === agendamentoModal) {
            fecharModal(agendamentoModal);
        }
        if (event.target === detalhesModal) {
            fecharModal(detalhesModal);
        }
    });

    // Listener para o formulário de agendamento
    agendamentoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 1. Coleta os dados do formulário
        const cursoSelect = document.getElementById('curso-select');
        const dataInicioInput = document.getElementById('data-inicio');
        const totalAlunosInput = document.getElementById('total-alunos');
        const turnoSelect = document.getElementById('turno-select-agendamento');
        
        // NOVO: Captura o ID da sala, que é armazenado em um input hidden
        const agendamentoSalaIdInput = document.getElementById('agendamento-sala-id');

        // 2. Validação básica no front-end
        if (!cursoSelect.value || !dataInicioInput.value || !totalAlunosInput.value || !agendamentoSalaIdInput.value || !turnoSelect.value) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const dadosAgendamento = {
            cursoId: parseInt(cursoSelect.value),
            instrutorNome: instrutorSelect.value, // Mantém este campo, mesmo que vazio
            dataInicio: dataInicioInput.value,
            totalAlunos: parseInt(totalAlunosInput.value),
            salaId: parseInt(agendamentoSalaIdInput.value), // Garante que o ID da sala está no objeto de dados
            turno: turnoSelect.value
        };

        // 3. Envia os dados para o backend
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

    agendamentoForm.addEventListener('submit', async (event) => {
        // 1. Previne o comportamento padrão
        event.preventDefault();

        // 2. Coleta os dados do formulário
        const dadosAgendamento = {
            cursoId: parseInt(cursoSelect.value),
            instrutorNome: instrutorSelect.value,
            dataInicio: dataInicioInput.value,
            totalAlunos: parseInt(totalAlunosInput.value),
            salaId: parseInt(agendamentoSalaIdInput.value),
            turno: turnoSelect.value
        };

        // 3. Validação final para garantir que o agendamento manual tem uma sala
        if (!dadosAgendamento.salaId) {
            alert("Por favor, selecione uma sala para agendamento manual ou use a opção de Alocação Automática.");
            return; // Impede o envio se não houver sala
        }

        // 4. Envia os dados para o backend (Lógica existente)
        await agendarNovaTurma(dadosAgendamento);
    });

    // A função de envio para o botão de alocação automática
    alocacaoAutomaticaBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        const dadosAgendamento = {
            cursoId: parseInt(cursoSelect.value),
            dataInicio: dataInicioInput.value,
            totalAlunos: parseInt(totalAlunosInput.value),
            turno: turnoSelect.value,
        };

        try {
            const response = await fetch('./controllers/alocar_turma_automatica.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAgendamento)
            });

            const resultado = await response.json();

            if (response.ok) {
                if (resultado.salaId) {
                    // Caso 1: Sala única encontrada
                    const salaIdEncontrada = resultado.salaId;
                    agendamentoSalaIdInput.value = salaIdEncontrada;
                    alert(`Sala única encontrada: ${resultado.nome_sala}. Clique em Agendar para continuar.`);

                } else if (resultado.salas) {
                    // Caso 2: Combinação de salas (Divisão) encontrada
                    const salas = resultado.salas;
                    const salaIds = salas.map(s => s.id_salas);
                    const nomesSalas = salas.map(s => s.nome_sala).join(' e ');
                    
                    // Exibe as salas encontradas e prepara o formulário para agendamento
                    agendamentoSalaIdInput.value = salaIds.join(','); // Usa vírgula para separar IDs
                    alert(`Combinação de salas encontrada: ${nomesSalas}. Clique em Agendar para continuar.`);
                } else {
                    alert('Ocorreu um erro desconhecido na alocação.');
                }
                
            } else {
                // Exibe o erro retornado pelo servidor
                alert(`Erro na alocação automática: ${resultado.error}`);
            }
        } catch (error) {
            console.error('Erro ao fazer a requisição de alocação automática:', error);
            alert('Ocorreu um erro ao tentar alocar a turma automaticamente.');
        }
    });

    cancelarTurmaBtn.addEventListener('click', async () => {
        const confirmacao = confirm("Tem certeza que deseja CANCELAR esta turma? Esta ação não pode ser desfeita.");
        if (confirmacao) {
            const dadosCancelamento = {
                turmaId: detalhesTurmaId.value,
                instrutorNome: detalhesInstrutorInput.value, // Mantém o campo para a função gerenciarTurma
                status: 'Cancelada'
            };
            await gerenciarTurma(detalhesTurmaId.value, dadosCancelamento);
        }
    });
    
    // --- 7. INICIALIZAÇÃO ---
    fetchDadosIniciais();
});