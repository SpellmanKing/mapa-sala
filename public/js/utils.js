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
    
    showMessage: (message, type = 'success') => {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Criação dinâmica do container de toasts se não existir
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Configuração do ícone e cor
        const isSuccess = type === 'success';
        const iconClass = isSuccess ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
        const colorClass = isSuccess ? 'toast-success' : (type === 'error' ? 'toast-error' : 'toast-info');

        // Criação do elemento Toast
        const toast = document.createElement('div');
        toast.className = `toast ${colorClass}`;
        toast.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        // Botão fechar
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });

        toastContainer.appendChild(toast);

        // Auto remover após 4 segundos
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    },

    // --- INDICADOR DE CARREGAMENTO (SPINNER) ---
    toggleButtonLoading: (buttonOrId, isLoading) => {
        const btn = typeof buttonOrId === 'string' ? document.getElementById(buttonOrId) : buttonOrId;
        if (!btn) return;
        
        if (isLoading) {
            btn.classList.add('btn-loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
        }
    },

    // --- VALIDAÇÃO DE FORMULÁRIOS ---
    clearValidation: (formId) => {
        const form = document.getElementById(formId);
        if (!form) return;
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.classList.remove('input-error'));
    },

    validateForm: (formId) => {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        Utils.clearValidation(formId);

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('input-error');
                isValid = false;
            }
        });

        if (!isValid) {
            Utils.showMessage('Por favor, preencha todos os campos obrigatórios marcados em vermelho.', 'error');
        }

        return isValid;
    }
};