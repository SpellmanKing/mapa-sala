// public/js/utils.js
const Utils = {
    formatDate: (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    },

    formatCurrency: (value) => {
        if (typeof value !== 'number') return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    populateSelect: (selectElement, data, valueKey, textKey, includeSelectOption = true) => {
        selectElement.innerHTML = ''; 
        if (includeSelectOption) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = `Selecione um(a)...`;
            selectElement.appendChild(defaultOption);
        }
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    },
    
    /**
     * NOVO: Exibe uma notificação Toast no canto da tela (Substitui o alert).
     * @param {string} message A mensagem a ser exibida.
     * @param {string} type O tipo de mensagem ('success', 'error', 'warning').
     * @param {number} duration Duração em milissegundos (padrão: 4000ms).
     */
    showMessage: (message, type = 'success', duration = 4000) => {
        console.log(`[${type.toUpperCase()}] ${message}`);

        const container = document.getElementById('toast-container');
        if (!container) {
            // Fallback caso o container não exista
            alert(`${type.toUpperCase()}: ${message}`);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;

        // Adiciona a mensagem e faz ela aparecer
        container.prepend(toast); 
        setTimeout(() => {
            toast.classList.add('show');
        }, 10); // Pequeno delay para garantir a animação

        // Função que lida com o fechamento do toast
        const closeToast = () => {
            toast.classList.remove('show');
            // Espera a transição (0.3s no CSS) terminar antes de remover do DOM
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        };

        // 1. Fechamento automático após a duração
        setTimeout(closeToast, duration);
        
        // 2. Permite fechar clicando na mensagem
        toast.addEventListener('click', closeToast);
    }
};

// Exporta o objeto Utils para ser usado globalmente
window.Utils = Utils;