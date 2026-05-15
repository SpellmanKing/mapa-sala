// public/js/api.js

const USE_MOCK = true; // Flag para usar o banco de dados falso local

// --- BANCO DE DADOS FALSO (MOCK) ---
const mockDB = {
    feriados: [
        { id_feriado: 1, data_feriado: '2026-09-07', descricao: 'Independência do Brasil', tipo: 'Nacional' },
        { id_feriado: 2, data_feriado: '2026-12-25', descricao: 'Natal', tipo: 'Nacional' }
    ],
    instrutores: [
        { id_instrutor: 1, nome: 'João Silva', segmento: 'Tecnologia da Informação' },
        { id_instrutor: 2, nome: 'Maria Souza', segmento: 'Gestão e Negócios' }
    ],
    cursos: [
        { id_cursos: 1, nome_curso: 'Lógica de Programação', carga_horaria: 40, segmento: 'Tecnologia da Informação', idTipo_sala: 1, nome_tipo: 'Laboratório de TI' },
        { id_cursos: 2, nome_curso: 'Gestão Financeira', carga_horaria: 20, segmento: 'Gestão e Negócios', idTipo_sala: 2, nome_tipo: 'Sala Convencional' }
    ],
    tiposSala: [
        { idTipo_sala: 1, nome_tipo: 'Laboratório de TI' },
        { idTipo_sala: 2, nome_tipo: 'Sala Convencional' },
        { idTipo_sala: 3, nome_tipo: 'Sala Inovadora' }
    ],
    salas: [
        { id_sala: 1, nome_sala: 'Lab 01', idTipo_sala: 1, capacidade: 20 },
        { id_sala: 2, nome_sala: 'Sala 05', idTipo_sala: 2, capacidade: 35 }
    ],
    agendamentos: [
        { id_agendamento: 1, id_turma: 101, id_sala: 1, data_aula: '2026-05-20', turno: 'Noturno' }
    ],
    segmentos: ['Tecnologia da Informação', 'Gestão e Negócios', 'Saúde', 'Indústria']
};

const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 600));

// --- INTERCEPTADOR DO MOCK ---
const mockFetch = async (url, method, data) => {
    await simulateNetworkDelay();

    // Roteamento falso baseado na URL
    if (url.includes('gerenciar_feriado')) {
        if (method === 'GET') return { status: 'success', data: mockDB.feriados };
        if (method === 'POST') {
            data.id_feriado = data.id || Date.now();
            if(!data.id) mockDB.feriados.push(data); // simplificação
            return { status: 'success', message: 'Feriado salvo com sucesso (Mock)!' };
        }
        if (method === 'DELETE') {
            mockDB.feriados = mockDB.feriados.filter(f => f.id_feriado != data.id);
            return { status: 'success', message: 'Feriado removido (Mock)!' };
        }
    }
    
    if (url.includes('gerenciar_instrutores')) {
        if (method === 'GET') return { status: 'success', data: mockDB.instrutores };
        if (method === 'POST') return { status: 'success', message: 'Instrutor salvo com sucesso (Mock)!' };
        if (method === 'DELETE') return { status: 'success', message: 'Instrutor removido (Mock)!' };
    }

    if (url.includes('gerenciar_cursos')) {
        if (method === 'GET' && url.includes('action=segmentos')) return { status: 'success', data: mockDB.segmentos };
        if (method === 'GET') return { status: 'success', data: mockDB.cursos };
        if (method === 'POST') return { status: 'success', message: 'Curso salvo com sucesso (Mock)!' };
        if (method === 'DELETE') return { status: 'success', message: 'Curso removido (Mock)!' };
    }

    if (url.includes('gerenciar_sala')) {
        if (method === 'GET' && url.includes('action=tipos')) return { status: 'success', data: mockDB.tiposSala };
        if (method === 'GET') return { status: 'success', data: mockDB.salas };
    }

    if (url.includes('gerenciar_turma')) {
        if (method === 'GET') return { status: 'success', data: mockDB.agendamentos };
        if (method === 'POST') return { status: 'success', message: 'Turma agendada com sucesso (Mock)!' };
    }

    // Rotas de Cálculo
    if (url.includes('calcular_cronograma') || url.includes('alocar_turma')) {
        return { status: 'success', message: 'Cálculo executado no Mock!', data: {} };
    }

    return { status: 'error', message: 'Rota não encontrada no Mock API.' };
};

const Api = {
    fetchData: async (url, method = 'GET', data = null) => {
        if (method === 'GET' && data) {
            const params = new URLSearchParams(data).toString();
            url = `${url}?${params}`;
        }

        // Se o Mock estiver ativo, redireciona para a função falsa
        if (USE_MOCK) {
            return await mockFetch(url, method, data);
        }

        // --- CONEXÃO REAL COM BACKEND NODE.JS ---
        const options = { method: method };
        if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
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
    
    // CRUD Feriados
    getFeriados: () => Api.fetchData('/controllers/gerenciar_feriado.php'),
    saveFeriado: (data) => Api.fetchData('/controllers/gerenciar_feriado.php', 'POST', data),
    deleteFeriado: (id) => Api.fetchData('/controllers/gerenciar_feriado.php', 'DELETE', { id }),

    // CRUD Instrutores
    getInstrutores: () => Api.fetchData('/controllers/gerenciar_instrutores.php'),
    saveInstrutor: (data) => Api.fetchData('/controllers/gerenciar_instrutores.php', 'POST', data),
    deleteInstrutor: (id) => Api.fetchData('/controllers/gerenciar_instrutores.php', 'DELETE', { id }),
    
    // CRUD Cursos
    getCursos: () => Api.fetchData('/controllers/gerenciar_cursos.php'),
    saveCurso: (data) => Api.fetchData('/controllers/gerenciar_cursos.php', 'POST', data),
    deleteCurso: (id) => Api.fetchData('/controllers/gerenciar_cursos.php', 'DELETE', { id }),

    // Cálculos e Alocação
    calcularDataTermino: (data) => Api.fetchData('/controllers/calcular_cronograma.php', 'GET', data),
    alocacaoAutomatica: (data) => Api.fetchData('/controllers/alocar_turma.php', 'GET', data),
    agendarTurma: (data) => Api.fetchData('/controllers/gerenciar_turma.php', 'POST', data),
    
    // Painel e Listagens de Apoio
    getAgendamentos: () => Api.fetchData('/controllers/gerenciar_turma.php'),
    getTiposSala: () => Api.fetchData('/controllers/gerenciar_sala.php', 'GET', { action: 'tipos' }),
    getAllSalas: () => Api.fetchData('/controllers/gerenciar_sala.php'),
    getSegmentos: () => Api.fetchData('/controllers/gerenciar_cursos.php', 'GET', { action: 'segmentos' }),
};
