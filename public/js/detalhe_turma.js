/**
 * public/js/detalheTurma.js
 * Lógica para o modal de Detalhes da Turma e ações de atualização (Status, Instrutor).
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM (Adaptados ao index.php)
    const detalhesForm = document.getElementById('detalhes-form');
    const turmaIdInput = document.getElementById('detalhes-turma-id'); // CORRIGIDO: id="detalhes-turma-id"
    const turmaCodigoDisplay = document.getElementById('detalhes-turma-codigo');
    const turmaCursoDisplay = document.getElementById('detalhes-turma-curso');
    const statusSelect = document.getElementById('detalhes-status-select');
    const instrutorSelect = document.getElementById('detalhes-instrutor');
    
    // Adicione os botões de ação que devem existir no modal (se ausentes, a inicialização falhará)
    const cancelarTurmaBtn = detalhesForm.querySelector('#cancelar-turma-btn') || document.createElement('button'); 
    const salvarDetalhesBtn = detalhesForm.querySelector('button[type="submit"]') || document.createElement('button');
    let remarcarBtn = detalhesForm.querySelector('#remarcar-turma-btn') || document.createElement('button');


    /**
     * Preenche o modal de detalhes com os dados da turma selecionada.
     * @param {object} agendamentoData - Dados completos de um registro de agendamento.
     */
    const populateDetalhesModal = (agendamentoData) => {
        
        // 1. Preenchimento de Campos de Display
        turmaIdInput.value = agendamentoData.id_turmas; 
        turmaCodigoDisplay.textContent = agendamentoData.codigo_turma || `ID: ${agendamentoData.id_turmas}`;
        turmaCursoDisplay.textContent = `${agendamentoData.nome_curso} (${agendamentoData.total_alunos} alunos, ${agendamentoData.turno})`;
        
        // 2. Preenchimento do Status (STRING)
        statusSelect.value = agendamentoData.status; 
        
        // 3. Preenchimento do Instrutor
        const instrutorAtual = agendamentoData.instrutor || 'Manter Atual';
        const instrutorObj = (SGST.dadosInstrutores || []).find(i => i.nome_instrutor === instrutorAtual);
        
        if (instrutorObj) {
            instrutorSelect.value = instrutorObj.id_instrutores;
        } else {
            instrutorSelect.value = 'null'; // Ou a opção 'Manter Atual' / 'Sem Instrutor'
        }
        
        SGST.openModal(SGST.Modals.Elements.detalhes);
    };

    /**
     * Lida com a submissão para atualizar o status e/ou instrutor (POST gerenciar_turma.php).
     */
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        SGST.Utils.toggleLoading(true, salvarDetalhesBtn);
        
        try {
            const turmaId = parseInt(turmaIdInput.value);
            const novoStatus = statusSelect.value; 
            const novoInstrutorId = instrutorSelect.value !== 'null' ? parseInt(instrutorSelect.value) : null;
            
            if (turmaId <= 0 || !novoStatus) {
                SGST.Utils.showToast('Dados de turma ou status inválidos.', 'error');
                return;
            }

            const payload = {
                turmaId: turmaId,
                status: novoStatus, // STRING
                instrutorId: novoInstrutorId
            };

            await API.atualizarStatusTurma(payload);
            
            SGST.Utils.showToast('Turma atualizada com sucesso!', 'success');
            SGST.closeModal(SGST.Modals.Elements.detalhes);
            SGST.Painel.loadAllDataAndRender(); // Recarrega o painel
            
        } catch (error) {
             SGST.Utils.showToast(`Falha na atualização: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false, salvarDetalhesBtn);
        }
    };
    
    /**
     * Lida com o cancelamento da turma (apenas muda o status para 'Cancelada').
     */
    const handleCancelamento = async () => {
        if (!confirm('Tem certeza que deseja CANCELAR esta turma? Isso excluirá todos os agendamentos de aulas.')) return;
        
        turmaIdInput.value = turmaIdInput.value || document.getElementById('detalhes-turma').value;
        if (!turmaIdInput.value) {
            SGST.Utils.showToast('ID da Turma não encontrado para cancelamento.', 'error');
            return;
        }
        
        // Simula a seleção de 'Cancelada' e chama o handler de submissão
        statusSelect.value = 'Cancelada';
        await handleUpdateStatus({ preventDefault: () => {} });
    };

    /**
     * Lida com a remarcação da turma.
     */
    const handleRemarcar = () => {
        // Lógica de remarcação: Abrir o modal de agendamento com os dados pré-preenchidos (ou copiar)
        // Por ser complexo e envolver limpeza de agendamentos, apenas mostramos uma mensagem de info.
        SGST.Utils.showToast('Funcionalidade de Remarcação: Envie os dados para um novo agendamento, ajustando a data de início.', 'info');
        SGST.closeModal(SGST.Modals.Elements.detalhes);
        // Aqui, poderíamos abrir o modal de agendamento e pré-popular com os dados da turma
    };
    
    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */
     
    // Mapeia a função de preenchimento para ser chamada pelo Painel (painel.js)
    SGST.Painel = SGST.Painel || {};
    SGST.Painel.loadDetalhesTurma = populateDetalhesModal;

    SGST.DetalheTurma = {
        init: () => {
            // Preenche o SELECT de instrutores (usa dados globais)
            SGST.Utils.populateSelect('#detalhes-instrutor', SGST.dadosInstrutores || [], 'id_instrutores', 'nome_instrutor', 'Manter Atual');
            
            // Listener para o formulário de atualização
            detalhesForm.addEventListener('submit', handleUpdateStatus);
            
            // Listener para os botões de ação
            cancelarTurmaBtn.addEventListener('click', handleCancelamento);
            remarcarBtn.addEventListener('click', handleRemarcar);
            
            SGST.Utils.log('DETALHES_INIT', 'Detalhes da Turma listeners inicializados.');
        }
    };

})();