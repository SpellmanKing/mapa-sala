// public/js/alocacao_automatica.js

const alocacaoModal = document.getElementById('alocacao-modal');
const confirmarAlocacaoBtn = document.getElementById('confirmar-alocacao-btn');
const cancelarAlocacaoBtn = document.getElementById('cancelar-alocacao-btn');

let dadosTurmaCache = {}; // Armazena dados da turma para uso na confirmação

/**
 * Inicia o processo de busca de salas automáticas e abre o modal de confirmação.
 * @param {object} dados Dados completos da turma (id_curso, data_inicio, data_termino, etc.).
 */
const iniciarBuscaAlocacao = async (dados) => {
    
    // Cache dos dados para uso na confirmação
    dadosTurmaCache = dados; 
    
    // 1. Prepara dados para a API (AlocacaoService)
    const params = {
        curso_id: dados.id_curso,
        data_inicio: dados.data_inicio,
        data_termino: dados.data_termino, // Data de término calculada
        total_alunos: dados.total_alunos,
        dias: dados.dias_semana.join(','), // Converte array para string
        // O turno e instrutor serão usados para a checagem de conflitos no Backend (futuro)
    };

    // 2. Chama o motor de regras do Backend (RF04, RF05, RF10)
    const result = await Api.alocacaoAutomatica(params);

    // Seleciona o elemento que mostra o nome da sala no modal de AGENDAMENTO
    const agendamentoDisplay = document.getElementById('agendamento-salas-display');
    
    // Limpa classes anteriores para evitar duplicidade de cor/estilo
    agendamentoDisplay.classList.remove('highlight-success', 'highlight-danger'); // Supondo que você possa ter uma classe 'danger' para falhas

    if (result.status === 'success') {
        const sala = result.sala_sugerida;
        const dataAlocacao = result.data_alocacao;

        // 1. ATUALIZAÇÃO DO MODAL PRINCIPAL (AGENDAMENTO-MODAL)
        // EXIBE O NOME DA SALA EM VERDE E NEGRITO
        agendamentoDisplay.textContent = `${sala.nome_sala} (Cap.: ${sala.capacidade_maxima})`;
        agendamentoDisplay.classList.add('highlight-success'); // Aplica a cor verde e negrito!
        
        // 2. Preenche o Modal de Confirmação (Alocação-Modal)
        document.getElementById('alocacao-curso-nome').textContent = dados.curso_nome;
        document.getElementById('alocacao-data-inicio').textContent = Utils.formatDate(dados.data_inicio);
        
        // Armazena a data real de término no data-attribute para o envio
        const dataTerminoElement = document.getElementById('alocacao-data-termino');
        dataTerminoElement.textContent = Utils.formatDate(dataAlocacao.ultima_aula);
        dataTerminoElement.dataset.value = dataAlocacao.ultima_aula; // Data bruta para envio

        document.getElementById('alocacao-salas-sugeridas').textContent = `${sala.nome_sala} (Capacidade: ${sala.capacidade_maxima})`;
        
        // 3. Preenche os campos hidden (Essenciais para o Agendamento)
        document.getElementById('alocacao-salas-id').value = sala.id_salas; 
        document.getElementById('alocacao-dias-semana').value = dados.dias_semana.join(','); 
        
        // Exibe o Modal de Confirmação
        document.getElementById('alocacao-modal-title').textContent = "Sugestão de Alocação";
        Utils.showMessage(result.regra_aplicada, 'info');
        openModal('alocacao-modal');
        
    } else {
        // Se a alocação falhar (ex: nenhuma sala atende), alertar e reabrir o modal principal.
        agendamentoDisplay.textContent = `NÃO ENCONTRADA. ${result.message}`;
        agendamentoDisplay.classList.add('highlight-danger'); // destaque em vermelho se falhar
        
        Utils.showMessage(`Alocação falhou: ${result.message}`, 'error');
        // Reabre o modal principal para o usuário ajustar os dados
        openModal('agendamento-modal'); 
    }
};

/**
 * Lida com o clique em "Confirmar Agendamento" no modal de alocação.
 */
confirmarAlocacaoBtn.addEventListener('click', async () => {
    
    // 1. Coleta dados do Cache e dos Inputs Hidden
    const salaID = document.getElementById('alocacao-salas-id').value;
    const dataTermino = document.getElementById('alocacao-data-termino').dataset.value;
    const diasSemana = document.getElementById('alocacao-dias-semana').value;
    
    const dadosCompletos = dadosTurmaCache; 

    const finalData = {
        // Dados da Turma (do cache)
        id_curso: dadosCompletos.id_curso,
        id_instrutor: dadosCompletos.id_instrutor,
        codigo_turma: dadosCompletos.codigo_turma,
        data_inicio: dadosCompletos.data_inicio,
        turno: dadosCompletos.turno,
        total_alunos: dadosCompletos.total_alunos,
        
        // Dados da Alocação (do modal de confirmação)
        id_sala: salaID,
        data_termino: dataTermino, // Data bruta (YYYY-MM-DD)
        dias_semana: diasSemana, // String de dias (ex: "1,3,5")
    };
    
    // 2. Validação final
    if (!finalData.id_sala || !finalData.id_curso || !finalData.data_inicio || !finalData.data_termino) {
        Utils.showMessage("Erro de dados: Informações de Sala ou Datas de Término estão faltando. Recomece o agendamento.", 'error');
        return;
    }
    
    // 3. Submete o agendamento real para o Backend
    const result = await Api.agendarTurma(finalData);

    if (result.status === 'success') {
        Utils.showMessage("🎉 Agendamento Confirmado! A turma foi alocada e registrada.", 'success');
        closeModal('alocacao-modal');
        
        // Limpa o formulário principal
        document.getElementById('agendamento-form')?.reset();
        // Limpa o display da sala
        const agendamentoDisplay = document.getElementById('agendamento-salas-display');
        agendamentoDisplay.textContent = 'N/A';
        agendamentoDisplay.classList.remove('highlight-success', 'highlight-danger');
        
        // Recarregar o painel visual
        if(typeof loadPainelVisual === 'function') {
            loadPainelVisual();
        }
    } else {
        Utils.showMessage(`Falha ao registrar agendamento: ${result.message}`, 'error');
    }
});

// Listener para Cancelar no modal de alocação (apenas fecha o modal e reabre o de agendamento)
cancelarAlocacaoBtn?.addEventListener('click', () => {
    closeModal('alocacao-modal');
    openModal('agendamento-modal'); 
});

// Exporta a função para ser chamada pelo agendar_turma.js
window.iniciarBuscaAlocacao = iniciarBuscaAlocacao;