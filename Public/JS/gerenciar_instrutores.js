// public/js/gerenciar_instrutores.js

const instrutorListContainer = document.getElementById('instrutor-list');
const addInstrutorBtn = document.getElementById('add-instrutor-btn');
const instrutorModal = document.getElementById('instrutor-modal');
const instrutorForm = document.getElementById('instrutor-form');
const instrutorModalTitle = document.getElementById('instrutor-modal-title');
const instrutorIdField = document.getElementById('instrutor-id');

// =======================================================
// 1. Inicialização e Carregamento de Lista
// =======================================================

/**
 * Função principal chamada pelo script.js para inicializar a tela.
 */
const initGerenciarInstrutores = () => {
    loadInstrutoresList();
    setupInstrutorListeners();
};

/**
 * Busca a lista de instrutores na API e renderiza no container.
 */
const loadInstrutoresList = async () => {
    instrutorListContainer.innerHTML = '<p class="loading-message">Carregando lista de instrutores...</p>';
    
    const result = await Api.getInstrutores();

    if (result.status === 'success') {
        renderInstrutoresList(result.data);
    } else {
        instrutorListContainer.innerHTML = `<p class="danger-btn" style="padding: 10px;">Erro ao carregar instrutores: ${result.message}</p>`;
    }
};

/**
 * Renderiza os instrutores na interface, permitindo ações de CRUD.
 */
const renderInstrutoresList = (instrutores) => {
    instrutorListContainer.innerHTML = '';
    
    if (instrutores.length === 0) {
        instrutorListContainer.innerHTML = '<p>Nenhum instrutor cadastrado.</p>';
        return;
    }

    instrutores.forEach(instrutor => {
        const item = document.createElement('div');
        item.className = 'list-view-item';
        
        // Simulação do Segmento Principal (o BD já possui essa coluna)
        const segmento = instrutor.segmento_principal || 'Não Definido';

        item.innerHTML = `
            <div class="list-view-item-info">
                <strong>${instrutor.nome_instrutor}</strong> 
                <span style="opacity: 0.7;">(${segmento})</span>
            </div>
            <div class="actions">
                <button class="secondary-btn edit-btn" data-id="${instrutor.id_instrutores}">Editar</button>
                <button class="danger-btn delete-btn" data-id="${instrutor.id_instrutores}">Excluir</button>
            </div>
        `;

        // Adiciona listeners para Editar e Excluir
        item.querySelector('.edit-btn').addEventListener('click', () => {
            // O CRUD completo exigiria uma função para buscar dados de um ID, mas para o beta, usamos os dados listados
            editInstrutor(instrutor); 
        });
        item.querySelector('.delete-btn').addEventListener('click', () => {
            deleteInstrutor(instrutor.id_instrutores, instrutor.nome_instrutor);
        });
        
        instrutorListContainer.appendChild(item);
    });
};

// =======================================================
// 2. Lógica de CRUD (Criação, Edição, Exclusão)
// =======================================================

const setupInstrutorListeners = () => {
    // Ação: Abrir modal para Adicionar
    addInstrutorBtn?.addEventListener('click', () => {
        instrutorForm.reset();
        instrutorIdField.value = '';
        instrutorModalTitle.textContent = 'Adicionar Novo Instrutor';
        openModal('instrutor-modal');
    });

    // Ação: Envio do Formulário (Salvar/Atualizar)
    instrutorForm?.addEventListener('submit', handleSaveInstrutor);
};

/**
 * Lida com o envio do formulário (Salvar/Atualizar).
 */
const handleSaveInstrutor = async (e) => {
    e.preventDefault();

    const data = {
        id: instrutorIdField.value || null,
        nome: document.getElementById('instrutor-nome').value,
        // Simplificação: para o beta, o segmento principal é um campo de texto no modal
        segmento: 'Não Informado' 
    };
    
    // Futuramente, você adicionaria lógica para Segmento Principal e Habilidades Específicas
    
    const result = await Api.saveInstrutor(data);

    if (result.status === 'success') {
        Utils.showMessage(result.message);
        closeModal('instrutor-modal');
        loadInstrutoresList(); // Recarrega a lista
    } else {
        Utils.showMessage(result.message, 'error');
    }
};

/**
 * Preenche o formulário com dados existentes para Edição.
 */
const editInstrutor = (instrutor) => {
    instrutorIdField.value = instrutor.id_instrutores;
    document.getElementById('instrutor-nome').value = instrutor.nome_instrutor;
    // Note: O campo de segmento no modal não existe no HTML fornecido, então omitimos o preenchimento aqui por segurança.
    
    instrutorModalTitle.textContent = 'Editar Instrutor';
    openModal('instrutor-modal');
};

/**
 * Lida com a exclusão de um instrutor.
 */
const deleteInstrutor = async (id, nome) => {
    if (confirm(`Tem certeza que deseja EXCLUIR o instrutor: ${nome}? Turmas associadas terão o campo 'instrutor' zerado (SET NULL).`)) {
        const result = await Api.deleteInstrutor(id);
        
        if (result.status === 'success') {
            Utils.showMessage(result.message);
            loadInstrutoresList(); // Recarrega a lista
        } else {
            Utils.showMessage(result.message, 'error');
        }
    }
};

// Exporta a função para ser usada pelo script.js
window.initGerenciarInstrutores = initGerenciarInstrutores;