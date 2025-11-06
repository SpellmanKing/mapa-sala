// public/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    // -----------------------------------------------------
    // 1. Lógica de Navegação da Sidebar (Router)
    // -----------------------------------------------------
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            // Gerenciar Classes 'active'
            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            // Inicializar Módulos Específicos da Seção
            switch (targetId) {
                case 'painel-visual':
                    if (typeof loadPainelVisual === 'function') { loadPainelVisual(); }
                    break;
                case 'calculadora-inteligente':
                    if (typeof initCalculadora === 'function') { initCalculadora(); }
                    break;
                case 'gerenciar-instrutores':
                    if (typeof initGerenciarInstrutores === 'function') { initGerenciarInstrutores(); }
                    break;
                case 'gerenciar-cursos':
                    if (typeof initGerenciarCursos === 'function') {
                        initGerenciarCursos();
                    }
                    break;
            }
        });
    });

    // -----------------------------------------------------
    // 2. Inicialização Global
    // -----------------------------------------------------
    
    // 2.1. Inicializa lógica de modais (fechar, abrir)
    if (typeof initModals === 'function') { initModals(); }
    
    // 2.2. Inicializa o Painel Visual, pois é a tela padrão
    if (typeof initPainelVisual === 'function') { initPainelVisual(); }
    
    // 2.3. Inicializa o módulo de Agendar Turma para preencher selects e listeners
    if (typeof initAgendarTurma === 'function') { initAgendarTurma(); }
    
    // 2.4. Adiciona evento para o botão "Gerenciar Feriados"
    document.getElementById('gerenciar-feriados')?.addEventListener('click', () => {
        if (typeof openModal === 'function') { openModal('feriado-modal'); }
        if (typeof loadFeriadosList === 'function') { loadFeriadosList(); }
    });

    // Ocultar todas as seções, exceto a inicial (Painel Visual)
    document.getElementById('painel-visual')?.classList.add('active');
});