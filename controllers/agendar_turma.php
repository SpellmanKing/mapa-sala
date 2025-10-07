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

            // 1. Validação inicial de campos obrigatórios
            if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || 
            empty($data['turno']) || empty($data['diasSemana']) || empty($data['cargaHoraria']) || 
            empty($data['salasIds']) || !is_array($data['diasSemana'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
                exit;
            }
            
            // 2. Type Casting e Sanitização de Entradas Chave (Mitigação de Segurança)
           $cursoId = (int) $data['cursoId'];
           $totalAlunos = (int) $data['totalAlunos'];
           $cargaHoraria = (int) $data['cargaHoraria'];
           $instrutorId = !empty($data['instrutorId']) ? (int) $data['instrutorId'] : null;
           $dataInicio = trim($data['dataInicio']);
           $salasIds = is_array($data['salasIds']) ? array_map('intval', $data['salasIds']) : [intval($data['salasIds'])];
           
           // Validação de formato de data e valores numéricos
           if ($cursoId <= 0 || $totalAlunos <= 0 || $cargaHoraria <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataInicio)) {
               throw new InvalidArgumentException("Dados numéricos ou de data inválidos.");
           }

            // 3. Busca Feriados e Calcula o Cronograma
            $feriados = $feriadoModel->buscarTodos();

            $cronograma = calcularCronograma($cargaHoraria, $dataInicio, $data['turno'], $data['diasSemana'], $feriados, $data['porcentagemRemoto'] ?? 0);
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
            $dadosTurma = [
                'cursoId' => $cursoId,
                'dataInicio' => $dataInicio,
                'dataTermino' => $dataTermino,
                'totalAlunos' => $totalAlunos,
                'instrutorId' => $instrutorId, 
                'turno' => $data['turno']
            ];

            // 6. Cria a instância do Agendamento e agenda a turma
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