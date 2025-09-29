/**
 * public/js/detalheTurma.js
 * Lógica para o modal de Detalhes da Turma e ações de atualização (Status, Instrutor).
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM
    const detalhesForm = document.getElementById('detalhes-form');
    const turmaIdInput = document.getElementById('detalhes-turma');
    const statusSelect = document.getElementById('detalhes-status-select');
    const instrutorSelect = document.getElementById('detalhes-instrutor');
    const cancelarTurmaBtn = document.getElementById('cancelar-turma-btn');
    let remarcarBtn = document.getElementById('remarcar-turma-btn');
    const salvarDetalhesBtn = detalhesForm.querySelector('button[type="submit"]');

    if (!remarcarBtn) {
        SGST.Utils.log('DOM_WARN', "Botão de Remarcar Turma não encontrado. Criando placeholder.");
        const tempBtn = document.createElement('button');
        tempBtn.id = 'remarcar-turma-btn';
        remarcarBtn = tempBtn;
    }

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE SUBMISSÃO
     * -----------------------------------------------------
     */
    
    /**
     * Lida com a submissão para atualizar o status e/ou instrutor.
     */
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        
        const turmaId = turmaIdInput.value;
        const novoStatus = statusSelect.value;
        const novoInstrutorId = instrutorSelect.value ? parseInt(instrutorSelect.value) : null;

        if (!turmaId || !novoStatus) {
            SGST.Utils.showToast('ID da Turma e Status são obrigatórios.', 'error');
            return;
        }

        const payload = {
            turmaId: parseInt(turmaId),
            status: novoStatus,
            instrutorId: novoInstrutorId
        };
        
        SGST.Utils.toggleLoading(true);
        try {
            // Atualiza o status/instrutor (POST gerenciar_turma.php)
            const response = await API.atualizarStatusTurma(payload);
            
            SGST.Utils.showToast(response.message || 'Turma atualizada com sucesso!', 'success');
            SGST.closeModal(SGST.Modals.Elements.detalhes);
            SGST.Painel.loadAllDataAndRender(); // Recarrega o calendário

        } catch (error) {
            SGST.Utils.showToast(`Falha ao atualizar turma: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
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
     
    SGST.DetalheTurma = {
        init: () => {
            // Preenche o SELECT de instrutores
            if (SGST.dadosInstrutores && SGST.dadosInstrutores.length > 0) {
                 SGST.Utils.populateSelect('#detalhes-instrutor', SGST.dadosInstrutores, 'id_instrutores', 'nome_instrutor', 'Manter Atual');
            } else {
                 SGST.Agendamento.loadFormOptions(); // Garante que os instrutores sejam carregados
            }

            // Listener para o formulário de atualização
            detalhesForm.addEventListener('submit', handleUpdateStatus);
            
            // Listener para os botões de ação
            cancelarTurmaBtn.addEventListener('click', handleCancelamento);
            remarcarBtn.addEventListener('click', handleRemarcar);
            
            SGST.Utils.log('DETALHES_INIT', 'Detalhes da Turma listeners inicializados.');
        }
    };

})();