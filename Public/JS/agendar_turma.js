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
    addTurmaBtn?.addEventListener('click', () => {
        if (typeof openModal === 'function') { 
            openModal('agendamento-modal');
        }
    });

    // CORREÇÃO: Chama handleAlocarSala ao clicar em Buscar Salas Automaticamente
    alocarSalaBtn.addEventListener('click', handleAlocarSala);
    
    // Configura o Agendamento Manual (submissão do formulário)
    agendamentoForm?.addEventListener('submit', handleAgendamentoManual);
};

/**
 * Coleta e valida os dados essenciais do formulário de agendamento.
 * @returns {object|null} Dados da turma ou null se houver falha na validação.
 */
const getAgendamentoData = () => {
    // Captura os valores dos checkboxes marcados (1 a 5)
    const diasCheckboxes = document.querySelectorAll('#agendamento-dias-semana input[name="diasSemana"]:checked');
    const dias_semana = Array.from(diasCheckboxes).map(cb => cb.value);
    
    const id_curso = agendamentoCursoSelect.value;
    const data_inicio = document.getElementById('agendamento-data-inicio').value;
    const total_alunos = document.getElementById('agendamento-total-alunos').value;

    // Validação de campos obrigatórios
    if (!id_curso || !data_inicio || !total_alunos || dias_semana.length === 0 || !agendamentoInstrutorSelect.value || !document.getElementById('agendamento-codigo').value) {
        Utils.showMessage("Preencha todos os campos obrigatórios (Curso, Instrutor, Data, Alunos, Dias da Semana).", 'warning');
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
    const dadosTurma = getAgendamentoData();
    
    if (!dadosTurma) {
        return; // Validação falhou, a mensagem já foi exibida
    }
    
    // 1. Chama a Calculadora Inteligente para obter a data de término
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
    
    // 2. Chama o Módulo de Alocação Automática (Implementado em alocacao_automatica.js)
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

/**
 * Lida com a submissão do formulário de Agendamento.
 */
const handleAgendamentoManual = (e) => {
    e.preventDefault();
    
    // Verifica se a Alocação Automática foi executada e preencheu o campo hidden da sala
    const salaID = document.getElementById('alocacao-salas-id').value;
    
    if (!salaID) {
        // CORREÇÃO: Agora o aviso é claro, vem do handleAgendamentoManual (o submit)
        Utils.showMessage("A Alocação Automática deve ser executada antes de agendar. Clique em 'Buscar Salas Automaticamente'.", 'warning');
        // Adiciona foco ao botão para guiar o usuário
        alocarSalaBtn.focus(); 
        return;
    }
    
    // Coleta a data de término e dias da semana dos campos hidden preenchidos pelo modal de Alocação
    // O campo data-value é mais seguro para pegar a data de término completa
    const data_termino_el = document.getElementById('alocacao-data-termino');
    const data_termino = data_termino_el ? (data_termino_el.dataset.value || data_termino_el.textContent) : ''; 
    const dias_semana = document.getElementById('alocacao-dias-semana').value; 

    // Coleta dados restantes do formulário principal
    const agendamentoData = {
        id_curso: agendamentoCursoSelect.value,
        id_instrutor: agendamentoInstrutorSelect.value,
        codigo_turma: document.getElementById('agendamento-codigo').value,
        data_inicio: document.getElementById('agendamento-data-inicio').value,
        turno: document.getElementById('agendamento-turno').value,
        total_alunos: document.getElementById('agendamento-total-alunos').value,
        // Dados de alocação
        id_sala: salaID, 
        data_termino: data_termino,
        dias_semana: dias_semana, 
    };
    
    // Validação final de dados de alocação
     if (!agendamentoData.data_termino || !agendamentoData.id_sala || !agendamentoData.dias_semana) {
         // O erro que você estava vendo vinha daqui
         Utils.showMessage("Dados de alocação incompletos. Execute a 'Busca Automática' novamente.", 'error');
         return;
     }

    // Chamada final para a API
    Api.agendarTurma(agendamentoData).then(result => {
        if (result.status === 'success') {
            Utils.showMessage("Turma agendada com sucesso! Código: " + agendamentoData.codigo_turma, 'success');
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

// Inicializa a função de agendamento ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initAgendarTurma === 'function') {
        initAgendarTurma();
    }
});