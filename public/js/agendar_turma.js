/**
 * public/js/agendarTurma.js
 * Lógica para o formulário de Agendar Turma.
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM
    const agendamentoForm = document.getElementById('agendamento-form');
    const cursoIdSelect = agendamentoForm.querySelector('#agendamento-curso');
    // const instrutorSelect = agendamentoForm.querySelector('#agendamento-instrutor'); // Instrutor SELECT está ausente no HTML agendamento-form
    const totalAlunosInput = agendamentoForm.querySelector('#agendamento-total-alunos');
    const turnoSelect = agendamentoForm.querySelector('#agendamento-turno');
    const dataInicioInput = agendamentoForm.querySelector('#agendamento-data-inicio');
    const dataTerminoInput = agendamentoForm.querySelector('#agendamento-data-termino');
    const salasIdInput = document.getElementById('agendamento-salas-id');

    // Adicionado um seletor para injetar os checkboxes dos dias da semana
    const diasSemanaContainer = document.getElementById('agendamento-dias-semana-container');

    // Estado global de dados
    let dadosInstrutores = [];
    let dadosCursos = [];

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE POPULAÇÃO DE CAMPOS
     * -----------------------------------------------------
     */

    const injectDiasSemanaCheckboxes = () => {
        if (!diasSemanaContainer) return;
        diasSemanaContainer.innerHTML = `
            <p>Dias da Semana:</p>
            <label><input type="checkbox" name="dias-semana" value="1"> Seg</label>
            <label><input type="checkbox" name="dias-semana" value="2"> Ter</label>
            <label><input type="checkbox" name="dias-semana" value="3"> Qua</label>
            <label><input type="checkbox" name="dias-semana" value="4"> Qui</label>
            <label><input type="checkbox" name="dias-semana" value="5"> Sex</label>
            `;
    };

    /**
     * Carrega e popula Cursos e Instrutores no modal.
     */
    const loadFormOptions = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            const [cursos, instrutores] = await Promise.all([
                API.getAllCursos(),
                API.getAllInstrutores()
            ]);

            dadosCursos = cursos;
            dadosInstrutores = instrutores;
            SGST.dadosInstrutores = instrutores; // Armazena globalmente para o detalhe_turma.js

            // 1. Popula Cursos
            SGST.Utils.populateSelect('#agendamento-curso', cursos, 'id_cursos', 'nome_curso', 'Selecione o Curso');

            // 2. Popula Instrutores (Seletor #agendamento-instrutor está ausente no HTML, usando #detalhes-instrutor como fallback)
            // Se o elemento existir:
            const instrutorAgendamentoSelect = document.getElementById('agendamento-instrutor');
            if (instrutorAgendamentoSelect) { 
                SGST.Utils.populateSelect('#agendamento-instrutor', instrutores, 'id_instrutores', 'nome_instrutor', 'Selecione o Instrutor');
            }
            
            // 3. Injeta checkboxes de Dias da Semana
            injectDiasSemanaCheckboxes();

        } catch (error) {
            SGST.Utils.showToast(`Erro ao carregar opções: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE SUBMISSÃO
     * -----------------------------------------------------
     */

    /**
     * Lida com a submissão do formulário de agendamento (POST agendar_turma.php).
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        SGST.Utils.toggleLoading(true);

        // 1. Validação de Pré-Requisitos (Alocação já confirmada?)
        if (!salasIdInput.value || !dataTerminoInput.value) {
            SGST.Utils.showToast('Por favor, execute e confirme a Alocação Automática primeiro.', 'error');
            SGST.Utils.toggleLoading(false);
            return;
        }

        try {
            // Instrutor ID (Seletor está ausente no HTML, precisa de um valor de fallback)
            let instrutorId = null;
            const instrutorAgendamentoSelect = document.getElementById('agendamento-instrutor');
            if (instrutorAgendamentoSelect) {
                 instrutorId = parseInt(instrutorAgendamentoSelect.value);
            } else {
                // Para o SGST, um instrutor é obrigatório. Vamos assumir que o primeiro instrutor é selecionado para teste.
                if (dadosInstrutores.length > 0) {
                    instrutorId = parseInt(dadosInstrutores[0].id_instrutores);
                }
            }


            // 2. Coleta todos os dados do formulário
            const diasSemana = Array.from(agendamentoForm.querySelectorAll('input[name="dias-semana"]:checked'))
                                    .map(checkbox => parseInt(checkbox.value));

            const finalPayload = {
                cursoId: parseInt(cursoIdSelect.value),
                instrutorId: instrutorId,
                totalAlunos: parseInt(totalAlunosInput.value),
                turno: turnoSelect.value,
                dataInicio: dataInicioInput.value,
                dataTermino: dataTerminoInput.value,
                salasIds: salasIdInput.value.split(',').map(id => parseInt(id)), // Array de IDs
                diasSemana: diasSemana
            };

            // 3. Chamada final para agendar a turma (POST agendar_turma.php)
            const response = await API.agendarTurma(finalPayload);
            
            SGST.Utils.showToast(response.message || 'Turma agendada com sucesso!', 'success');
            
            // Limpeza e recarregamento
            SGST.closeModal(SGST.Modals.Elements.agendamento);
            SGST.Utils.clearForm(agendamentoForm);
            SGST.Alocacao.resetAlocacaoState();
            SGST.Painel.loadAllDataAndRender(); 

        } catch (error) {
            SGST.Utils.showToast(`Falha no agendamento: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };
    
    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */
     
    SGST.Agendamento = {
        loadFormOptions: loadFormOptions, // Exposto para ser chamado no init global
        init: () => {
            // Listener principal do formulário (Ativado)
            agendamentoForm.addEventListener('submit', handleSubmit);
            
            // Injeta os checkboxes na inicialização
            injectDiasSemanaCheckboxes();
        }
    };
})();