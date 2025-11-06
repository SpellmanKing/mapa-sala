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
        alert(`${type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : 'Atenção'}: ${message}`);
    }
};