/**
 * public/js/utils.js
 * Utilitários gerais para manipulação do DOM, logging e mensagens de feedback (toasts).
 */

(function() {
    // Objeto global de utilidades
    window.SGST = window.SGST || {};
    SGST.Utils = {};

    /**
     * -----------------------------------------------------
     * SISTEMA DE LOGGING E TOASTS
     * -----------------------------------------------------
     */

    /**
     * Logs com tags coloridas no console para facilitar o debug.
     * @param {string} tag - Tag do log (ex: 'API_REQUEST', 'DOM_UPDATE').
     * @param {any} data - Dados a serem logados.
     */
    SGST.Utils.log = (tag, data) => {
        const now = new Date().toLocaleTimeString();
        let color = 'gray';
        switch (tag) {
            case 'API_REQUEST': color = 'blue'; break;
            case 'API_SUCCESS': color = 'green'; break;
            case 'API_ERROR': 
            case 'API_TIMEOUT': 
            case 'API_FATAL_ERROR': color = 'red'; break;
            case 'VALIDATION': color = 'orange'; break;
            default: color = 'darkgray'; break;
        }
        console.log(`%c[${now}] [${tag}]`, `color: ${color}; font-weight: bold;`, data);
    };

    /**
     * Exibe uma mensagem de notificação (toast) no canto da tela.
     * @param {string} message - Mensagem a ser exibida.
     * @param {string} type - Tipo de mensagem ('success', 'error', 'info').
     */
    SGST.Utils.showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.classList.add('toast', `toast-${type}`);
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
        } else {
            // Se o container não existir, cria um no body
            const newContainer = document.createElement('div');
            newContainer.id = 'toast-container';
            document.body.appendChild(newContainer);
            newContainer.appendChild(toast);
        }

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    };

    /**
     * Limpa todos os campos de um formulário.
     * @param {HTMLElement} formElement - O elemento <form> a ser limpo.
     */
    SGST.Utils.clearForm = (formElement) => {
        if (!formElement) return;

        Array.from(formElement.elements).forEach(element => {
            // Limpa campos de texto, número, email
            if (['text', 'number', 'email', 'hidden', 'date'].includes(element.type)) {
                element.value = '';
            } 
            // Reseta selects
            else if (element.tagName === 'SELECT') {
                element.selectedIndex = 0;
            } 
            // Desmarca checkboxes e radio buttons
            else if (['checkbox', 'radio'].includes(element.type)) {
                element.checked = false;
            }
        });
        SGST.Utils.log('FORM_CLEAR', `Formulário ${formElement.id} limpo.`);
    };

    /**
     * Preenche um <select> com dados da API.
     * @param {string} selector - Seletor CSS do elemento <select>.
     * @param {array} data - Array de objetos a serem usados.
     * @param {string} idKey - Chave do ID no objeto (ex: 'id_cursos').
     * @param {string} nameKey - Chave do nome a ser exibido (ex: 'nome_curso').
     * @param {string} defaultText - Texto da opção padrão (opcional).
     * @param {any} selectedValue - Valor a ser pré-selecionado (opcional).
     */
    SGST.Utils.populateSelect = (selector, data, idKey, nameKey, defaultText = 'Selecione...', selectedValue = null) => {
        const select = document.querySelector(selector);
        if (!select) {
            SGST.Utils.log('DOM_ERROR', `Seletor ${selector} não encontrado para população.`);
            return;
        }
        
        select.innerHTML = ''; // Limpa as opções existentes

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        defaultOption.disabled = (defaultText === 'Selecione...');
        defaultOption.hidden = true;
        defaultOption.selected = true; 
        select.appendChild(defaultOption);

        data.forEach(item => {
            const option = document.createElement('option');
            // Garante que o ID é tratado como string para comparação
            option.value = String(item[idKey]); 
            option.textContent = item[nameKey];

            if (selectedValue !== null && String(item[idKey]) === String(selectedValue)) {
                option.selected = true;
                defaultOption.selected = false; // Se um valor for selecionado, desmarca o default
            }

            select.appendChild(option);
        });
    };

    /**
     * Exibe ou oculta um elemento de carregamento global.
     * @param {boolean} show - True para exibir, False para ocultar.
     */
    SGST.Utils.toggleLoading = (show) => {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    };

    /**
     * -----------------------------------------------------
     * FUNÇÕES HELPERS DE DATA/HORA
     * -----------------------------------------------------
     */

    /**
     * Formata uma data (YYYY-MM-DD) para exibição (DD/MM/YYYY).
     */
    SGST.Utils.formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const parts = dateString.split('-'); // YYYY, MM, DD
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        } catch (e) {
            return dateString;
        }
    };
    
    /**
     * Retorna o dia da semana em Português.
     * @param {number} dayIndex - Índice do dia da semana (0=Dom, 1=Seg, ... 6=Sáb).
     */
    SGST.Utils.getDayName = (dayIndex) => {
         const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
         return days[dayIndex];
    };

    // Função de inicialização
    SGST.Utils.init = () => {
        // Nada a inicializar aqui, as funções são expostas no SGST.Utils
        SGST.Utils.log('UTILS_INIT', 'Utilitários JS carregados.');
    };

})();