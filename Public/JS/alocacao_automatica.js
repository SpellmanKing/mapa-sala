// public/js/alocacao_automatica.js

const alocacaoModal = document.getElementById('alocacao-modal');
const confirmarAlocacaoBtn = document.getElementById('confirmar-alocacao-btn');
const alocacaoForm = document.getElementById('agendamento-form');

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
        data_termino: dados.data_termino, // Necessário apenas para checagem de conflito (futuro)
        total_alunos: dados.total_alunos,
        dias: dados.dias_semana.join(','),
        // O turno e instrutor serão usados para a checagem de conflitos no Backend (futuro)
    };

    // 2. Chama o motor de regras do Backend  4, RF05, RF10)
    const result = await Api.alocacaoAutomatica(params);
    
    if (result.status === 'success') {
        const sala = result.sala_sugerida;
        
        // 3. Atualiza os Modais com os dados sugeridos
        
        // Modal de Agendamento original (para visualização do usuário)
        document.getElementById('agendamento-salas-display').value = `${sala.nome_sala} (Cap. ${sala.capacidade_maxima})`;
        document.getElementById('agendamento-salas-id').value = sala.id_salas;
        
        // Modal de Confirmação (Alocação Automática)
        document.getElementById('alocacao-modal-title').textContent = `Sugestão: ${sala.nome_sala}`;
        document.getElementById('alocacao-curso-nome').textContent = `${dados.curso_nome} (${dados.total_alunos} Alunos)`;
        document.getElementById('alocacao-data-inicio').textContent = Utils.formatDate(dados.data_inicio);
        document.getElementById('alocacao-data-termino').textContent = Utils.formatDate(dados.data_termino);
        document.getElementById('alocacao-salas-sugeridas').innerHTML = `
            <strong>${sala.nome_sala}</strong> (Tipo: ${sala.nome_tipo ?? 'N/A'}, Capacidade: ${sala.capacidade_maxima})
            <br>
            <span style="color: green; font-size: 0.9em;">Regra Aplicada: ${result.regra_aplicada}</span>
        `;
        
        // Preenche campos escondidos para a submissão final
        document.getElementById('alocacao-curso-id').value = dados.id_curso;
        document.getElementById('alocacao-total-alunos').value = dados.total_alunos;
        document.getElementById('alocacao-salas-id').value = sala.id_salas;
        document.getElementById('alocacao-turno').value = dados.turno;
        document.getElementById('alocacao-instrutor-id').value = dados.instrutor_id;
        document.getElementById('alocacao-dias-semana').value = dados.dias_semana.join(',');


        // 4. Fecha o modal de Agendamento e abre o de Confirmação
        closeModal('agendamento-modal');
        openModal('alocacao-modal');

    } else {
        // Se a busca falhar, exibe a mensagem de erro (incluindo "Auditório Falhou")
        Utils.showMessage(`Falha na Alocação Automática: ${result.message}`, 'error');
        
        // Se falhou, o campo ID da sala deve ser limpo para impedir agendamento manual
        document.getElementById('agendamento-salas-id').value = '';
    }
};

/**
 * Lida com o clique em "Confirmar Agendamento" no modal de Alocação.
 */
confirmarAlocacaoBtn?.addEventListener('click', async () => {
    
    // Coleta todos os dados necessários (do cache e dos campos escondidos)
    const finalData = {
        id_curso: document.getElementById('alocacao-curso-id').value,
        id_instrutor: document.getElementById('alocacao-instrutor-id').value,
        codigo_turma: document.getElementById('agendamento-codigo').value, // Pega o código do modal anterior
        data_inicio: document.getElementById('alocacao-data-inicio').getAttribute('data-value'),
        data_termino: document.getElementById('alocacao-data-termino').textContent,
        turno: document.getElementById('alocacao-turno').value,
        total_alunos: document.getElementById('alocacao-total-alunos').value,
        id_sala: document.getElementById('alocacao-salas-id').value,
        dias_semana: document.getElementById('alocacao-dias-semana').value,
    };
    
    // 1. Validação final (apenas para garantir)
    if (!finalData.id_sala || !finalData.id_curso || !finalData.data_inicio) {
        Utils.showMessage("Erro de dados: Informações essenciais da sala ou turma estão faltando.", 'error');
        return;
    }
    
    // 2. Submete o agendamento real para o Backend
    const result = await Api.agendarTurma(finalData);

    if (result.status === 'success') {
        Utils.showMessage("🎉 Agendamento Confirmado! A turma foi alocada e registrada.", 'success');
        closeModal('alocacao-modal');
        
        // Recarregar o painel visual
        if(typeof loadPainelVisual === 'function') {
             loadPainelVisual();
        }
    } else {
        // Exibe erro de persistência ou conflito
        Utils.showMessage(`Falha ao registrar agendamento: ${result.message}`, 'error');
    }
});

// Listener para Cancelar no modal de alocação (apenas fecha o modal)
document.getElementById('cancelar-alocacao-btn')?.addEventListener('click', () => {
    closeModal('alocacao-modal');
});

// Exporta a função para ser chamada pelo agendar_turma.js
window.iniciarBuscaAlocacao = iniciarBuscaAlocacao;