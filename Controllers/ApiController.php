<?php

// Inclui todos os Models e Services
require_once '../Models/Database.php'; 
require_once '../Models/TurmaModel.php';
require_once '../Models/CalendarioModel.php';
require_once '../Models/CursoModel.php';
require_once '../Models/SalaModel.php';
require_once '../Models/InstrutorModel.php';
require_once '../Models/Alocacao.php'; 

// Inicializa os objetos
$turmaModel = new TurmaModel();
$calendarioModel = new CalendarioModel();
$cursoModel = new CursoModel();
$salaModel = new SalaModel();
$instrutorModel = new InstrutorModel();
$alocacaoService = new Alocacao(); 

$action = $_GET['action'] ?? '';
$response = ['status' => 'error', 'message' => 'Ação desconhecida.'];

// Trata o corpo da requisição para POST, PUT, DELETE
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($action) {
        
        // --- ROTAS DE PAINEL ---
        case 'getAgendamentos':
            $agendamentos = $turmaModel->getAgendamentosParaPainel();
            $response = ['status' => 'success', 'data' => $agendamentos]; 
            break;
        case 'agendarTurma':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($input)) {
                throw new Exception("Requisição inválida para agendar turma.");
            }
            $id_turma = $turmaModel->agendarNovaTurma(
                $input['id_curso'], $input['id_instrutor'], $input['codigo_turma'], 
                $input['data_inicio'], $input['data_termino'], $input['turno'], 
                $input['total_alunos'], $input['id_sala'], $input['dias_semana'] 
            );
            $response = ['status' => 'success', 'message' => 'Turma agendada com sucesso! ID: ' . $id_turma];
            break;

        // --- ROTAS DA CALCULADORA INTELIGENTE ---
        case 'calcularTermino':
            $carga_horaria = $_GET['ch'] ?? 0;
            $data_inicio = $_GET['inicio'] ?? '';
            $dias_semana_raw = $_GET['dias'] ?? ''; 
            
            if (empty($carga_horaria) || empty($data_inicio) || empty($dias_semana_raw)) {
                throw new Exception("Parâmetros (ch, inicio, dias) são obrigatórios.");
            }
            $dias_semana = array_map('intval', explode(',', $dias_semana_raw));
            $data_termino = $turmaModel->calcularDataTermino((int)$carga_horaria, $data_inicio, $dias_semana);

            $response = ['status' => 'success', 'data_termino' => $data_termino];
            break;
            
        // --- ROTAS DE ALOCAÇÃO AUTOMÁTICA ---
        case 'alocacaoAutomatica':
            $id_curso = $_GET['curso_id'] ?? 0;
            $data_inicio = $_GET['data_inicio'] ?? '';
            $data_termino = $_GET['data_termino'] ?? '';
            $total_alunos = $_GET['total_alunos'] ?? 0;
            $dias_semana_raw = $_GET['dias'] ?? ''; 

            if (empty($id_curso) || empty($data_inicio) || empty($data_termino) || empty($total_alunos) || empty($dias_semana_raw)) {
                throw new Exception("Faltam parâmetros críticos para a alocação automática.");
            }
            $dias_semana = array_map('intval', explode(',', $dias_semana_raw));

            $resultado_alocacao = $alocacaoService->buscarSalasAutomaticas(
                (int)$id_curso, $data_inicio, $data_termino, (int)$total_alunos, $dias_semana
            );
            $response = $resultado_alocacao;
            break;
            
        // --- ROTAS CRUD FERIADOS ---
        case 'getFeriados': $response = ['status' => 'success', 'data' => $calendarioModel->getAllFeriados()];
            break;
            // Assumindo que a coluna na tabela é 'fk_id_tipo_feriado' (1=Feriado, 2=Recesso). O JS envia 'tipo' como ID.
        case 'saveFeriado':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($input)) { throw new Exception("Requisição inválida para salvar feriado."); }
            // O Model espera (data, descricao, tipo_id, id)
            $calendarioModel->saveFeriado($input['data'], $input['descricao'], $input['tipo'], $input['id'] ?? null);
            $response = ['status' => 'success', 'message' => 'Data não letiva salva com sucesso.'];
            break;
        case 'deleteFeriado':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($input['id'])) { throw new Exception("Requisição inválida para deletar feriado."); }
            $calendarioModel->deleteFeriado($input['id']);
            $response = ['status' => 'success', 'message' => 'Data não letiva deletada com sucesso.'];
            break;

        // --- ROTAS CRUD INSTRUTORES ---
        case 'getInstrutores': 
            $response = ['status' => 'success', 'data' => $instrutorModel->getAllInstrutores()]; 
            break;

        case 'saveInstrutor':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($input['nome'])) { 
                throw new Exception("Nome do instrutor é obrigatório."); 
            }
            $instrutorModel->saveInstrutor($input['nome'], $input['segmento'] ?? 'Não Informado', $input['id'] ?? null);
            $response = ['status' => 'success', 'message' => 'Instrutor salvo com sucesso!'];
            break;

        case 'deleteInstrutor':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($input['id'])) { 
                throw new Exception("ID do instrutor é obrigatório para exclusão."); 
            }
            $instrutorModel->deleteInstrutor($input['id']);
            $response = ['status' => 'success', 'message' => 'Instrutor excluído com sucesso!'];
            break;

        // --- ROTAS CRUD CURSOS ---
        case 'getCursos': 
            $response = ['status' => 'success', 'data' => $cursoModel->getAllCursos()]; 
            break;
        case 'saveCurso':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($input['nome']) || empty($input['ch']) || empty($input['tipo_sala'])) { 
                throw new Exception("Dados obrigatórios (Nome, CH, Tipo Sala) estão faltando para salvar o curso."); 
            }
            $segmento_padrao = 'FIC'; // Usando valor padrão para o beta
            $cursoModel->saveCurso(
                $input['nome'], 
                $input['ch'], 
                $input['segmento'] ?? $segmento_padrao,
                $input['tipo_sala'], 
                $input['id'] ?? null
            );
            $response = ['status' => 'success', 'message' => 'Curso salvo com sucesso!'];
            break;

        case 'deleteCurso':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($input['id'])) { 
                throw new Exception("ID do curso é obrigatório para exclusão."); 
            }
            $cursoModel->deleteCurso($input['id']);
            $response = ['status' => 'success', 'message' => 'Curso excluído com sucesso!'];
            break;

        // --- ROTAS DE LISTAGEM DE APOIO ---
        case 'getTiposSala': $response = ['status' => 'success', 'data' => $salaModel->getTiposSala()]; break;
        case 'getSegmentos': $response = ['status' => 'success', 'data' => $cursoModel->getSegmentos()]; break;
        case 'getAllSalas': $response = ['status' => 'success', 'data' => $salaModel->getAllSalas()]; break;

        default:
            $response['message'] = 'Ação ' . $action . ' não implementada.';
            break;
    }
} catch (Exception $e) {
    $response = ['status' => 'error', 'message' => $e->getMessage()];
}

echo json_encode($response);