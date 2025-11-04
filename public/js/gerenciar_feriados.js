/**
 * public/js/gerenciarFeriados.js
 * Lógica para a seção 'Gerenciar Feriados' (CRUD).
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM (Assumidos no Modal de Feriados, que deve ser adicionado ao index.php)
    const feriadoModal = document.getElementById('feriado-modal');
    if (!feriadoModal) {
        // Cria um placeholder para o modal que falta no DOM
        window.SGST.Modals = window.SGST.Modals || { Elements: {} };
        window.SGST.Modals.Elements.feriado = document.createElement('div');
    }

    // Seletores que DEVEM existir no Modal de Feriados:
    const feriadoForm = feriadoModal.querySelector('#feriado-form') || document.createElement('form');
    const feriadoListBody = feriadoModal.querySelector('#feriado-list-view') || document.createElement('div');
    const addFeriadoBtn = feriadoModal.querySelector('#feriado-form-submit-btn') || document.createElement('button');

    /**
     * Lida com a submissão do formulário (POST/PUT).
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        SGST.Utils.toggleLoading(true);
        
        // Coleta de dados
        const feriadoId = feriadoForm.querySelector('#feriado-id')?.value;
        const dataFeriado = feriadoForm.querySelector('#feriado-data')?.value;
        const descricao = feriadoForm.querySelector('#feriado-descricao')?.value;
        const tipo = feriadoForm.querySelector('#feriado-tipo')?.value; // String ('feriado' ou 'recesso')

        if (!dataFeriado || !descricao || !tipo) {
            SGST.Utils.showToast('Todos os campos são obrigatórios.', 'error');
            SGST.Utils.toggleLoading(false);
            return;
        }
        
        const payload = {
            data_feriado: dataFeriado,
            descricao: descricao,
            tipo: tipo 
        };
        
        try {
            let response;
            if (feriadoId) { // PUT (Update)
                payload.id_feriado = parseInt(feriadoId);
                response = await API.updateFeriado(payload);
            } else { // POST (Create)
                response = await API.createFeriado(payload);
            }
            
            SGST.Utils.showToast(response.message || 'Operação concluída com sucesso!', 'success');
            // Fechamento e recarga do painel
            SGST.closeModal(feriadoModal);
            SGST.Feriados.loadFeriados(); 
            SGST.Painel.loadAllDataAndRender();
            
        } catch (error) {
             SGST.Utils.showToast(`Falha na operação: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * Carrega e renderiza a lista de feriados.
     */
    const loadFeriados = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            const feriados = await API.getFeriados();
            SGST.feriados = feriados.map(f => f.data_feriado); // Atualiza estado global
            renderFeriadosList(feriados);
            // Se o Painel estiver ativo, recarrega o calendário para refletir as mudanças
            if (document.querySelector('.nav-item.active').dataset.target === 'painel-visual') {
                 SGST.Painel.loadAllDataAndRender();
            }
        } catch (error) {
            SGST.Utils.showToast(`Erro ao carregar feriados: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };
    

    /**
     * Exclui um feriado.
     */
    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este feriado/recesso?')) return;
        
        SGST.Utils.toggleLoading(true);
        try {
            const response = await API.deleteFeriado(id);
            SGST.Utils.showToast(response.message || 'Excluído com sucesso!', 'success');
            loadFeriados();
        } catch (error) {
            SGST.Utils.showToast(`Erro ao excluir: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE RENDERIZAÇÃO
     * -----------------------------------------------------
     */

    /**
     * Preenche a tabela com a lista de feriados.
     */
    const renderFeriadosList = (feriados) => {
        feriadoListBody.innerHTML = '';
        if (feriados.length === 0) {
            feriadoListBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum feriado ou recesso cadastrado.</td></tr>';
            return;
        }

        feriados.forEach(f => {
            const row = feriadoListBody.insertRow();
            row.dataset.id = f.id_feriado;
            
            row.insertCell().textContent = SGST.Utils.formatDate(f.data_feriado);
            row.insertCell().textContent = f.descricao;
            row.insertCell().textContent = f.tipo.charAt(0).toUpperCase() + f.tipo.slice(1); // Capitaliza

            // Coluna de Ações
            const actionsCell = row.insertCell();
            actionsCell.className = 'action-buttons';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'icon-button edit-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => populateFormForEdit(f));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-button delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => handleDelete(f.id_feriado));

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    };
    
    /**
     * Preenche o modal para edição.
     */
    const populateFormForEdit = (feriado) => {
        const modalTitle = document.getElementById('feriado-modal');
        
        // Assume os IDs: feriado-id, feriado-data, feriado-descricao, feriado-tipo
        document.getElementById('feriado-id').value = feriado.id_feriado; 
        document.getElementById('feriado-data').value = feriado.data_feriado;
        document.getElementById('feriado-descricao').value = feriado.descricao;
        document.getElementById('feriado-tipo').value = feriado.tipo;

        if (modalTitle) modalTitle.textContent = 'Editar Feriado/Recesso';
        
        SGST.openModal(SGST.Modals.Elements.feriado);
    };

    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */
     
    SGST.Feriados = {
        loadFeriados: loadFeriados,
        init: () => {
             // Listener para o formulário (POST/PUT)
            feriadoForm.addEventListener('submit', handleSubmit);
        }
    };

})();