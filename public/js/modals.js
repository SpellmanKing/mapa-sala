/**
 * public/js/modals.js
 * Lógica para manipulação dos modais (abrir/fechar).
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE MODAIS E BOTÕES GERAIS ---
    const modais = {
        agendamento: document.getElementById('agendamento-modal'),
        detalhes: document.getElementById('detalhes-modal'),
        alocacao: document.getElementById('alocacao-modal'),
        instrutor: document.getElementById('instrutor-modal'),
        curso: document.getElementById('curso-modal'), 
        feriado: document.getElementById('feriado-modal') 
    };
    
    // Supondo que 'feriado-modal' e outros modais estejam corretamente definidos no index.php
    for (const key in modais) {
        if (!modais[key]) {
             SGST.Utils.log('DOM_WARN', `Modal de ${key} ('#${key}-modal') não encontrado.`);
        }
    }

    const closeBtns = document.querySelectorAll('.modal .close-btn, .modal .secondary-btn');
    const modalBackdrops = document.querySelectorAll('.modal');

    /**
     * -----------------------------------------------------
     * FUNÇÕES GERAIS DE MODAL
     * -----------------------------------------------------
     */

    /**
     * Abre um modal específico.
     * @param {HTMLElement} modalElement - O elemento DOM do modal.
     */
    SGST.openModal = (modalElement) => {
        if (!modalElement) return;
        modalElement.style.display = 'flex';
        // Adiciona classe para transição (se o CSS suportar)
        setTimeout(() => modalElement.classList.add('open'), 10); 
    };

    /**
     * Fecha um modal específico.
     * @param {HTMLElement} modalElement - O elemento DOM do modal.
     */
    SGST.closeModal = (modalElement) => {
        if (!modalElement) return;
        modalElement.classList.remove('open');
        // Espera a transição CSS terminar para remover o display: flex
        setTimeout(() => {
            modalElement.style.display = 'none';
        }, 300); 
    };
    
    /**
     * Handler para fechar modais.
     * @param {Event} event - O evento de clique (pode ser um botão 'X' ou 'Cancelar').
     */
    const handleCloseModal = (event) => {
        event.preventDefault();
        // Encontra o modal pai do botão clicado
        const modalElement = event.target.closest('.modal');
        
        if (modalElement) {
            // Lógica específica: se for o modal de feriado, limpa os campos após fechar
            if (modalElement === modais.feriado) {
                const feriadoForm = document.getElementById('feriado-form');
                if (feriadoForm) SGST.Utils.clearForm(feriadoForm);
            }
             // Se for o modal de agendamento, reseta o estado da alocação
            if (modalElement === modais.agendamento && SGST.Alocacao) {
                SGST.Alocacao.resetAlocacaoState();
            }
            
            SGST.closeModal(modalElement);
        }
    };

    /**
     * Handler para fechar modais ao clicar fora (no backdrop).
     * @param {Event} event - O evento de clique.
     */
    const handleOutsideClick = (event) => {
        // Itera sobre todos os modais para ver se o clique foi no backdrop
        for (const key in modais) {
            const modalElement = modais[key];
            if (modalElement && modalElement === event.target) {
                 // Dispara o mesmo handler de fechar, para limpar o formulário se necessário
                handleCloseModal({ target: modalElement });
                break;
            }
        }
    };

    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */

    SGST.Modals = {
        init: () => {
            // Adiciona listeners aos botões de fechar e cancelar
            closeBtns.forEach(btn => {
                btn.addEventListener('click', handleCloseModal);
            });

            // Adiciona listener para fechar modais ao clicar fora
            modalBackdrops.forEach(backdrop => {
                backdrop.addEventListener('click', handleOutsideClick);
            });
            
            // Mapeia os modais para o objeto SGST global
            SGST.Modals.Elements = modais;

            SGST.Utils.log('MODALS_INIT', 'Modals listeners inicializados.');
        }
    };

})();