// public/js/agendar_turma.js

const addTurmaBtn = document.getElementById('add-turma-btn');
const agendamentoModal = document.getElementById('agendamento-modal');
const agendamentoForm = document.getElementById('agendamento-form');
const agendamentoCursoSelect = document.getElementById('agendamento-curso');
const agendamentoInstrutorSelect = document.getElementById('agendamento-instrutor');
const alocarSalaBtn = document.getElementById('alocar-sala-btn');

let listaCursosCache = []; // Cache dos cursos carregados
let listaInstrutoresCache = []; // Cache dos instrutores carregados

/**
 * Função de inicialização: carrega dados e configura listeners.
 */
const initAgendarTurma = async () => {
    // Carrega Cursos e Instrutores (Funções definidas em api.js)
    const [cursosResult, instrutoresResult] = await Promise.all([
        Api.getCursos(),
        Api.getInstrutores()
    ]);

    if (cursosResult.status === 'success') {
        listaCursosCache = cursosResult.data;
        Utils.populateSelect(agendamentoCursoSelect, listaCursosCache, 'id_cursos', 'nome_curso', true);
    } else {
        Utils.showMessage(`Erro ao carregar cursos: ${cursosResult.message}`, 'error');
    }

    if (instrutoresResult.status === 'success') {
        listaInstrutoresCache = instrutoresResult.data;
        Utils.populateSelect(agendamentoInstrutorSelect, listaInstrutoresCache, 'id_instrutores', 'nome_instrutor', true);
    } else {
        Utils.showMessage(`Erro ao carregar instrutores: ${instrutoresResult.message}`, 'error');
    }

    // Configura listeners
    addTurmaBtn?.addEventListener('click', () => openModal('agendamento-modal'));
    alocarSalaBtn?.addEventListener('click', handleAlocarSala);
    
    // Configura o Agendamento Manual (apenas um placeholder para o beta)
    agendamentoForm?.addEventListener('submit', handleAgendamentoManual);
};


/**
 * * Lida com o clique no botão "Buscar Salas Automaticamente".
 * */
const handleAlocarSala = async () => {
    // 1. Coleta e Validação dos Dados Essenciais
    const id_curso = agendamentoCursoSelect.value;
    const data_inicio = document.getElementById('agendamento-data-inicio').value;
    const total_alunos = document.getElementById('agendamento-total-alunos').value;
    
    // Coleta dos dias da semana (Retorna os valores 1 a 5, conforme o HTML)
    const diasCheckboxes = document.querySelectorAll('#agendamento-dias-semana input[name="diasSemana"]:checked');
    const dias_semana = Array.from(diasCheckboxes).map(cb => cb.value);

    if (!id_curso || !data_inicio || !total_alunos || dias_semana.length === 0) {
        Utils.showMessage("Preencha o Curso, Data de Início, Nº de Alunos e Dias da Semana para buscar salas.", 'warning');
        return;
    }
    
    const curso = listaCursosCache.find(c => c.id_cursos == id_curso);
    const carga_horaria = curso ? curso.carga_horaria : 0;
    
    if (carga_horaria === 0) {
         Utils.showMessage("Carga horária do curso não encontrada. Impossível calcular.", 'error');
         return;
    }
    
    // 2. Chama a Calculadora Inteligente (RF02) para obter a data de término
    // NOTA: A calculadora está no TurmaModel, acessada via API
    const termoResult = await Api.calcularDataTermino({ 
        ch: carga_horaria, 
        inicio: data_inicio, 
        dias: dias_semana.join(',') 
    });
    
    if (termoResult.status !== 'success') {
        Utils.showMessage(`Falha ao calcular data de término: ${termoResult.message}`, 'error');
        return;
    }
    const data_termino_estimada = termoResult.data_termino;
    
    // 3. Chama o Módulo de Alocação Automática (Implementado em alocacao_automatica.js)
    if (typeof iniciarBuscaAlocacao === 'function') {
        iniciarBuscaAlocacao({
            id_curso: id_curso,
            data_inicio: data_inicio,
            data_termino: data_termino_estimada,
            total_alunos: total_alunos,
            dias_semana: dias_semana,
            turno: document.getElementById('agendamento-turno').value,
            instrutor_id: document.getElementById('agendamento-instrutor').value,
            curso_nome: curso.nome_curso
        });
    }
};

/**
 * * Lida com a submissão do formulário de Agendamento (simulação manual no beta).
 * */
const handleAgendamentoManual = (e) => {
    e.preventDefault();
    
    // Se o usuário clicar em "Agendar" sem buscar a alocação automática antes,
    // ele deve ser forçado a usar a Alocação Automática para a versão Beta.
    
    const salaID = document.getElementById('agendamento-salas-id').value;
    if (!salaID) {
        Utils.showMessage("A Alocação Automática deve ser executada antes de agendar. Clique em 'Buscar Salas Automaticamente'.", 'warning');
        alocarSalaBtn.focus();
        return;
    }
    
    // Caso o usuário tenha executado a alocação e o ID da sala esteja salvo:
    const agendamentoData = {
        id_curso: agendamentoCursoSelect.value,
        id_instrutor: agendamentoInstrutorSelect.value,
        codigo_turma: document.getElementById('agendamento-codigo').value,
        data_inicio: document.getElementById('agendamento-data-inicio').value,
        turno: document.getElementById('agendamento-turno').value,
        total_alunos: document.getElementById('agendamento-total-alunos').value,
        // Dados preenchidos pela alocação:
        id_sala: salaID, 
        data_termino: document.getElementById('alocacao-data-termino').textContent,
        dias_semana: document.getElementById('agendamento-dias-semana').value, // Deve ser preenchido pela lógica de alocação
    };
    
    // Chamada simulada para a API (a ser completada no Controller/Model)
    Api.agendarTurma(agendamentoData).then(result => {
        if (result.status === 'success') {
            Utils.showMessage("Turma agendada com sucesso! Código: " + agendamentoData.codigo_turma);
            closeModal('agendamento-modal');
            
            // Recarregar o painel visual
            if(typeof loadPainelVisual === 'function') {
                 loadPainelVisual();
            }
        } else {
            Utils.showMessage(`Falha no agendamento: ${result.message}`, 'error');
        }
    });

};

// Inicializa a função de agendamento ao carregar o script.js
initAgendarTurma();