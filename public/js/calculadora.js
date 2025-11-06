// public/js/calculadora.js

const calculadoraCursoSelect = document.getElementById('calculadora-curso-select');
const calculadoraDataInicio = document.getElementById('calculadora-data-inicio');
const calculadoraDiasSemana = document.getElementById('calculadora-dias-semana');
const courseDetails = document.getElementById('course-details');
const displayCH = document.getElementById('display-ch');
const displayValor = document.getElementById('display-valor');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');

let listaCursos = [];
let cursoSelecionado = null;

// =======================================================
// 1. Inicialização do Módulo e Carregamento de Dados
// =======================================================

/**
 * Função principal para inicializar o módulo da calculadora.
 * Chamada pelo script.js quando a seção é ativada.
 */
const initCalculadora = async () => {
    await loadCursosAndSegmentos();
    setupEventListeners();
    // Garante que o painel de resultados comece oculto
    resultsSection.classList.add('hidden');
};

/**
 * Carrega cursos e segmentos da API e popula os campos.
 */
const loadCursosAndSegmentos = async () => {
    // 1. Carregar Cursos
    const cursosResult = await Api.getCursos();
    if (cursosResult.status === 'success') {
        listaCursos = cursosResult.data;
        // Popula o campo Select de seleção de curso
        Utils.populateSelect(calculadoraCursoSelect, listaCursos, 'id_cursos', 'nome_curso', true);
    } else {
        Utils.showMessage(`Erro ao carregar cursos: ${cursosResult.message}`, 'error');
    }
    
    // 2. Carregar Segmentos (para filtros - implementação simplificada por enquanto)
    const segmentosResult = await Api.fetchData('getSegmentos'); // Usa a rota getSegmentos
    if (segmentosResult.status === 'success') {
        const filterSegmento = document.getElementById('filter-segmento');
        filterSegmento.innerHTML = '<option value="">Todos</option>';
        segmentosResult.data.forEach(segmento => {
            const option = document.createElement('option');
            option.value = segmento;
            option.textContent = segmento;
            filterSegmento.appendChild(option);
        });
    }
};

// =======================================================
// 2. Event Listeners e Lógica de Interface
// =======================================================

/**
 * Configura os listeners de mudança e submissão.
 */
const setupEventListeners = () => {
    // Listener para seleção de curso
    calculadoraCursoSelect.addEventListener('change', handleCourseChange);
    
    // Listener para o botão Gerar Cronograma (implícito na mudança de data/dias)
    calculadoraDataInicio.addEventListener('change', triggerCalculation);
    calculadoraDiasSemana.addEventListener('change', triggerCalculation);
    // Adicionar listener para o turno
    document.getElementById('calculadora-turno').addEventListener('change', triggerCalculation);
};

/**
 * Atualiza os detalhes do curso selecionado e dispara o cálculo se possível.
 */
const handleCourseChange = () => {
    const cursoId = calculadoraCursoSelect.value;
    cursoSelecionado = listaCursos.find(c => c.id_cursos == cursoId);

    if (cursoSelecionado) {
        // Atualiza a interface com detalhes do curso
        displayCH.textContent = cursoSelecionado.carga_horaria;
        displayValor.textContent = Utils.formatCurrency(parseFloat(cursoSelecionado.valor));
        courseDetails.classList.remove('hidden');
        
        // Se já houver uma data de início, tenta calcular
        if (calculadoraDataInicio.value) {
            triggerCalculation();
        }
    } else {
        courseDetails.classList.add('hidden');
    }
};

/**
 * Dispara a chamada à API para calcular a data de término.
 */
const triggerCalculation = async () => {
    if (!cursoSelecionado || !calculadoraDataInicio.value) {
        // Não há dados suficientes para calcular
        resultsSection.classList.add('hidden');
        return;
    }
    
    // 1. Coletar Dias da Semana Selecionados
    const diasCheckboxes = calculadoraDiasSemana.querySelectorAll('input[type="checkbox"]:checked');
    if (diasCheckboxes.length === 0) {
        resultsSection.classList.add('hidden');
        return;
    }
    
    // Os valores dos checkboxes devem ser 1 (Seg) a 5 (Sex)
    const diasSelecionados = Array.from(diasCheckboxes).map(cb => cb.value || cb.getAttribute('data-day-value')); 
    
    // Adicionar um mapeamento de nomes de dias para números se os valores não estiverem nos inputs
    // Nosso HTML usa data-day="segunda" e o backend espera 1-5.
    const diasMap = { 'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5 };
    const diasNumericos = Array.from(diasCheckboxes)
        .map(cb => diasMap[cb.getAttribute('data-day')] || cb.value) // Prioriza o value numérico, se existir
        .filter(n => n >= 1 && n <= 5); // Filtra apenas números válidos

    // 2. Preparar dados para a API
    const dataToCalculate = {
        ch: cursoSelecionado.carga_horaria,
        inicio: calculadoraDataInicio.value,
        dias: diasNumericos.join(',') // Envia como string separada por vírgula (ex: "1,3,5")
    };
    
    // 3. Chamar a API (RF02)
    const result = await Api.calcularDataTermino(dataToCalculate);

    if (result.status === 'success') {
        renderCalculationResult(result.data_termino);
    } else {
        Utils.showMessage(`Erro no cálculo: ${result.message}`, 'error');
        resultsSection.classList.add('hidden');
    }
};

// =======================================================
// 3. Renderização dos Resultados
// =======================================================

/**
 * Exibe a data de término e outras métricas.
 */
const renderCalculationResult = (dataTermino) => {
    // 1. Limpar e mostrar seção de resultados
    resultsContent.innerHTML = '';
    resultsSection.classList.remove('hidden');

    // 2. Calcular a duração total em dias
    const inicio = new Date(calculadoraDataInicio.value);
    const termino = new Date(dataTermino);
    const diffTime = Math.abs(termino - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia de início

    // 3. Exibir Métricas
    const metricsPanel = document.getElementById('metrics-panel');
    metricsPanel.classList.remove('hidden');
    document.getElementById('total-hours-value').textContent = cursoSelecionado.carga_horaria;
    document.getElementById('duration-value').textContent = diffDays;
    
    // 4. Exibir Cronograma Gerado
    resultsContent.innerHTML = `
        <h3>Data de Início: ${Utils.formatDate(calculadoraDataInicio.value)}</h3>
        <h3>Data de Término Estimada: <span style="color: var(--secondary-color);">${Utils.formatDate(dataTermino)}</span></h3>
        <p style="margin-top: 10px;">
            <i class="fas fa-info-circle"></i> Esta data considera a carga horária de ${cursoSelecionado.carga_horaria}h e os feriados/recessos cadastrados.
        </p>
    `;
    
    // O painel calendário visual (calendar-visual) e a barra de progresso (progress-bar-container)
    // são mais complexos e seriam implementados em fases avançadas. Por enquanto, focamos nas métricas RF02.
    document.getElementById('calendar-visual').classList.add('hidden');
    document.getElementById('progress-bar-container').classList.add('hidden');
    document.getElementById('progress-legend').classList.add('hidden');
    document.getElementById('export-pdf-button').classList.add('hidden');
};

// Exporta a função de inicialização para ser usada pelo script.js
window.initCalculadora = initCalculadora;