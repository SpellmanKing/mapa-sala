/**
 * public/js/calculadora.js
 * Lógica para a seção 'Calculadora Inteligente' e cálculo de Cronograma.
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM
    const calculadoraDOM = {
        // Filtros
        filterSegmento: document.getElementById('filter-segmento'), // SUPOSIÇÃO ID
        filterModalidade: document.getElementById('filter-modalidade'), // SUPOSIÇÃO ID
        filterNomeCurso: document.getElementById('filter-nome-curso'), // SUPOSIÇÃO ID
        filterChMin: document.getElementById('filter-ch-min'),
        filterChMax: document.getElementById('filter-ch-max'),
        filterTem: document.getElementById('filter-tem'),
        filterBolsa: document.getElementById('filter-bolsa'),
        applyFiltersButton: document.getElementById('apply-filters-button'),
        clearFiltersButton: document.getElementById('clear-filters-button'),
        
        // Formulário de Cálculo
        courseSelect: document.getElementById('calculadora-curso-select'),
        dataInicioInput: document.getElementById('calculadora-data-inicio'),
        turnoSelect: document.getElementById('calculadora-turno'),
        remotePercentageSelect: document.getElementById('calculadora-porcentagem-remoto'),
        remoteDetailsOptions: document.getElementById('remote-details-options'),
        diasSemanaContainer: document.getElementById('calculadora-dias-semana'),
        
        // Resultados
        dataTerminoDisplay: document.getElementById('data-termino-resultado'),
        diasLetivosTableBody: document.getElementById('dias-letivos-table-body'),
        exportPdfButton: document.getElementById('export-pdf-button')
    };

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE FILTRO DE CURSOS
     * -----------------------------------------------------
     */

    /**
     * Coleta os filtros e chama a API para buscar e popular a lista de cursos.
     */
    const filterAndPopulateCourses = async () => {
        const filtros = {};
        
        // Coleta todos os filtros
        if (calculadoraDOM.filterSegmento.value) filtros.segmento = calculadoraDOM.filterSegmento.value;
        if (calculadoraDOM.filterModalidade.value) filtros.modalidade = calculadoraDOM.filterModalidade.value;
        if (calculadoraDOM.filterNomeCurso.value) filtros.nome_curso = calculadoraDOM.filterNomeCurso.value;
        if (calculadoraDOM.filterChMin.value) filtros.ch_min = calculadoraDOM.filterChMin.value;
        if (calculadoraDOM.filterChMax.value) filtros.ch_max = calculadoraDOM.filterChMax.value;
        if (calculadoraDOM.filterTem.checked) filtros.tem = 'true';
        if (calculadoraDOM.filterBolsa.checked) filtros.bolsa = 'true';

        SGST.Utils.toggleLoading(true);
        try {
            // A API.buscarCursosComFiltros usa o controller calculadora_inteligente.php GET
            const cursos = await API.buscarCursosComFiltros(filtros);
            SGST.dadosCursos = cursos; // Armazena todos os cursos (com os dados extras, se existirem)
            
            SGST.Utils.populateSelect(
                '#calculadora-curso-select', 
                cursos, 
                'id_cursos', 
                'nome_curso', 
                'Selecione o Curso'
            );
            
            // Dispara o cálculo se já havia um curso selecionado
            calculateSchedule(); 

        } catch (error) {
            SGST.Utils.showToast(`Erro ao buscar cursos: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE CÁLCULO DE CRONOGRAMA
     * -----------------------------------------------------
     */

    /**
     * Valida os campos de cálculo e chama a API.
     */
    const calculateSchedule = async () => {
        const cursoId = calculadoraDOM.courseSelect.value;
        const dataInicio = calculadoraDOM.dataInicioInput.value;
        const turno = calculadoraDOM.turnoSelect.value;
        const porcentagemRemoto = calculadoraDOM.remotePercentageSelect.value;
        const cursoSelecionado = SGST.dadosCursos.find(c => c.id_cursos == cursoId);
        
        const diasSemanaSelecionados = Array.from(calculadoraDOM.diasSemanaContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value));

        if (!cursoId || !dataInicio || !turno || diasSemanaSelecionados.length === 0) {
            SGST.Utils.log('CALC_SKIP', 'Campos de cálculo incompletos. Pulando cálculo.');
            calculadoraDOM.dataTerminoDisplay.textContent = 'N/A';
            calculadoraDOM.diasLetivosTableBody.innerHTML = '';
            return;
        }
        
        if (!cursoSelecionado) {
            SGST.Utils.showToast('Detalhes do curso não encontrados.', 'error');
            return;
        }
        
        const cargaHorariaTotal = cursoSelecionado.carga_horaria; // Assumindo que o campo carga_horaria está no objeto curso

        // Prepara o Payload para o cálculo do cronograma
        const payload = {
            cargaHorariaTotal: parseInt(cargaHorariaTotal),
            dataInicio: dataInicio,
            turno: turno,
            diasSemanaSelecionados: diasSemanaSelecionados,
            // OBS: Feriados e Recessos são buscados pelo backend PHP (Feriado.php)
            porcentagemRemoto: parseInt(porcentagemRemoto)
        };

        SGST.Utils.toggleLoading(true);
        try {
            // A API.calcularCronograma usa o controller calcular_cronograma.php POST (SUPOSIÇÃO)
            const response = await API.calcularCronograma(payload);
            
            renderSchedule(response);

        } catch (error) {
            SGST.Utils.showToast(`Erro ao calcular cronograma: ${error.message}`, 'error');
            calculadoraDOM.dataTerminoDisplay.textContent = 'Erro';
            calculadoraDOM.diasLetivosTableBody.innerHTML = '';
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * Renderiza o resultado do cronograma na interface.
     */
    const renderSchedule = (scheduleData) => {
        // Data de término
        calculadoraDOM.dataTerminoDisplay.textContent = SGST.Utils.formatDate(scheduleData.data_termino || 'N/A');

        // Tabela de Dias Letivos
        const diasLetivos = scheduleData.diasLetivos || [];
        calculadoraDOM.diasLetivosTableBody.innerHTML = '';

        if (diasLetivos.length === 0) {
            calculadoraDOM.diasLetivosTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum dia letivo encontrado.</td></tr>';
            return;
        }

        diasLetivos.forEach(dia => {
            const row = calculadoraDOM.diasLetivosTableBody.insertRow();
            
            // Estilização baseada no tipo (presencial/remoto)
            row.className = dia.type === 'remoto' ? 'row-remoto' : 'row-presencial';

            row.insertCell().textContent = SGST.Utils.formatDate(dia.data);
            row.insertCell().textContent = dia.description;
            row.insertCell().textContent = dia.type ? dia.type.charAt(0).toUpperCase() + dia.type.slice(1) : 'N/A';
            row.insertCell().textContent = dia.is_class_day ? 'Sim' : 'Não';
        });
    };

    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */
    
    SGST.Calculadora = {
        filterAndPopulateCourses: filterAndPopulateCourses, // Exportado para ser chamado no init
        calculateSchedule: calculateSchedule,

        init: () => {
            // Handlers para os filtros
            calculadoraDOM.applyFiltersButton.addEventListener('click', (e) => {
                e.preventDefault();
                filterAndPopulateCourses();
            });
            
            calculadoraDOM.clearFiltersButton.addEventListener('click', (e) => {
                e.preventDefault();
                // Limpa todos os campos de filtro
                calculadoraDOM.filterSegmento.value = '';
                calculadoraDOM.filterModalidade.value = '';
                calculadoraDOM.filterNomeCurso.value = '';
                calculadoraDOM.filterChMin.value = '';
                calculadoraDOM.filterChMax.value = '';
                calculadoraDOM.filterTem.checked = false;
                calculadoraDOM.filterBolsa.checked = false;
                filterAndPopulateCourses(); // Recarrega sem filtros
            });
            
            // Handlers para o cálculo (muda no formulário = recalcula)
            calculadoraDOM.courseSelect.addEventListener('change', calculateSchedule);
            calculadoraDOM.dataInicioInput.addEventListener('change', calculateSchedule);
            calculadoraDOM.turnoSelect.addEventListener('change', calculateSchedule);
            calculadoraDOM.remotePercentageSelect.addEventListener('change', calculateSchedule);
            calculadoraDOM.diasSemanaContainer.addEventListener('change', calculateSchedule);
            
            // Lógica para mostrar/esconder opções de remoto (inferida do snippet JS existente)
             calculadoraDOM.remotePercentageSelect.addEventListener('change', () => {
                const percentage = parseInt(calculadoraDOM.remotePercentageSelect.value);
                if (percentage > 0) {
                    calculadoraDOM.remoteDetailsOptions.classList.remove('hidden');
                } else {
                    calculadoraDOM.remoteDetailsOptions.classList.add('hidden');
                }
            });
            
            // O botão de PDF deve chamar uma função (SUPOSIÇÃO DE IMPLEMENTAÇÃO SIMPLES)
            calculadoraDOM.exportPdfButton.addEventListener('click', () => {
                SGST.Utils.showToast('Função de Exportar PDF não implementada. (Necessita de biblioteca externa)', 'info');
                SGST.Utils.log('PDF_EXPORT', 'Tentativa de exportar PDF.');
            });
            
            // Inicializa buscando todos os cursos (sem filtros iniciais)
            SGST.activeSectionHandlers['calculadora-inteligente'] = filterAndPopulateCourses;
            
            SGST.Utils.log('CALCULADORA_INIT', 'Calculadora Inteligente listeners inicializados.');
        }
    };

})();