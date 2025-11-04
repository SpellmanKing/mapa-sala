/**
 * public/js/calculadora.js
 * Lógica para a seção 'Calculadora Inteligente' e cálculo de Cronograma.
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM
    const calculadoraDOM = {
        // Filtros
        filterSegmento: document.getElementById('filter-segmento'),
        filterModalidade: document.getElementById('filter-modalidade'),
        filterNomeCurso: document.getElementById('filter-nome-curso'),
        filterChMin: document.getElementById('filter-ch-min'),
        filterChMax: document.getElementById('filter-ch-max'),
        filterTem: document.getElementById('filter-tem'),
        filterBolsa: document.getElementById('filter-bolsa'),
        applyFiltersButton: document.getElementById('apply-filters-button'),
        clearFiltersButton: document.getElementById('clear-filters-button'),
        
        // Formulário de Cálculo
        calculadoraForm: document.getElementById('calculadora-form'),
        courseSelect: document.getElementById('calculadora-curso-select'),
        dataInicioInput: document.getElementById('calculadora-data-inicio'),
        turnoSelect: document.getElementById('calculadora-turno'),

        courseSelect: document.getElementById('calculadora-curso-select'),
        dataInicioInput: document.getElementById('calculadora-data-inicio'),
        turnoSelect: document.getElementById('calculadora-turno'),
        remotePercentageSelect: document.getElementById('calculadora-porcentagem-remoto'),
        remoteDetailsOptions: document.getElementById('remote-details-options'),
        diasSemanaContainer: document.getElementById('calculadora-dias-semana'),
        
        // Resultados
        dataTerminoDisplay: document.getElementById('data-termino-resultado'),
        diasLetivosDisplay: document.getElementById('dias-letivos-resultado'),
        dataTerminoDisplay: document.getElementById('data-termino-resultado'),
        diasLetivosDisplay: document.getElementById('dias-letivos-resultado'),
        exportPdfButton: document.getElementById('export-pdf-button'),

        // Botões
        applyFiltersButton: document.getElementById('apply-filters-button'),
        clearFiltersButton: document.getElementById('clear-filters-button'),
        exportPdfButton: document.getElementById('export-pdf-button') 
    };

    let dadosCursos = [];

    // Supondo que os checkboxes dos dias da semana são injetados DENTRO do calculadora-form
    const getDiasSemanaSelecionados = () => {
        return Array.from(calculadoraDOM.calculadoraForm.querySelectorAll('input[name="dias-semana"]:checked'))
                                .map(checkbox => parseInt(checkbox.value));
    };

    /**
    /**
     * Popula o select de cursos.
     */
    const loadCourses = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            dadosCursos = await API.getAllCursos(); // GET gerenciar_cursos.php
            
            // Popula o <select>
            SGST.Utils.populateSelect('#calculadora-curso-select', dadosCursos, 'id_cursos', 'nome_curso', 'Selecione o Curso');
            
        } catch (error) {
            SGST.Utils.showToast('Erro ao carregar cursos: ' + error.message, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * FUNÇÃO PRINCIPAL: Calcula o cronograma chamando o backend.
     */
    const calculateSchedule = async () => {
        const cursoId = calculadoraDOM.courseSelect.value;
        const dataInicio = calculadoraDOM.dataInicioInput.value;
        const turno = calculadoraDOM.turnoSelect.value; // String do Turno
        const cursoSelecionado = dadosCursos.find(c => c.id_cursos == cursoId);
        const diasSemana = getDiasSemanaSelecionados(); // Obtém os dias selecionados
        
        if (!cursoSelecionado || !dataInicio || !turno || diasSemana.length === 0) {
            calculadoraDOM.dataTerminoDisplay.textContent = '--';
            calculadoraDOM.diasLetivosDisplay.innerHTML = '';
            return;
        }

        SGST.Utils.toggleLoading(true);
        try {
            const payload = {
                cargaHorariaTotal: parseInt(cursoSelecionado.carga_horaria),
                dataInicio: dataInicio,
                turno: turno,
                diasSemana: diasSemana
            };

            // Chamada ao endpoint calcular_cronograma.php (UC-002)
            const result = await API.getCronograma(payload); 
            
            // Exibição dos resultados
            calculadoraDOM.dataTerminoDisplay.textContent = SGST.Utils.formatDate(result.dataTermino);
            
            let diasHtml = `
                <p>Dias de Aula (Total: ${result.diasLetivos.length}):</p>
                <ul>${result.diasLetivos.map(d => `<li>${SGST.Utils.formatDate(d)}</li>`).join('')}</ul>
            `;
            calculadoraDOM.diasLetivosDisplay.innerHTML = diasHtml;

            SGST.Utils.showToast('Cálculo concluído. Data de término estimada.', 'success');

        } catch (error) {
            calculadoraDOM.dataTerminoDisplay.textContent = 'Erro no cálculo.';
            calculadoraDOM.diasLetivosDisplay.innerHTML = '';
            SGST.Utils.showToast('Erro ao calcular cronograma: ' + error.message, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */
    
    SGST.Calculadora = {
        init: () => {
            // Listener para recalcular o cronograma ao mudar qualquer input relevante
            calculadoraDOM.courseSelect.addEventListener('change', calculateSchedule);
            calculadoraDOM.dataInicioInput.addEventListener('change', calculateSchedule);
            calculadoraDOM.turnoSelect.addEventListener('change', calculateSchedule);
            // Assumimos que o form deve escutar mudanças nos checkboxes que serão injetados
            calculadoraDOM.calculadoraForm.addEventListener('change', (e) => {
                if (e.target.name === 'dias-semana') {
                    calculateSchedule();
                }
            });
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