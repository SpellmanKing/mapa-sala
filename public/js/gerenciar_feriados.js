/**
 * public/js/gerenciarFeriados.js
 * Lógica para a seção 'Gerenciar Feriados' (CRUD).
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM
    const feriadoSection = document.getElementById('gerenciar-feriados');
    const feriadoForm = document.getElementById('feriado-form');
    const feriadoListBody = document.getElementById('feriado-list-view');
    const addFeriadoBtn = feriadoSection ? feriadoSection.querySelector('#feriado-form-submit-btn') : null;

    if (!feriadoForm || !feriadoListBody || !addFeriadoBtn) {
        SGST.Utils.log('DOM_WARN', "Elementos de Feriados não encontrados. O módulo será desabilitado.");
        return;
    }

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE DADOS (CRUD)
     * -----------------------------------------------------
     */

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
     * Submete o formulário (Adicionar/Editar).
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!SGST.Utils.validateForm(feriadoForm)) return;
        
        const isEdit = !!document.getElementById('feriado-id').value;
        const feriadoId = document.getElementById('feriado-id').value;

        const payload = {
            id_feriado: isEdit ? parseInt(feriadoId) : undefined, // O controller PUT espera id_feriado
            data_feriado: feriadoForm.querySelector('#feriado-data').value,
            descricao: feriadoForm.querySelector('#feriado-descricao').value,
            tipo: feriadoForm.querySelector('#feriado-tipo').value
        };

        SGST.Utils.toggleLoading(true);
        try {
            let response;
            if (isEdit) {
                response = await API.updateFeriado(payload);
            } else {
                response = await API.addFeriado(payload);
            }
            
            SGST.Utils.showToast(response.message || 'Operação realizada com sucesso!', 'success');
            SGST.closeModal(SGST.Modals.Elements.feriado);
            SGST.Utils.clearForm(feriadoForm);
            loadFeriados(); // Recarrega a lista e o calendário

        } catch (error) {
            SGST.Utils.showToast(`Erro ao salvar: ${error.message}`, 'error');
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
            // Inicializa a lista ao abrir a seção
            SGST.activeSectionHandlers['gerenciar-feriados'] = loadFeriados;

            // Listener para o botão de adicionar
            addFeriadoBtn.addEventListener('click', () => {
                SGST.Utils.clearForm(feriadoForm);
                const modalTitle = document.getElementById('feriado-modal');
                if (modalTitle) modalTitle.textContent = 'Adicionar Feriado/Recesso';
                SGST.openModal(SGST.Modals.Elements.feriado);
            });
            
            // Listener para o formulário (POST/PUT)
            feriadoForm.addEventListener('submit', handleSubmit);
            
            SGST.Utils.log('FERIADOS_INIT', 'Gerenciar Feriados listeners inicializados.');
        }
    };

})();