/**
 * public/js/api.js
 * Módulo para gerenciar a comunicação com o backend (Controllers PHP).
 * Utiliza fetch API com tratamento de erros (timeout, JSON inválido, erros do servidor).
 */

const API_CONFIG = {
    // Endpoints base, inferidos a partir dos nomes de arquivos PHP.
    AGENDAMENTO_URL: './controllers/agendar_turma.php',
    ALOCACAO_URL: './controllers/alocar_turma.php',
    CALCULADORA_URL: './controllers/calculadora_inteligente.php',
    CRONOGRAMA_URL: './controllers/calcular_cronograma.php',
    CURSOS_URL: './controllers/gerenciar_cursos.php',
    INSTRUTORES_URL: './controllers/gerenciar_instrutores.php',
    FERIADOS_URL: './controllers/gerenciar_feriado.php',
    TURMAS_URL: './controllers/gerenciar_turma.php',
    SALAS_URL: './controllers/gerenciar_sala.php',
    TIMEOUT_MS: 8000 // Timeout de 8 segundos
};

/**
 * Função utilitária para lidar com todas as requisições API.
 * (Assumida a existência de uma função de utilidade para o fetch)
 */
const apiFetch = async (url, options) => {
    // Para simplificação, assumimos que SGST.Utils.fetchWithTimeout faz o trabalho
    if (window.SGST && SGST.Utils && SGST.Utils.fetchWithTimeout) {
        return SGST.Utils.fetchWithTimeout(url, options);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || `Erro na API (${response.status})`);
    }
    return data;
};

window.API = {
    // AGENDAMENTO E ALOCAÇÃO
    getAllAgendamentos: () => apiFetch(API_CONFIG.AGENDAMENTO_URL, { method: 'GET' }),
    agendarTurma: (data) => apiFetch(API_CONFIG.AGENDAMENTO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    getAlocacaoSugestion: (data) => apiFetch(API_CONFIG.ALOCACAO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    // CALCULADORA E CRONOGRAMA
    getCronograma: (data) => apiFetch(API_CONFIG.CRONOGRAMA_URL, { // POST/GET para calcular_cronograma.php
        method: 'POST', // Usamos POST para enviar o body grande (dias, CH, etc.)
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    // CADASTROS GERAIS
    getAllCursos: () => apiFetch(API_CONFIG.CURSOS_URL, { method: 'GET' }),
    getAllInstrutores: () => apiFetch(API_CONFIG.INSTRUTORES_URL, { method: 'GET' }),
    getAllSalas: () => apiFetch(API_CONFIG.SALAS_URL, { method: 'GET' }),
    
    // GERENCIAR TURMAS
    atualizarStatusTurma: (data) => apiFetch(API_CONFIG.TURMAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    // GERENCIAR FERIADOS
    getFeriados: () => apiFetch(API_CONFIG.FERIADOS_URL, { method: 'GET' }),
    createFeriado: (data) => apiFetch(API_CONFIG.FERIADOS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    updateFeriado: (data) => apiFetch(API_CONFIG.FERIADOS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deleteFeriado: (id) => apiFetch(`${API_CONFIG.FERIADOS_URL}?id=${id}`, { method: 'DELETE' }),
};