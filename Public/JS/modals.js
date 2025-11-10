// public/js/modals.js
// Lógica para abrir/fechar modais, pois é usada em vários lugares

const initModals = () => {
    // Adiciona evento de clique aos botões que abrem os modais
    document.getElementById('gerenciar-feriados')?.addEventListener('click', () => {
        openModal('feriado-modal');
        // Inicializa a lista de feriados ao abrir
        if (typeof loadFeriadosList === 'function') {
            loadFeriadosList();
        }
    });

    // Adiciona evento de clique aos botões de fechar (x)
    document.querySelectorAll('.modal .close-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Adiciona evento de clique fora do modal para fechar
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
};

const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
};

const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        // Opcional: Limpar formulário ao fechar
        const form = modal.querySelector('form');
        if (form) {
             form.reset();
        }
        // Limpar ID de edição
        document.getElementById('feriado-id').value = '';
        document.getElementById('feriado-form-title').textContent = 'Adicionar';
        document.getElementById('feriado-form-submit-btn').textContent = 'Salvar';
    }
};