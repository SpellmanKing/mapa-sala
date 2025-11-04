/**
 * public/js/alocacao_automatica.js
 * Lógica para o processo de Alocação Automática de Salas e Confirmação.
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM (Adaptados ao index.php)
    const agendamentoForm = document.getElementById('agendamento-form');
    const alocarBtn = document.getElementById('alocar-sala-btn');
    const agendamentoSalasDisplay = document.getElementById('agendamento-salas-display');
    const agendamentoSalasIdInput = document.getElementById('agendamento-salas-id');
    const agendamentoDataTerminoInput = document.getElementById('agendamento-data-termino');
    
    // Elementos do Modal de Alocação
    const alocacaoModal = document.getElementById('alocacao-modal');
    const alocacaoResultadoDisplay = document.getElementById('alocacao-resultado-display'); // OK
    const confirmarAlocacaoBtn = alocacaoModal.querySelector('#confirmar-alocacao-btn');
    const cancelarAlocacaoBtn = alocacaoModal.querySelector('#cancelar-alocacao-btn');
    
    // Variável para armazenar os dados de alocação sugeridos (estado central)
    let sugestaoAlocacaoData = null;

    /**
     * Valida os campos necessários para a alocação e monta o payload.
     */
    const getAlocacaoPayload = () => {
        const cursoId = agendamentoForm.querySelector('#agendamento-curso').value;
        const totalAlunos = agendamentoForm.querySelector('#agendamento-total-alunos').value;
        const turno = agendamentoForm.querySelector('#agendamento-turno').value; // String ('Manhã', 'Tarde', etc.)
        const dataInicio = agendamentoForm.querySelector('#agendamento-data-inicio').value;
        
        // Dias da Semana (Array de números 1 a 7)
        const diasSemana = Array.from(agendamentoForm.querySelectorAll('input[name="dias-semana"]:checked'))
                                .map(checkbox => parseInt(checkbox.value));

        if (!cursoId || !totalAlunos || !turno || !dataInicio || diasSemana.length === 0) {
            SGST.Utils.showToast('Preencha Curso, Alunos, Turno, Data de Início e Dias da Semana.', 'error');
            return null;
        }

        return {
            cursoId: parseInt(cursoId),
            totalAlunos: parseInt(totalAlunos),
            turno: turno, 
            dataInicio: dataInicio,
            diasSemana: diasSemana
        };
    };

    /**
     * Handler para a resposta da API de alocação automática.
     */
    const handleAlocacaoResponse = (response) => {
        sugestaoAlocacaoData = response;
        
        const salas = response.salas || [];
        const salasNomes = salas.map(s => s.nome_sala).join(' e ');
        const salasIds = salas.map(s => s.id_salas).join(',');

        let resultadoHTML = ``;
        
        if (response.success === true) {
            // Alocação ideal (Melhor Encaixe ou Ocupação Máxima)
            resultadoHTML += `
                <p>✅ **SUCESSO NA ALOCAÇÃO AUTOMÁTICA**</p>
                <p>Sugestão de Sala(s): <strong>${salasNomes}</strong> (${salasIds})</p>
                <p>Previsão de Término: <strong>${SGST.Utils.formatDate(response.dataTermino)}</strong></p>
                <p class="text-info">${response.message}</p>
            `;
            confirmarAlocacaoBtn.disabled = false;
        } else if (response.salas && response.salas.length > 0 && response.message && response.message.includes('Auditório')) {
            // Regra: Auditório (Último Recurso) - RF10
            resultadoHTML += `
                <p>⚠️ **ALOCAÇÃO NÃO-PADRÃO (ÚLTIMO RECURSO)**</p>
                <p>O algoritmo não encontrou o encaixe ideal/compatível.</p>
                <p>Sugestão: <strong>${salasNomes}</strong> (${salasIds})</p>
                <p>Previsão de Término: <strong>${SGST.Utils.formatDate(response.dataTermino)}</strong></p>
                <p class="text-warning">${response.message}</p>
            `;
            confirmarAlocacaoBtn.disabled = false;
        } else {
            // Falha Total (404)
            resultadoHTML += `
                <p>❌ **FALHA NA ALOCAÇÃO**</p>
                <p class="text-danger">${response.error || response.message || 'Não foi possível encontrar uma sala disponível e compatível.'}</p>
            `;
            confirmarAlocacaoBtn.disabled = true;
        }
        
        alocacaoResultadoDisplay.innerHTML = resultadoHTML;
        SGST.openModal(alocacaoModal);
    };

    /**
     * Busca a sugestão de alocação no backend.
     */
    const buscarAlocacao = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            const payload = getAlocacaoPayload();
            if (!payload) return;

            const response = await API.getAlocacaoSugestion(payload); // POST alocar_turma.php
            handleAlocacaoResponse(response);
            
        } catch (error) {
            SGST.Utils.showToast(`Erro ao buscar alocação: ${error.message}`, 'error');
            resetAlocacaoState();
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * Confirma a sugestão, armazena os IDs no formulário principal e fecha o modal.
     */
    const handleConfirmarAlocacao = (e) => {
        e.preventDefault();
        if (!sugestaoAlocacaoData || !sugestaoAlocacaoData.salas) {
            SGST.Utils.showToast('Nenhuma sugestão de sala para confirmar.', 'error');
            return;
        }

        const salasIds = sugestaoAlocacaoData.salas.map(s => s.id_salas).join(',');
        const salasNomes = sugestaoAlocacaoData.salas.map(s => s.nome_sala).join(' e ');

        // 1. Atualiza o input hidden para o agendamento final
        agendamentoSalasIdInput.value = salasIds;

        // 2. Atualiza o display visual do agendamento
        agendamentoSalasDisplay.innerHTML = `<p class="text-success">Alocado em: <strong>${salasNomes}</strong> (${salasIds})</p>`;

        // 3. Atualiza a data de término no formulário principal
        agendamentoDataTerminoInput.value = sugestaoAlocacaoData.dataTermino;
        
        SGST.closeModal(alocacaoModal);
        SGST.Utils.showToast('Sugestão de alocação confirmada!', 'success');
    };

    /**
     * Reseta o estado da alocação e os campos visuais.
     */
    const resetAlocacaoState = () => {
        sugestaoAlocacaoData = null;
        agendamentoSalasIdInput.value = '';
        agendamentoSalasDisplay.innerHTML = '<p class="info-text">Nenhuma sala alocada. Use o botão para alocação automática.</p>';
        if (agendamentoDataTerminoInput) {
            agendamentoDataTerminoInput.value = '';
        }
    };

    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */
    
    SGST.Alocacao = {
        resetAlocacaoState: resetAlocacaoState,
        init: () => {
            alocarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                buscarAlocacao();
            });
            
            confirmarAlocacaoBtn.addEventListener('click', handleConfirmarAlocacao);
            
            cancelarAlocacaoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                SGST.closeModal(alocacaoModal);
            });
            
            // Listener para limpar o estado ao mudar os inputs relevantes
            agendamentoForm.querySelectorAll('#agendamento-curso, #agendamento-total-alunos, #agendamento-turno, #agendamento-data-inicio').forEach(element => {
                 element.addEventListener('change', resetAlocacaoState);
            });
            agendamentoForm.querySelector('#agendamento-dias-semana-container').addEventListener('change', (e) => {
                 if(e.target.name === 'dias-semana') resetAlocacaoState();
            });

            resetAlocacaoState();
        }
    };

})();