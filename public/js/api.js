/**
 * public/js/api.js
 * Módulo para gerenciar a comunicação com o backend (Controllers PHP).
 * Utiliza fetch API com tratamento de erros (timeout, JSON inválido, erros do servidor).
 */

const API_CONFIG = {
    // Endpoints base, inferidos a partir dos nomes de arquivos PHP.
    // Assumimos que os arquivos estão na raiz dos controllers: /controllers/nome_do_arquivo.php
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
 * @param {string} url - URL do endpoint.
 * @param {object} options - Opções de fetch.
 * @param {boolean} [isRetry=false] - Flag para indicar se é uma tentativa de retry.
 * @returns {Promise<object>} - Dados JSON da resposta.
*/
async function apiFetch(url, options, isRetry = false) {
    const controller = new AbortController();
    const idTimeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);
    options.signal = controller.signal;

    try {
        SGST.Utils.log('API_REQUEST', { url, method: options.method || 'GET', body: options.body });
        
        const response = await fetch(url, options);
        clearTimeout(idTimeout);

        // 1. Tratamento de Timeout/Abort: A AbortError é lançada automaticamente pelo fetch.
        
        // 2. Tratamento de resposta não-OK (ex: 400 Bad Request, 500 Internal Server Error)
        if (!response.ok) {
            let errorData;
            const contentType = response.headers.get("content-type");
            
            // Tenta ler o JSON de erro do backend (PHP)
            if (contentType && contentType.includes("application/json")) {
                errorData = await response.json();
            } else {
                // Endpoint retornando HTML ou texto em vez de JSON (ERRO COMUM)
                errorData = { error: `Erro do Servidor (${response.status}): Resposta inesperada (não-JSON).` };
            }
            
            SGST.Utils.log('API_ERROR', { url, status: response.status, errorData });
            throw new Error(errorData.error || `Erro de Servidor: ${response.statusText}`);
        }

        // 3. Sucesso (Status 2xx): Tenta converter a resposta em JSON
        const data = await response.json();
        SGST.Utils.log('API_SUCCESS', { url, data });
        return data;

    } catch (error) {
        clearTimeout(idTimeout);
        
        if (error.name === 'AbortError') {
            SGST.Utils.log('API_TIMEOUT', { url });
            if (!isRetry) {
                SGST.Utils.showToast('Erro: Tempo limite excedido. Tentando novamente...', 'warning');
                // Tenta novamente (Retry 1 vez)
                return apiFetch(url, options, true); 
            }
            throw new Error('Tempo limite da requisição excedido. Tente novamente mais tarde.');
        }

        SGST.Utils.log('API_FATAL_ERROR', error);
        throw error; // Lança o erro para ser tratado pela função chamadora
    }
}

// Objeto principal da API
const API = {
    /**
     * Busca todos os agendamentos (GET agendar_turma.php)
     * Resposta Esperada: [{ id_agendamentos: 1, data_aula: '2025-01-01', turno: 'Manhã', ... }]
     */
    getAgendamentos: () => apiFetch(API_CONFIG.AGENDAMENTO_URL, { method: 'GET' }),

    /**
     * Agenda uma nova turma (POST agendar_turma.php)
     * Payload Exemplo: { cursoId: 1, dataInicio: '2025-10-01', dataTermino: '2025-10-30', totalAlunos: 20, instrutorId: 5, turno: 'Manhã', diasLetivos: ['2025-10-01', ...], salasIds: [2] }
     * Resposta Esperada: { message: 'Turma agendada com sucesso!', id: 10 }
     */
    agendarTurma: (data) => apiFetch(API_CONFIG.AGENDAMENTO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    /**
     * Busca cursos com filtros (GET calculadora_inteligente.php)
     * Payload Exemplo (via query params): ?segmento=TI&ch_min=40&nome_curso=Intro
     * Resposta Esperada: [{ id_cursos: 1, nome_curso: 'Curso A', carga_horaria: 80, ... }]
     */
    buscarCursosComFiltros: (filtros) => {
        const query = new URLSearchParams(filtros).toString();
        return apiFetch(`${API_CONFIG.CALCULADORA_URL}?${query}`, { method: 'GET' });
    },
    
    /**
     * Calcula cronograma da turma (POST calcular_cronograma.php)
     * OBS: Este endpoint não existe no backend, mas a função calcularCronograma existe no PHP. 
     * Assumimos um controller que a executa.
     * Payload Exemplo: { cargaHorariaTotal: 40, dataInicio: '2025-10-01', turno: 'Manhã', diasSemana: [2, 4], porcentagemRemoto: 20 }
     * Resposta Esperada: { data_termino: '2025-10-15', diasLetivos: [{ data: '2025-10-01', is_class_day: true, type: 'presencial' }] }
     */
    calcularCronograma: (data) => apiFetch(API_CONFIG.CRONOGRAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    /**
     * Busca sugestão de alocação de sala (POST alocar_turma.php)
     * Payload Exemplo: { cursoId: 1, totalAlunos: 20, turno: 'Manhã', diasSemana: [2, 4], dataInicio: '2025-10-01', dataTermino: '2025-10-30' }
     * Resposta Esperada: { success: true, salas: [{ id_salas: 2, nome_sala: 'Sala X' }], message: '...' }
     */
    buscarSugestaoAlocacao: (data) => apiFetch(API_CONFIG.ALOCACAO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    
    /**
     * Gerenciar Feriados (CRUD) (GET/POST/PUT/DELETE gerenciar_feriado.php)
     */
    getFeriados: () => apiFetch(API_CONFIG.FERIADOS_URL, { method: 'GET' }),
    addFeriado: (data) => apiFetch(API_CONFIG.FERIADOS_URL, {
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

    /**
     * Gerenciar Turmas (Atualiza Status/Instrutor) (POST gerenciar_turma.php)
     * Payload Exemplo: { turmaId: 1, status: 'Confirmada', instrutorId: 5 }
     * Resposta Esperada: { message: 'Turma atualizada com sucesso!' }
     */
    atualizarStatusTurma: (data) => apiFetch(API_CONFIG.TURMAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    /**
     * Busca todos os Cursos, Instrutores, Salas
     */
    getAllCursos: () => apiFetch(API_CONFIG.CURSOS_URL, { method: 'GET' }),
    getAllInstrutores: () => apiFetch(API_CONFIG.INSTRUTORES_URL, { method: 'GET' }),
    getAllSalas: () => apiFetch(API_CONFIG.SALAS_URL, { method: 'GET' }),
};

// Exporta o objeto API para ser usado globalmente via SGST (ou diretamente se a inclusão permitir)
// Aqui, vamos anexar ao objeto global SGST para manter o escopo limpo.
// O script.js deve garantir que SGST exista.
// Em um ambiente de módulo, usaríamos 'export const API = {...}'.
// Para fins de Vanilla JS tradicional, o script.js fará o mapeamento.
if (typeof window !== 'undefined') {
    window.API = API; // Expõe API globalmente para fácil acesso
}