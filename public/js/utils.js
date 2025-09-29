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
     * Adiciona um elemento div no body e o remove após um tempo.
     * @param {string} message - A mensagem a ser exibida.
     * @param {('success'|'error'|'warning'|'info')} type - Tipo da mensagem (para estilização).
     */
    SGST.Utils.showToast = (message, type = 'info') => {
        // Cria ou encontra o container
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            // Adiciona o CSS básico do container
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column-reverse; /* Novas mensagens ficam no topo */
            `;
            document.body.appendChild(container);
        }

        // Cria o elemento toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Estilização base do toast (complementar ao style.css)
        toast.style.cssText = `
            margin-bottom: 10px;
            padding: 10px 20px;
            border-radius: 5px;
            color: #fff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.5s, transform 0.5s;
            transform: translateX(100%);
            cursor: pointer;
        `;
        
        // Estilos específicos de tipo
        switch (type) {
            case 'success': toast.style.backgroundColor = '#4CAF50'; break;
            case 'error': toast.style.backgroundColor = '#F44336'; break;
            case 'warning': toast.style.backgroundColor = '#FF9800'; break;
            case 'info': 
            default: toast.style.backgroundColor = '#2196F3'; break;
        }

        container.appendChild(toast);

        // Animação de entrada
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Animação de saída e remoção
        const timeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 500); // Espera a transição terminar
        }, 5000); // 5 segundos de exibição

        // Clicar no toast remove ele imediatamente
        toast.addEventListener('click', () => {
            clearTimeout(timeout);
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 500);
        });
    };
    
    /**
     * -----------------------------------------------------
     * FUNÇÕES HELPERS DE DOM
     * -----------------------------------------------------
     */
    
    /**
     * Valida um formulário, verificando se todos os campos obrigatórios estão preenchidos.
     * @param {HTMLElement} formElement - O formulário HTML a ser validado.
     * @returns {boolean} - True se o formulário for válido.
     */
    SGST.Utils.validateForm = (formElement) => {
        let isValid = true;
        const requiredFields = formElement.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            // Remove qualquer classe de erro anterior
            field.classList.remove('input-error');
            
            if (field.type === 'number' && field.value <= 0) {
                 field.classList.add('input-error');
                 isValid = false;
            } else if (!field.value.trim()) {
                field.classList.add('input-error');
                isValid = false;
            }
        });

        if (!isValid) {
            SGST.Utils.showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            SGST.Utils.log('VALIDATION', 'Formulário inválido: campos obrigatórios não preenchidos.');
        }

        return isValid;
    };

    /**
     * Limpa todos os campos de um formulário.
     * @param {HTMLElement} formElement - O formulário HTML.
     */
    SGST.Utils.clearForm = (formElement) => {
        formElement.reset();
        formElement.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        // Limpa inputs hidden específicos, se necessário
        const hiddenIds = ['agendamento-salas-id', 'feriado-id'];
        hiddenIds.forEach(id => {
            const input = formElement.querySelector(`#${id}`);
            if (input) input.value = '';
        });
    };

    /**
     * Atualiza um elemento SELECT com dados de uma lista.
     * @param {string} selector - Seletor CSS para o elemento <select>.
     * @param {Array<object>} data - Array de objetos com { id, nome }.
     * @param {string} idKey - Chave do ID no objeto de dados.
     * @param {string} nameKey - Chave do nome no objeto de dados.
     * @param {string} [defaultText='Selecione...'] - Texto da primeira opção.
     * @param {string|number} [selectedValue=null] - O valor a ser selecionado por padrão.
     */
    SGST.Utils.populateSelect = (selector, data, idKey, nameKey, defaultText = 'Selecione...', selectedValue = null) => {
        const select = document.querySelector(selector);
        if (!select) {
            SGST.Utils.log('DOM_ERROR', `Elemento SELECT não encontrado: ${selector}`);
            return;
        }

        select.innerHTML = ''; // Limpa as opções existentes

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        select.appendChild(defaultOption);

        data.forEach(item => {
            const option = document.createElement('option');
            // Garante que o ID é tratado como string para comparação
            option.value = String(item[idKey]); 
            option.textContent = item[nameKey];

            if (selectedValue !== null && String(item[idKey]) === String(selectedValue)) {
                option.selected = true;
            }

            select.appendChild(option);
        });
    };

    /**
     * Exibe ou oculta um elemento de carregamento global.
     * (Assume a existência de um elemento com ID 'loading-spinner' no index.php)
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
    
})();