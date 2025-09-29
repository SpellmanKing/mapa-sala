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
        instrutor: document.getElementById('instrutor-modal'), // Gerenciar Instrutores
        curso: document.getElementById('curso-modal'), // Gerenciar Cursos
        feriado: document.getElementById('feriado-modal') // Gerenciar Feriados (SUPOSIÇÃO DE ID: feriado-modal, pois o index.php não o define explicitamente)
    };
    
    // Supondo a existência de um ID 'feriado-modal' para a seção 'gerenciar-feriados'
    if (!modais.feriado) {
        SGST.Utils.log('DOM_WARN', "Modal de Feriado ('#feriado-modal') não encontrado. Criando um placeholder para evitar erros.");
        // Cria um elemento placeholder para o modal de feriado se não existir
        modais.feriado = document.createElement('div');
        modais.feriado.id = 'feriado-modal'; 
    }

    const closeBtns = document.querySelectorAll('.modal .close-btn, .modal .secondary-btn');

    /**
     * -----------------------------------------------------
     * FUNÇÕES GERAIS DE MODAL
     * -----------------------------------------------------
     */
    
    /**
     * Abre um modal.
     * @param {HTMLElement} modalElement - O elemento do modal.
     */
    SGST.openModal = (modalElement) => {
        if (modalElement) {
            modalElement.style.display = 'block';
            modalElement.classList.add('is-active'); // Para estilização via CSS
        }
    };

    /**
     * Fecha um modal.
     * @param {HTMLElement} modalElement - O elemento do modal.
     */
    SGST.closeModal = (modalElement) => {
        if (modalElement) {
            modalElement.style.display = 'none';
            modalElement.classList.remove('is-active');
        }
    };

    /**
     * Handler para fechar modais ao clicar no botão de fechar ou cancelar.
     * @param {Event} event - O evento de clique.
     */
    const handleCloseModal = (event) => {
        const modalContent = event.target.closest('.modal-content');
        if (modalContent) {
             // Encontra o modal pai do botão clicado
            const modalElement = event.target.closest('.modal');
            if (modalElement) {
                // Se for o formulário de Agendamento, limpa os campos após fechar
                if (modalElement === modais.agendamento) {
                    SGST.Utils.clearForm(document.getElementById('agendamento-form'));
                    // Reseta estado da alocação se for o modal de agendamento
                    SGST.Alocacao.resetAlocacaoState(); 
                }
                 // Se for o formulário de Feriado, limpa os campos após fechar
                if (modalElement === modais.feriado) {
                    SGST.Utils.clearForm(document.getElementById('feriado-form')); // SUPOSIÇÃO ID
                }
                
                SGST.closeModal(modalElement);
            }
        }
    };

    /**
     * Handler para fechar modais ao clicar fora.
     * @param {Event} event - O evento de clique.
     */
    const handleOutsideClick = (event) => {
        for (const key in modais) {
            if (modais[key] === event.target) {
                // Dispara o mesmo handler de fechar, para limpar o formulário se necessário
                handleCloseModal({ target: modais[key] });
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
            document.addEventListener('click', handleOutsideClick);
            
            // Mapeia os modais para o objeto SGST global
            SGST.Modals.Elements = modais;

            SGST.Utils.log('MODALS_INIT', 'Modals listeners inicializados.');
        }
    };

})();