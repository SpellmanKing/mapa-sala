<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// controllers/agendar_turma.php
header('Content-Type: application/json');

require_once __DIR__ . '/../models/Conexao.php';
require_once __DIR__ . '/../models/entidades/Instrutor.php';
require_once __DIR__ . '/../models/entidades/Curso.php';
require_once __DIR__ . '/../models/entidades/Agendamento.php';
require_once __DIR__ . '/../models/entidades/Feriado.php';
require_once __DIR__ . '/calcular_cronograma.php'; 

try {
    $pdo = Conexao::getInstancia();
    $agendamento = new Agendamento($pdo);
    $feriadoModel = new Feriado($pdo); 
    
    // Verifica o método da requisição para decidir a ação
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            $agendamentos = $agendamento->buscarTodos();
            echo json_encode($agendamentos);
            break;
            
        case 'POST': 
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['turno']) || empty($data['diasSemana']) || !isset($data['instrutorId'])) {
                throw new InvalidArgumentException('Dados incompletos para agendamento. Verifique curso, data de início, alunos, turno, dias da semana e instrutor.');
            }
            
            // 2. Busca o curso para obter Carga Horária e Dias da Semana
            $cursoModel = new Curso($pdo);
            $curso = $cursoModel->buscarPorId($data['cursoId']);

            if (!$curso) {
                throw new InvalidArgumentException('Curso não encontrado.');
            }

            // O curso deve ter a carga horária e a necessidade de sala
            $cargaHorariaTotal = (int) $curso['carga_horaria'];
            $tipoSalaNecessaria = $curso['necessidade_sala'];
            
            // Para simplificar, assumimos que o front-end envia um array de dias da semana (1 a 7).
            $diasSemana = $data['diasSemana']; 
            $porcentagemRemoto = $data['porcentagemRemoto'] ?? 0; 

            // 3. Busca Feriados e Calcula o Cronograma
            // CHAMA A FUNÇÃO AGORA NO CONTROLLER
            $feriadosRecessos = $feriadoModel->buscarTodos();
            $datasFeriados = array_column($feriadosRecessos, 'data_feriado');

            $cronograma = calcularCronograma($cargaHorariaTotal, $data['dataInicio'], $data['turno'], $diasSemana, $datasFeriados, $porcentagemRemoto);

            $dataTermino = $cronograma['data_termino'];

            // 4. Validação da Disponibilidade de Salas: 
            // Para agendamento, o front-end deve enviar o ID da(s) sala(s) selecionada(s)
            // Se for uma alocação simples, deve enviar um array com um ID:
            if (empty($data['salasIds']) || !is_array($data['salasIds'])) {
                throw new InvalidArgumentException('IDs das salas para agendamento são obrigatórios e devem ser um array.');
            }
            $salasIds = $data['salasIds'];

            // Verificação de conflito de sala para cada dia letivo e sala
            foreach ($cronograma['diasLetivos'] as $diaAula) {
                $dataAula = $diaAula['date'];
                
                foreach ($salasIds as $salaId) {
                    if (!$agendamento->verificarDisponibilidade($salaId, $dataAula, $data['turno'])) {
                         throw new InvalidArgumentException("Conflito de agendamento: A sala ID {$salaId} não está disponível em {$dataAula} no turno de {$data['turno']}.");
                    }
                }
            }
            
            // 5. Organiza os dados da turma para o Agendamento
            $instrutorId = is_numeric($data['instrutorId']) ? (int) $data['instrutorId'] : null;
            $dadosTurma = [
                'cursoId' => $data['cursoId'],
                'dataInicio' => $data['dataInicio'],
                'dataTermino' => $dataTermino,
                'totalAlunos' => $data['totalAlunos'],
                'instrutorId' => $instrutorId, 
                'turno' => $data['turno']
            ];

            // 6. Cria a instância do Agendamento e agenda a turma
            // O model Agendamento.php garante a validação do instrutor e a integridade transacional.
            $agendador = new Agendamento($pdo);
            $novaTurmaId = $agendador->agendarNovaTurma($dadosTurma, $cronograma['diasLetivos'], $salasIds);

            http_response_code(201);
            echo json_encode(['message' => 'Turma agendada com sucesso!', 'id' => $novaTurmaId]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido.']);
            break;
    }
} catch (InvalidArgumentException $e) {
    // Captura exceções específicas de validação do Model/Controller
    http_response_code(400); 
    echo json_encode(['error' => $e->getMessage()]);
} catch (Exception $e) {
    // Captura exceções do Model (e.g., erro ao buscar dados)
    http_response_code(500);
    error_log("Erro no agendamento: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno do servidor ao agendar a turma.']);
}