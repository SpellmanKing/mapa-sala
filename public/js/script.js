/**
 * public/js/script.js (Atualizado)
 * * MINI-README:
 * * 1. ORDEM DE INCLUSÃO (Tags <script> no index.php):
 * - public/js/api.js
 * - public/js/utils.js
 * - public/js/modals.js
 * - public/js/agendarTurma.js
 * - public/js/alocacaoAutomatica.js
 * - public/js/gerenciarFeriados.js
 * - public/js/calculadora.js
 * - public/js/painel.js
 * - public/js/detalheTurma.js
 * - public/js/script.js  <-- Este arquivo deve ser o último.
 *
 * 2. TESTE RÁPIDO: 
 * - Abra o 'index.php' no navegador.
 * - Verifique o console para a tag [GLOBAL_INIT].
 * - O calendário do Painel Visual deve ser carregado com os agendamentos e feriados.
 * - A navegação entre seções deve funcionar, disparando a função de inicialização de cada módulo (ex: Gerenciar Feriados).
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ESTADO DA APLICAÇÃO (Variáveis Globais) --
    window.SGST = window.SGST || {}; // Objeto namespace global
    
    // Dados globais carregados do backend
    SGST.agendamentos = [];
    SGST.dadosSalas = [];
    SGST.dadosCursos = [];
    SGST.dadosInstrutores = [];
    SGST.feriados = []; // Apenas array de strings de datas (YYYY-MM-DD)
    
    // Mapeamento de funções de inicialização por seção
    SGST.activeSectionHandlers = {};

    // --- 2. SELETORES DE ELEMENTOS DO DOM --
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    /**
     * -----------------------------------------------------
     * FUNÇÕES GLOBAIS DA APLICAÇÃO
     * -----------------------------------------------------
     */

    /**
     * Alterna a seção visível do painel.
     * @param {string} targetId - O ID da seção a ser exibida.
     */
    const navigateTo = (targetId) => {
        // Atualiza o menu de navegação
        navItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Atualiza a seção de conteúdo
        contentSections.forEach(section => {
            if (section.id === targetId) {
                section.style.display = 'block';
                // Dispara o handler de carregamento da seção (se existir)
                if (SGST.activeSectionHandlers[targetId]) {
                    SGST.activeSectionHandlers[targetId]();
                }
            } else {
                section.style.display = 'none';
            }
        });
        
        SGST.Utils.log('NAVIGATION', `Navegando para: ${targetId}`);
    };

    /**
     * Carrega os dados iniciais comuns a mais de um módulo.
     */
    const carregarDadosIniciais = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            // Carrega dados para Agendamento/Detalhe/Alocação
            await Promise.all([
                 API.getAllCursos().then(data => SGST.dadosCursos = data),
                 API.getAllInstrutores().then(data => SGST.dadosInstrutores = data),
                 API.getAllSalas().then(data => SGST.dadosSalas = data),
            ]);
            
            // Popula os selects do modal de agendamento e detalhes
            SGST.Agendamento.loadFormOptions(); 
            SGST.Utils.populateSelect('#detalhes-instrutor', SGST.dadosInstrutores, 'id_instrutores', 'nome_instrutor', 'Manter Atual');

        } catch (error) {
            SGST.Utils.showToast(`Erro fatal ao carregar dados iniciais: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };


    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO DA APLICAÇÃO
     * -----------------------------------------------------
     */
     
    const setupEventListeners = () => {
        // Listeners de navegação lateral
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(item.dataset.target);
            });
        });
        
        // Inicializa todos os módulos com checagem defensiva:
        // Verifica se o objeto do módulo existe E se a função .init existe.
        SGST.Utils && SGST.Utils.init && SGST.Utils.init();
        SGST.Modals && SGST.Modals.init && SGST.Modals.init();
        SGST.Painel && SGST.Painel.init && SGST.Painel.init();
        
        // Se a correção do erro anterior ainda não funcionou, pode ser aqui:
        SGST.Feriados && SGST.Feriados.init && SGST.Feriados.init(); 
        SGST.Calculadora && SGST.Calculadora.init && SGST.Calculadora.init();
        SGST.Alocacao && SGST.Alocacao.init && SGST.Alocacao.init();
        SGST.Agendamento && SGST.Agendamento.init && SGST.Agendamento.init();
        SGST.DetalheTurma && SGST.DetalheTurma.init && SGST.DetalheTurma.init();
    };

    // --- INICIA A APLICAÇÃO --
    setupEventListeners();
    carregarDadosIniciais(); // Carrega os dados globais para todos os módulos

    // Define o handler de inicialização do Painel Visual
    SGST.activeSectionHandlers['painel-visual'] = SGST.Painel.loadAllDataAndRender;

    // Navega para a seção padrão (Painel Visual)
    navigateTo('painel-visual');
    SGST.Utils.log('GLOBAL_INIT', 'Sistema SGST inicializado com sucesso.');
});