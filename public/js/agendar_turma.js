/**
 * public/js/agendarTurma.js
 * Lógica para o formulário de Agendar Turma.
 */
(function() {
    window.SGST = window.SGST || {};

    // --- 1. SELETORES DE DOM
    const agendamentoForm = document.getElementById('agendamento-form');
    const cursoIdSelect = agendamentoForm.querySelector('#agendamento-curso');
    const instrutorSelect = agendamentoForm.querySelector('#agendamento-instrutor');
    const totalAlunosInput = agendamentoForm.querySelector('#agendamento-total-alunos');
    const turnoSelect = agendamentoForm.querySelector('#agendamento-turno');
    const dataInicioInput = agendamentoForm.querySelector('#agendamento-data-inicio');
    const salasIdInput = document.getElementById('agendamento-salas-id'); // Hidden field

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE POPULAÇÃO DE CAMPOS
     * -----------------------------------------------------
     */

    /**
     * Carrega e popula Cursos e Instrutores no modal.
     */
    const loadFormOptions = async () => {
        SGST.Utils.toggleLoading(true);
        try {
            // Buscamos os cursos e instrutores de forma otimizada
            const [cursos, instrutores, salas] = await Promise.all([
                API.getAllCursos(), // GET gerenciar_cursos.php
                API.getAllInstrutores(), // GET gerenciar_instrutores.php
                API.getAllSalas() // GET gerenciar_sala.php
            ]);

            SGST.dadosCursos = cursos; // Atualiza estado global
            SGST.dadosInstrutores = instrutores; // Atualiza estado global
            SGST.dadosSalas = salas; // Atualiza estado global

            SGST.Utils.populateSelect('#agendamento-curso', cursos, 'id_cursos', 'nome_curso');
            SGST.Utils.populateSelect('#agendamento-instrutor', instrutores, 'id_instrutores', 'nome_instrutor');
            
        } catch (error) {
            SGST.Utils.showToast(`Erro ao carregar opções do formulário: ${error.message}`, 'error');
        } finally {
            SGST.Utils.toggleLoading(false);
        }
    };

    /**
     * -----------------------------------------------------
     * FUNÇÕES DE SUBMISSÃO
     * -----------------------------------------------------
     */

    // /**
    //  * Prepara e envia os dados do agendamento para o backend.
    //  */
    // const handleSubmit = async (e) => {
    //     e.preventDefault();
        
    //     if (!SGST.Utils.validateForm(agendamentoForm)) return;
        
    //     const salasIds = JSON.parse(salasIdInput.value || '[]');
    //     if (salasIds.length === 0) {
    //         SGST.Utils.showToast('É necessário realizar a alocação automática antes de agendar.', 'error');
    //         return;
    //     }

    //     const cursoId = parseInt(cursoIdSelect.value);
    //     const instrutorId = parseInt(instrutorSelect.value);
    //     const dataInicio = dataInicioInput.value;
    //     const totalAlunos = parseInt(totalAlunosInput.value);
    //     const turno = turnoSelect.value;
    //     const dataTermino = agendamentoForm.querySelector('#alocacao-data-termino').value; // Pegamos a dataTermino preenchida pela alocação

    //     // 1. Busca a carga horária do curso (assumindo que já está no SGST.dadosCursos)
    //     const cursoSelecionado = SGST.dadosCursos.find(c => c.id_cursos === cursoId);
    //     if (!cursoSelecionado) {
    //          SGST.Utils.showToast('Erro: Detalhes do curso não encontrados para agendamento.', 'error');
    //          return;
    //     }
        
    //     // 2. O controller 'agendar_turma.php' espera que o front-end envie os 'diasLetivos' e 'salasIds'.
    //     // Isso requer que o cálculo de cronograma seja feito antes.
    //     // HACK: Como o controller PHP `agendar_turma.php` JÁ INCLUI e chama o `calcular_cronograma.php`,
    //     // vamos enviar apenas o que o *controller* PHP precisa para chamar o cronograma *internamente*.
    //     // A dataTermino é necessária, e os dias letivos são gerados internamente.
    //     // O `agendar_turma.php` espera que o front-end envie: dataTermino, diasLetivos, e salasIds (além dos dados da turma).
        
    //     // Solução: Faremos uma SUPOSIÇÃO de que o backend foi levemente ajustado
    //     // para buscar a carga horária e calcular o cronograma INTERNAMENTE antes de agendar.
    //     // Se a dataTermino foi preenchida pela alocação (que fez o cálculo) e o cronograma do PHP espera:
        
    //     // Aqui está o problema de loop: 
    //     // Agendar Turma (PHP) -> Chama calcularCronograma (PHP) -> Precisa de Dias Letivos -> Precisa de Feriados
    //     // Alocar Turma (PHP) -> Chama calcularCronograma (PHP) -> Precisa de Dias Letivos -> Precisa de Feriados
        
    //     // Visto que o `alocar_turma.php` retorna `dataTermino` (infere-se que ele calculou o cronograma e a data final)
    //     // Usaremos a data de término e dias de semana do alocador para reconstruir o cronograma *novamente*.
    //     // **OPÇÃO 1: Simples (e menos eficiente)** - Confiamos que o backend `agendar_turma.php` refaz o cronograma.
        
    //     // Tentativa de Agendamento (Simples):
    //     const agendamentoPayload = {
    //         cursoId: cursoId,
    //         dataInicio: dataInicio,
    //         dataTermino: dataTermino, // Veio da Alocação
    //         totalAlunos: totalAlunos,
    //         instrutorId: instrutorId, 
    //         turno: turno,
            
    //         // O controller PHP AGENDAR_TURMA.PHP espera: diasLetivos e salasIds
    //         // Vamos forçar o envio de um array vazio/nulo para o PHP refazer o cronograma e gerar os dias letivos.
    //         // Para não quebrar o `agendar_turma.php`, precisamos de `diasLetivos`.
    //         diasLetivos: [], // FORÇANDO VAZIO: O front-end deveria calcular e enviar.
    //         salasIds: salasIds
    //     };
        
    //     // **OPÇÃO 2: Correta (Requer um passo extra de cálculo no Front-end)**
    //     // Se a Alocação já retornou a dataTermino, o front-end *deve* calcular e enviar os dias letivos.
    //     // Implementação (Recomendada):
        
    //     const diasSemanaSelecionados = Array.from(agendamentoForm.querySelectorAll('input[name="agendamento-dias-semana"]:checked'))
    //         .map(cb => parseInt(cb.value));

    //     // 1. CHAMA O CRONOGRAMA NOVAMENTE
    //     const calcPayload = {
    //         cargaHorariaTotal: parseInt(cursoSelecionado.carga_horaria),
    //         dataInicio: dataInicio,
    //         turno: turno,
    //         diasSemanaSelecionados: diasSemanaSelecionados,
    //         porcentagemRemoto: parseInt(agendamentoForm.querySelector('#remote-percentage-select').value) // SUPOSIÇÃO ID
    //     };
        
    //     let cronogramaData;
    //     try {
    //         // O cálculo é obrigatório para obter os diasLetivos
    //         cronogramaData = await API.calcularCronograma(calcPayload); 
    //     } catch (e) {
    //         SGST.Utils.showToast(`Erro ao finalizar agendamento: Não foi possível recalcular o cronograma.`, 'error');
    //         return;
    //     }

    //     // 2. MONTA O PAYLOAD COMPLETO
    //     const finalPayload = {
    //         cursoId: cursoId,
    //         dataInicio: dataInicio,
    //         dataTermino: cronogramaData.data_termino, // Pega o resultado do cálculo
    //         totalAlunos: totalAlunos,
    //         instrutorId: instrutorId, 
    //         turno: turno,
    //         diasLetivos: cronogramaData.diasLetivos, // Pega os dias gerados
    //         salasIds: salasIds // Pega as salas da alocação
    //     };

    //     SGST.Utils.toggleLoading(true);
    //     try {
    //         // Chamada final para agendar a turma (POST agendar_turma.php)
    //         const response = await API.agendarTurma(finalPayload);
            
    //         SGST.Utils.showToast(response.message || 'Turma agendada com sucesso!', 'success');
    //         SGST.closeModal(SGST.Modals.Elements.agendamento);
    //         SGST.Utils.clearForm(agendamentoForm);
    //         SGST.Alocacao.resetAlocacaoState();
            
    //         // Recarrega o Painel Visual
    //         SGST.Painel.loadAllDataAndRender(); 

    //     } catch (error) {
    //         SGST.Utils.showToast(`Falha no agendamento: ${error.message}`, 'error');
    //     } finally {
    //         SGST.Utils.toggleLoading(false);
    //     }
    // };
    
    /**
     * -----------------------------------------------------
     * INICIALIZAÇÃO E LISTENERS
     * -----------------------------------------------------
     */
     
    SGST.Agendamento = {
        loadFormOptions: loadFormOptions, // Exposto para ser chamado no init global
        init: () => {
            // // Listener principal do formulário
            // agendamentoForm.addEventListener('submit', handleSubmit);
            
            // Lógica para carregar as opções sempre que o modal for aberto (ou ao iniciar)
            // loadFormOptions(); // Chamado no script.js
            
            SGST.Utils.log('AGENDAMENTO_INIT', 'Agendamento listeners inicializados.');
        }
    };

})();