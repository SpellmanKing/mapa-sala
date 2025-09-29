/**
 * public/js/alocacaoAutomatica.js
 * Lógica para o processo de Alocação Automática de Salas e Confirmação.
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM
    const agendamentoForm = document.getElementById('agendamento-form');
    const alocarBtn = document.getElementById('alocar-sala-btn');
    const agendamentoSalasDisplay = document.getElementById('agendamento-salas-display');
    const agendamentoSalasIdInput = document.getElementById('agendamento-salas-id');
    
    // Elementos do Modal de Alocação
    const alocacaoModal = document.getElementById('alocacao-modal');
    const confirmarAlocacaoBtn = alocacaoModal.querySelector('#confirmar-alocacao-btn');
    const cancelarAlocacaoBtn = alocacaoModal.querySelector('#cancelar-alocacao-btn');
    
    // Variável para armazenar os dados de alocação sugeridos
    let sugestaoAlocacaoData = null;

    /**
     * -----------------------------------------------------\
     * FUNÇÕES DE ALOCAÇÃO
     * -----------------------------------------------------\
     */

    /**
     * Valida os campos necessários para a alocação e monta o payload.
     * @returns {object|null} - Payload para a API ou null se a validação falhar.
     */
    const getAlocacaoPayload = () => {
        // IDs dos campos no formulário de agendamento
        const cursoId = agendamentoForm.querySelector('#agendamento-curso').value;
        const totalAlunos = agendamentoForm.querySelector('#agendamento-total-alunos').value;
        const turno = agendamentoForm.querySelector('#agendamento-turno').value;
        const dataInicio = agendamentoForm.querySelector('#agendamento-data-inicio').value;
        
        // Assume que os dias da semana são checkboxes com value=dia_numero
        const diasSemana = Array.from(agendamentoForm.querySelectorAll('#agendamento-dias-semana input[type="checkbox"]:checked'))
                               .map(cb => parseInt(cb.value));

        if (!cursoId || !totalAlunos || !turno || !dataInicio || diasSemana.length === 0) {
            SGST.Utils.showToast('Por favor, preencha o Curso, Total de Alunos, Turno, Data de Início e Dias da Semana.', 'warning');
            return null;
        }

        return { cursoId: parseInt(cursoId), totalAlunos: parseInt(totalAlunos), turno, diasSemana, dataInicio };
    };

    /**
     * Busca a sugestão de alocação no backend.
     */
    const buscarAlocacao = async () => {
        const payload = getAlocacaoPayload();
        if (!payload) return;
        
        // Reseta o estado da alocação antes de buscar
        resetAlocacaoState();

        SGST.Utils.toggleLoading(true);
        try {
            const response = await API.alocarTurma(payload); // POST alocar_turma.php
            
            // Verifica se a resposta contém a estrutura esperada
            if (response && response.salas && response.salas.length > 0) {
                
                // Armazena os dados da sugestão em uma variável de escopo
                sugestaoAlocacaoData = {
                    ...payload,
                    salas: response.salas,
                    dataTermino: response.dataTermino, // Adicionado dataTermino, que vem do cálculo do cronograma
                    // Adiciona outros dados necessários do agendamento (Instrutor não é necessário na alocação)
                    instrutorId: agendamentoForm.querySelector('#agendamento-instrutor').value // Pega o instrutor para o agendamento futuro
                };
                
                // Exibe o modal de confirmação (novo comportamento)
                renderizarModalAlocacao(sugestaoAlocacaoData);
                SGST.openModal(SGST.Modals.Elements.alocacao);
                
            } else {
                SGST.Utils.showToast(response.error || 'Não foi possível encontrar uma sala que atenda aos requisitos.', 'error');
            }

        } catch (error) {
            SGST.Utils.showToast(`Falha na alocação: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };
    
    /**
     * Popula o modal de sugestão de alocação com os dados.
     */
    const renderizarModalAlocacao = (data) => {
        if (!data || !data.salas) return;
        
        const cursoNome = SGST.dadosCursos.find(c => c.id_cursos === data.cursoId)?.nome_curso || 'N/A';
        const salasNomes = data.salas.map(s => `${s.nome_sala} (Capacidade: ${s.capacidade_maxima})`).join('<br>');
        const salasIds = data.salas.map(s => s.id_salas).join(',');

        // 1. Popula os campos visíveis de confirmação
        document.getElementById('alocacao-curso-nome').textContent = cursoNome;
        document.getElementById('alocacao-data-inicio').textContent = SGST.Utils.formatDate(data.dataInicio);
        document.getElementById('alocacao-data-termino').textContent = SGST.Utils.formatDate(data.dataTermino);
        document.getElementById('alocacao-salas-sugeridas').innerHTML = salasNomes;
        
        // 2. Popula os campos hidden para o POST final
        document.getElementById('alocacao-curso-id').value = data.cursoId;
        document.getElementById('alocacao-total-alunos').value = data.totalAlunos;
        document.getElementById('alocacao-turno').value = data.turno;
        document.getElementById('alocacao-salas-id').value = salasIds; // ID(s) da(s) sala(s)
        document.getElementById('alocacao-dias-semana').value = data.diasSemana.join(',');
        
        // Define o instrutorId no payload final, garantindo que foi pego no formulário de agendamento
        document.getElementById('alocacao-instrutor-id').value = data.instrutorId;
        
    };

    /**
     * Confirma a sugestão de alocação e agenda a turma.
     */
    const handleConfirmarAlocacao = async (e) => {
        e.preventDefault();

        if (!sugestaoAlocacaoData) {
            SGST.Utils.showToast('Não há sugestão de alocação para confirmar.', 'warning');
            return;
        }
        
        // Garante que o instrutorId seja um número ou null
        const instrutorId = parseInt(sugestaoAlocacaoData.instrutorId) || null;
        
        if (!instrutorId) {
             SGST.Utils.showToast('É necessário selecionar um instrutor antes de confirmar o agendamento.', 'warning');
             return;
        }

        const finalPayload = {
            cursoId: sugestaoAlocacaoData.cursoId,
            instrutorId: instrutorId,
            dataInicio: sugestaoAlocacaoData.dataInicio,
            dataTermino: sugestaoAlocacaoData.dataTermino,
            totalAlunos: sugestaoAlocacaoData.totalAlunos,
            turno: sugestaoAlocacaoData.turno,
            salasIds: sugestaoAlocacaoData.salas.map(s => s.id_salas), // Array de IDs de salas
            diasSemana: sugestaoAlocacaoData.diasSemana, // Array de números dos dias da semana
        };
        
        SGST.Utils.toggleLoading(true);
        try {
            // Chamada final para agendar a turma (POST agendar_turma.php)
            const response = await API.agendarTurma(finalPayload);
            
            SGST.Utils.showToast(response.message || 'Turma agendada com sucesso!', 'success');
            
            // Fecha o modal de alocação (e o de agendamento, se necessário)
            SGST.closeModal(SGST.Modals.Elements.alocacao);
            SGST.closeModal(SGST.Modals.Elements.agendamento);
            
            SGST.Utils.clearForm(agendamentoForm);
            resetAlocacaoState();
            
            // Recarrega o Painel Visual
            SGST.Painel.loadAllDataAndRender(); 

        } catch (error) {
            // Se o erro foi capturado, ele já é um objeto de erro com a mensagem do servidor
            SGST.Utils.showToast(`Falha no agendamento: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };
    
    /**
     * Reseta o estado da alocação e o display no formulário de agendamento.
     */
    const resetAlocacaoState = () => {
        sugestaoAlocacaoData = null;
        agendamentoSalasIdInput.value = '';
        agendamentoSalasDisplay.value = ''; // Limpa o campo principal
        
        // Remove qualquer informação extra exibida no form principal (se houver)
        const infoDisplay = agendamentoForm.querySelector('#salas-alocadas-info');
        if(infoDisplay) infoDisplay.innerHTML = '<p class="info-text">Nenhuma sala alocada. Use o botão para alocação automática.</p>';
        
        // Limpa a data de término (se for exibida no formulário de agendamento)
        const dataTerminoInput = agendamentoForm.querySelector('#agendamento-data-termino');
        if (dataTerminoInput) {
            dataTerminoInput.value = '';
        }
    };

    /**
     * -----------------------------------------------------\
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------\
     */
    
    SGST.Alocacao = {
        resetAlocacaoState: resetAlocacaoState,
        init: () => {
            // Listener principal do botão de alocar sala
            alocarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                buscarAlocacao();
            });
            
            // Listener para o botão de confirmar alocação no modal
            confirmarAlocacaoBtn.addEventListener('click', handleConfirmarAlocacao);
            
            // Listener para o botão de cancelar alocação no modal
            cancelarAlocacaoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                SGST.closeModal(SGST.Modals.Elements.alocacao);
            });

            // Inicializa o estado do display
            resetAlocacaoState();
            
            SGST.Utils.log('ALOCACAO_INIT', 'Alocação Automática listeners inicializados.');
        }
    };

})();