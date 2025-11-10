// public/js/gerenciar_feriados.js

const feriadoForm = document.getElementById('feriado-form');
const feriadoList = document.getElementById('feriado-list-view');
const btnCancel = document.getElementById('feriado-form-cancel-btn');

/**
 * Carrega a lista de feriados e renderiza no modal.
 */
const loadFeriadosList = async () => {
    feriadoList.innerHTML = '<p class="loading-message">Carregando feriados...</p>';
    
    const result = await Api.getFeriados();

    if (result.status === 'success') {
        renderFeriadosList(result.data);
    } else {
        feriadoList.innerHTML = `<p class="danger-btn" style="padding: 10px;">Erro ao carregar: ${result.message}</p>`;
    }
};

/**
 * Renderiza a lista de feriados no HTML.
 */
const renderFeriadosList = (feriados) => {
    feriadoList.innerHTML = ''; // Limpa
    
    if (feriados.length === 0) {
        feriadoList.innerHTML = '<p>Nenhuma data não letiva cadastrada.</p>';
        return;
    }

    feriados.forEach(feriado => {
        const item = document.createElement('div');
        item.className = 'list-item';
        
        // 1. Determina o nome do tipo (Feriado=1, Recesso=2)
        const tipoNome = feriado.fk_id_tipo_feriado == 1 ? 'Feriado' : 'Recesso'; 
        const badgeClass = tipoNome.toLowerCase();

        item.innerHTML = `
            <div class="date-info">
                <strong>${Utils.formatDate(feriado.data_feriado)}</strong>
                - ${feriado.descricao}
                <span class="badge ${badgeClass}">${tipoNome}</span>
            </div>
            <div class="actions">
                <button class="secondary-btn edit-btn" data-id="${feriado.id_feriado}">Editar</button>
                <button class="danger-btn delete-btn" data-id="${feriado.id_feriado}">Excluir</button>
            </div>
        `;

        // Adiciona listeners para Editar e Excluir
        item.querySelector('.edit-btn').addEventListener('click', () => editFeriado(feriado));
        item.querySelector('.delete-btn').addEventListener('click', () => deleteFeriado(feriado.id_feriado, feriado.descricao));
        
        feriadoList.appendChild(item);
    });
};

/**
 * Lida com o envio do formulário (Salvar/Atualizar - RF01).
 */
feriadoForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        id: document.getElementById('feriado-id').value || null,
        data: document.getElementById('feriado-data').value,
        descricao: document.getElementById('feriado-descricao').value,
        // Adaptação: O banco de dados usa ID (1=feriado, 2=recesso).
        tipo: document.getElementById('feriado-tipo').value === 'Feriado' ? 1 : 2 
    };
    
    const result = await Api.saveFeriado(data);

    if (result.status === 'success') {
        Utils.showMessage(result.message);
        feriadoForm.reset();
        loadFeriadosList(); // Recarrega a lista
        // Resetar o modo de edição
        document.getElementById('feriado-id').value = '';
        document.getElementById('feriado-form-title').textContent = 'Adicionar';
        document.getElementById('feriado-form-submit-btn').textContent = 'Salvar';
    } else {
        Utils.showMessage(result.message, 'error');
    }
});

/**
 * Preenche o formulário para edição.
 */
const editFeriado = (feriado) => {
    document.getElementById('feriado-id').value = feriado.id_feriado;
    document.getElementById('feriado-data').value = feriado.data_feriado;
    document.getElementById('feriado-descricao').value = feriado.descricao;
    
    // Adaptação de volta para o nome para preencher o <select>
    const tipoNome = feriado.fk_id_tipo_feriado == 1 ? 'Feriado' : 'Recesso';
    document.getElementById('feriado-tipo').value = tipoNome;

    // Altera o texto do formulário para Edição
    document.getElementById('feriado-form-title').textContent = 'Editar';
    document.getElementById('feriado-form-submit-btn').textContent = 'Atualizar';
};

/**
 * Lida com a exclusão de um feriado.
 */
const deleteFeriado = async (id, descricao) => {
    if (confirm(`Tem certeza que deseja excluir a data não letiva: ${descricao} (${Utils.formatDate(document.getElementById('feriado-data').value)})?`)) {
        const result = await Api.deleteFeriado(id);
        
        if (result.status === 'success') {
            Utils.showMessage(result.message);
            loadFeriadosList();
        } else {
            Utils.showMessage(result.message, 'error');
        }
    }
};

/**
 * Lida com o botão Cancelar/Limpar no formulário de feriados.
 */
btnCancel?.addEventListener('click', () => {
    feriadoForm.reset();
    document.getElementById('feriado-id').value = '';
    document.getElementById('feriado-form-title').textContent = 'Adicionar';
    document.getElementById('feriado-form-submit-btn').textContent = 'Salvar';
});