// public/js/agendar_turma.js

const addTurmaBtn = document.getElementById('add-turma-btn');
const agendamentoModal = document.getElementById('agendamento-modal');
const agendamentoCursoSelect = document.getElementById('agendamento-curso');
const agendamentoInstrutorSelect = document.getElementById('agendamento-instrutor');
const alocarSalaBtn = document.getElementById('alocar-sala-btn');

let listaCursosCache = []; // Cache dos cursos carregados
let listaInstrutoresCache = []; // Cache dos instrutores carregados 

/**
 * Função principal para inicializar: carrega dados e configura listeners.
 */
const initAgendarTurma = async () => {
    // Carrega Cursos e Instrutores (Funções definidas em api.js)
    const [cursosResult, instrutoresResult] = await Promise.all([
        Api.getCursos(),
        Api.getInstrutores()
    ]);

    if (cursosResult.status === 'success') {
        listaCursosCache = cursosResult.data;
        // Popula o select do curso, mas não o de instrutor ainda
        Utils.populateSelect(agendamentoCursoSelect, listaCursosCache, 'id_cursos', 'nome_curso', true);
    } else {
        Utils.showMessage(`Erro ao carregar cursos: ${cursosResult.message}`, 'error');
    }

    if (instrutoresResult.status === 'success') {
        listaInstrutoresCache = instrutoresResult.data;
        // Popula o select do modal de detalhes 
        const detalhesInstrutorSelect = document.getElementById('detalhes-instrutor-select');
        if (detalhesInstrutorSelect) {
            Utils.populateSelect(detalhesInstrutorSelect, listaInstrutoresCache, 'id_instrutores', 'nome_instrutor', true);
        }
        
        // O select de instrutor do agendamento é carregado VAZIO no início
        Utils.populateSelect(agendamentoInstrutorSelect, [], 'id_instrutores', 'nome_instrutor', true);
    } else {
        Utils.showMessage(`Erro ao carregar instrutores: ${instrutoresResult.message}`, 'error');
    }

    // Configura listeners
    addTurmaBtn?.addEventListener('click', () => {
        if (typeof openModal === 'function') { 
            openModal('agendamento-modal');
        }
    });

    // Adiciona listener para filtrar instrutores ao mudar o curso
    agendamentoCursoSelect.addEventListener('change', filterInstrutoresByCurso);

    // Chama handleAlocarSala ao clicar em Buscar Salas Automaticamente
    alocarSalaBtn.addEventListener('click', handleAlocarSala);
};

/**
 * Filtra e repopula o select de instrutores baseado no curso selecionado.
 * * NOTA: Esta lógica SIMULA o relacionamento via SEGMENTO (segmento_principal do instrutor 
 * deve ser igual ao segmento do curso). Para uma checagem mais robusta (ex: 
 * InstrutorCurso), a busca seria via API.
 */
const filterInstrutoresByCurso = () => {
    const selectedCursoId = agendamentoCursoSelect.value;
    
    // Limpa o select se nenhum curso for selecionado
    if (!selectedCursoId) {
        Utils.populateSelect(agendamentoInstrutorSelect, [], 'id_instrutores', 'nome_instrutor', true);
        return;
    }
    
    const cursoSelecionado = listaCursosCache.find(c => c.id_cursos == selectedCursoId);
    
    if (!cursoSelecionado) {
        Utils.showMessage("Curso selecionado não encontrado no cache.", 'error');
        return;
    }
    
    const segmentoCurso = cursoSelecionado.segmento;
    
    // Filtra os instrutores cujo segmento principal corresponde ao segmento do curso
    const instrutoresFiltrados = listaInstrutoresCache.filter(instrutor => {
        // Assume que o campo `segmento_principal` do instrutor é uma string que deve coincidir.
        // A comparação é feita em minúsculas para robustez.
        return instrutor.segmento_principal && instrutor.segmento_principal.toLowerCase() === segmentoCurso.toLowerCase();
    });

    // Repopula o select de instrutores com a lista filtrada
    Utils.populateSelect(agendamentoInstrutorSelect, instrutoresFiltrados, 'id_instrutores', 'nome_instrutor', true);
    
    if (instrutoresFiltrados.length === 0) {
        Utils.showMessage(`Nenhum instrutor encontrado para o segmento "${segmentoCurso}".`, 'warning');
    }
};


/**
 * Coleta e valida os dados essenciais do formulário de agendamento.
 * @returns {object|null} Dados da turma ou null se houver falha na validação.
 */
const getAgendamentoData = () => {
    const agendamentoForm = document.getElementById('agendamento-form');
    // Captura os valores dos checkboxes marcados
    const diasCheckboxes = agendamentoForm.querySelectorAll('#agendamento-dias-semana input[name="diasSemana"]:checked');
    const dias_semana = Array.from(diasCheckboxes).map(cb => cb.value);
    
    const id_curso = agendamentoCursoSelect.value;
    const data_inicio = document.getElementById('agendamento-data-inicio').value;
    const total_alunos = document.getElementById('agendamento-total-alunos').value;

    // Validação de campos obrigatórios
    if (!id_curso || !data_inicio || !total_alunos || dias_semana.length === 0 || !agendamentoInstrutorSelect.value || !document.getElementById('agendamento-codigo').value) {
        Utils.showMessage("Preencha todos os campos obrigatórios (Curso, Instrutor, Código, Data, Alunos, Dias da Semana).", 'warning');
        return null;
    }

    const curso = listaCursosCache.find(c => c.id_cursos == id_curso);
    
    if (!curso || curso.carga_horaria === 0) {
        Utils.showMessage("Carga horária do curso não encontrada ou inválida. Cadastre o curso corretamente.", 'error');
        return null;
    }
    
    return {
        id_curso: id_curso,
        id_instrutor: agendamentoInstrutorSelect.value,
        codigo_turma: document.getElementById('agendamento-codigo').value,
        data_inicio: data_inicio,
        turno: document.getElementById('agendamento-turno').value,
        total_alunos: total_alunos,
        dias_semana: dias_semana, // Array de números (1, 2, 3...)
        carga_horaria: curso.carga_horaria,
        curso_nome: curso.nome_curso
    };
};

/**
 * Lida com o clique no botão "Buscar Salas Automaticamente".
 */
const handleAlocarSala = async () => {
    // 1. Coleta e valida os dados do form principal
    const dadosTurma = getAgendamentoData();
    
    if (!dadosTurma) {
        return; // Validação falhou, a mensagem já foi exibida
    }
    
    // 2. Chama a Calculadora Inteligente para obter a data de término
    const termoResult = await Api.calcularDataTermino({ 
        ch: dadosTurma.carga_horaria, 
        inicio: dadosTurma.data_inicio, 
        dias: dadosTurma.dias_semana.join(',') 
    });
    
    if (termoResult.status !== 'success') {
        Utils.showMessage(`Falha ao calcular data de término: ${termoResult.message}`, 'error');
        return;
    }
    const data_termino_estimada = termoResult.data_termino;
    
    // 3. Chama o Módulo de Alocação Automática, passando todos os dados
    if (typeof iniciarBuscaAlocacao === 'function') {
        iniciarBuscaAlocacao({
            ...dadosTurma, // Espalha todos os dados coletados
            data_termino: data_termino_estimada, // Adiciona o dado calculado
        });
        
        // Fecha o modal de Agendamento (para abrir o de Alocação)
        closeModal('agendamento-modal'); 
    } else {
        Utils.showMessage("Módulo de alocação não carregado.", 'error');
    }
};

// Exporta as funções para serem usadas globalmente
window.initAgendarTurma = initAgendarTurma;
window.getAgendamentoData = getAgendamentoData;