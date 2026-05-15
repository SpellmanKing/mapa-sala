// public/js/api.js
const API_URL = 'Controllers/ApiController.php';

const Api = {
    fetchData: async (url, method = 'GET', data = null) => {
        const options = { method: method };

        if (method === 'GET' && data) {
            const params = new URLSearchParams(data).toString();
            url = `${url}?${params}`;
        } else if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) { throw new Error(`Erro de rede: ${response.statusText}`); }
            return await response.json();
        } catch (error) {
            console.error(`Erro na requisição à API (URL: ${url})`, error);
            return { status: 'error', message: `Falha ao conectar: ${error.message}` };
        }
    },
    
    // CRUD Feriados (RF01)
    getFeriados: () => Api.fetchData('/controllers/gerenciar_feriado.php'),
    saveFeriado: (data) => Api.fetchData('/controllers/gerenciar_feriado.php', 'POST', data),
    deleteFeriado: (id) => Api.fetchData('/controllers/gerenciar_feriado.php', 'DELETE', { id }),

    // CRUD Instrutores (RF01)
    getInstrutores: () => Api.fetchData('/controllers/gerenciar_instrutores.php'),
    saveInstrutor: (data) => Api.fetchData('/controllers/gerenciar_instrutores.php', 'POST', data),
    deleteInstrutor: (id) => Api.fetchData('/controllers/gerenciar_instrutores.php', 'DELETE', { id }),
    
    // CRUD Cursos (RF01)
    getCursos: () => Api.fetchData('/controllers/gerenciar_cursos.php'),
    saveCurso: (data) => Api.fetchData('/controllers/gerenciar_cursos.php', 'POST', data),
    deleteCurso: (id) => Api.fetchData('/controllers/gerenciar_cursos.php', 'DELETE', { id }),

    // Cálculos e Alocação (RF02, RF04, RF05, RF10)
    calcularDataTermino: (data) => Api.fetchData('/controllers/calcular_cronograma.php', 'GET', data),
    alocacaoAutomatica: (data) => Api.fetchData('/controllers/alocar_turma.php', 'GET', data),
    agendarTurma: (data) => Api.fetchData('/controllers/gerenciar_turma.php', 'POST', data),
    
    // Painel e Listagens de Apoio
    getAgendamentos: () => Api.fetchData('/controllers/gerenciar_turma.php'),
    getTiposSala: () => Api.fetchData('/controllers/gerenciar_sala.php', 'GET', { action: 'tipos' }),
    getAllSalas: () => Api.fetchData('/controllers/gerenciar_sala.php'),
    getSegmentos: () => Api.fetchData('/controllers/gerenciar_cursos.php', 'GET', { action: 'segmentos' }),
};
