// public/js/gerenciar_cursos.js

const cursoListContainer = document.getElementById('curso-list');
const addCursoBtn = document.getElementById('add-curso-btn');
const cursoModal = document.getElementById('curso-modal');
const cursoForm = document.getElementById('curso-form');
const cursoModalTitle = document.getElementById('curso-modal-title');
const cursoIdField = document.getElementById('curso-id');
const cursoTipoSalaSelect = document.getElementById('curso-tipo-sala');

let listaTiposSala = []; // Cache para popular o select de Tipo de Sala

// =======================================================
// 1. Inicialização e Carregamento de Lista
// =======================================================

/**
 * Função principal chamada pelo script.js para inicializar a tela.
 */
const initGerenciarCursos = async () => {
    // Carrega dados necessários para o formulário (Tipo de Sala)
    await loadTipoSalaData();
    // Carrega a lista de cursos para a grade
    loadCursosList();
    setupCursoListeners();
};

/**
 * Carrega tipos de sala (Laboratório de TI, Sala Inovadora, etc.)
 */
const loadTipoSalaData = async () => {
    const result = await Api.getTiposSala(); // Rota que busca os tipos de sala
    
    if (result.status === 'success') {
        listaTiposSala = result.data;
        // Popula o select do modal de cursos (curso-tipo-sala)
        Utils.populateSelect(cursoTipoSalaSelect, listaTiposSala, 'idTipo_sala', 'nome_tipo', true);
    } else {
        Utils.showMessage(`Erro ao carregar tipos de sala: ${result.message}`, 'error');
    }
};

/**
 * Busca a lista de cursos na API e renderiza no container.
 */
const loadCursosList = async () => {
    cursoListContainer.innerHTML = '<p class="loading-message">Carregando lista de cursos...</p>';
    
    const result = await Api.getCursos();

    if (result.status === 'success') {
        renderCursosList(result.data);
    } else {
        cursoListContainer.innerHTML = `<p class="danger-btn" style="padding: 10px;">Erro ao carregar cursos: ${result.message}</p>`;
    }
};

/**
 * Renderiza os cursos na interface, permitindo ações de CRUD.
 */
const renderCursosList = (cursos) => {
    cursoListContainer.innerHTML = '';
    
    if (cursos.length === 0) {
        cursoListContainer.innerHTML = '<p>Nenhum curso cadastrado.</p>';
        return;
    }

    cursos.forEach(curso => {
        const item = document.createElement('div');
        item.className = 'list-view-item';
        
        const tipoSalaNome = curso.nome_tipo || 'N/A'; // Nome do tipo de sala (usado na exibição)

        item.innerHTML = `
            <div class="list-view-item-info">
                <strong>${curso.nome_curso}</strong> 
                <span style="opacity: 0.8;">(${curso.carga_horaria}h) - Segmento: ${curso.segmento}</span>
                <br><span style="font-size: 0.9em; opacity: 0.6;">Sala Ideal: ${tipoSalaNome}</span>
            </div>
            <div class="actions">
                <button class="secondary-btn edit-btn" data-id="${curso.id_cursos}">Editar</button>
                <button class="danger-btn delete-btn" data-id="${curso.id_cursos}">Excluir</button>
            </div>
        `;

        // Adiciona listeners para Editar e Excluir
        item.querySelector('.edit-btn').addEventListener('click', () => {
            editCurso(curso); 
        });
        item.querySelector('.delete-btn').addEventListener('click', () => {
            deleteCurso(curso.id_cursos, curso.nome_curso);
        });
        
        cursoListContainer.appendChild(item);
    });
};

// =======================================================
// 2. Lógica de CRUD (Criação, Edição, Exclusão)
// =======================================================

const setupCursoListeners = () => {
    // Ação: Abrir modal para Adicionar
    addCursoBtn?.addEventListener('click', () => {
        cursoForm.reset();
        cursoIdField.value = '';
        cursoModalTitle.textContent = 'Adicionar Novo Curso';
        openModal('curso-modal');
    });

    // Ação: Envio do Formulário (Salvar/Atualizar - RF01)
    cursoForm?.addEventListener('submit', handleSaveCurso);
};

/**
 * Lida com o envio do formulário (Salvar/Atualizar).
 */
const handleSaveCurso = async (e) => {
    e.preventDefault();

    // Validação de Formulário Visual
    if (!Utils.validateForm('curso-form')) return;

    const submitBtn = document.querySelector('#curso-form button[type="submit"]');
    Utils.toggleButtonLoading(submitBtn, true);

    const data = {
        id: cursoIdField.value || null,
        nome: document.getElementById('curso-nome').value,
        ch: parseInt(document.getElementById('curso-carga-horaria').value),
        tipo_sala: document.getElementById('curso-tipo-sala').value,
        segmento: 'FIC' // Simplificação: usar valor default para o beta
    };
    
    // Validação de CH
    if (isNaN(data.ch) || data.ch <= 0) {
        Utils.showMessage("Carga Horária deve ser um número positivo.", 'error');
        document.getElementById('curso-carga-horaria').classList.add('input-error');
        Utils.toggleButtonLoading(submitBtn, false);
        return;
    }
    
    const result = await Api.saveCurso(data);

    if (result.status === 'success') {
        Utils.showMessage(result.message, 'success');
        closeModal('curso-modal');
        loadCursosList(); // Recarrega a lista
    } else {
        Utils.showMessage(result.message, 'error');
    }
    
    Utils.toggleButtonLoading(submitBtn, false);
};

/**
 * Preenche o formulário com dados existentes para Edição.
 */
const editCurso = (curso) => {
    cursoIdField.value = curso.id_cursos;
    document.getElementById('curso-nome').value = curso.nome_curso;
    document.getElementById('curso-carga-horaria').value = curso.carga_horaria;
    document.getElementById('curso-tipo-sala').value = curso.idTipo_sala || ''; // Preenche o select
    
    cursoModalTitle.textContent = 'Editar Curso';
    openModal('curso-modal');
};

/**
 * Lida com a exclusão de um curso.
 */
const deleteCurso = async (id, nome) => {
    if (confirm(`Tem certeza que deseja EXCLUIR o curso: ${nome}? Isso pode afetar turmas associadas e a lógica da calculadora.`)) {
        const result = await Api.deleteCurso(id);
        
        if (result.status === 'success') {
            Utils.showMessage(result.message);
            loadCursosList(); // Recarrega a lista
        } else {
            Utils.showMessage(result.message, 'error');
        }
    }
};

// Exporta a função para ser usada pelo script.js
window.initGerenciarCursos = initGerenciarCursos;