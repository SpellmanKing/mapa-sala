<?php
// controllers/agendar_turma.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/../models/Conexao.php';
require_once __DIR__ . '/../models/entidades/Instrutor.php';
require_once __DIR__ . '/../models/entidades/Curso.php';
require_once __DIR__ . '/../models/entidades/Agendamento.php';
require_once __DIR__ . '/../models/entidades/Feriado.php';
require_once __DIR__ . '/calcular_cronograma.php'; 

// Função Auxiliar para mapear nome do turno (string) para o ID (INT)
$getTurnoId = function (string $nomeTurno): int {
    $turnos = ['manhã' => 1, 'tarde' => 2, 'noite' => 3, 'integral' => 4, 'vespertino' => 5];
    return $turnos[strtolower($nomeTurno)] ?? 0;
};


try {
    $pdo = Conexao::getInstancia();
    $agendamento = new Agendamento($pdo);
    $feriadoModel = new Feriado($pdo); 
    $cursoModel = new Curso($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            $agendamentos = $agendamento->buscarTodos();
            echo json_encode($agendamentos);
            
            break;
            
        case 'POST': 
            $data = json_decode(file_get_contents('php://input'), true);

            // Validação inicial de campos obrigatórios
            if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['dataTermino']) || empty($data['totalAlunos']) || empty($data['instrutorId']) || empty($data['salasIds']) || empty($data['turno']) || empty($data['diasSemana'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados incompletos para agendamento.']);
                exit;
            }

            $cursoId = (int) $data['cursoId'];
            $dataInicio = $data['dataInicio'];
            $dataTermino = $data['dataTermino'];
            $totalAlunos = (int) $data['totalAlunos'];
            $instrutorId = (int) $data['instrutorId'];
            $salasIds = (array) $data['salasIds'];
            $turno = $data['turno'];
            $diasSemana = (array) $data['diasSemana'];

            $turnoId = $getTurnoId($turno);
            if ($turnoId === 0) {
                throw new InvalidArgumentException("Turno inválido.");
            }

            // Busca Carga Horária e flag Híbrida para recalcular cronograma e persistir
            $cursoData = $cursoModel->buscarPorId($cursoId);
            $ehHibrida = $cursoData['curso_tem'] == 1 ? 1 : 0; 
            
            // Re-calcula o cronograma para obter a lista de dias letivos 
            $feriadosRecessos = $feriadoModel->buscarDatasNaoLetivas($dataInicio, $dataTermino);
            $cronograma = calcularCronograma($cursoData['carga_horaria'], $dataInicio, $turno, $diasSemana, $feriadosRecessos);
            
            // Lista final de dias a serem agendados
            $diasLetivos = $cronograma['diasLetivos']; 

            // Validação de Conflito Final: Sala Livre e Instrutor Livre
            // O Model Agendamento fará a checagem final (UNIQUE INDEX) durante o INSERT, mas a checagem do Instrutor deve ser feita aqui para um alerta mais claro.
            $conflitosInstrutor = [];
            foreach ($diasLetivos as $dataAula) {
                // Checagem de Conflito de Instrutor
                if (!$agendamento->verificarDisponibilidadeInstrutor($instrutorId, $dataAula, $turnoId)) {
                    $conflitosInstrutor[] = $dataAula;
                }
            }

            if (!empty($conflitosInstrutor)) {
                // Neste ponto, a aplicação front-end deveria mostrar um alerta e pedir confirmação.
                // Como estamos no backend, paramos a execução para evitar o agendamento conflitante de instrutor.
                // O conflito de sala será tratado pelo UNIQUE INDEX no Model Agendamento.
                http_response_code(409);
                echo json_encode(['error' => "Conflito de Instrutor: O instrutor já está agendado nos dias: " . implode(', ', $conflitosInstrutor)]);
                exit;
            }
            
            // 5. Organiza os dados da turma para o Agendamento
            $dadosTurma = [
                'cursoId' => $cursoId,
                'dataInicio' => $dataInicio,
                'dataTermino' => $dataTermino,
                'totalAlunos' => $totalAlunos,
                'instrutorId' => $instrutorId, 
                'turnoId' => $turnoId,
                'ehHibrida' => $ehHibrida 
            ];

            // Cria a instância do Agendamento e agenda a turma
            // A lógica de transação e checagem de habilitação está no Model Agendamento
            $novaTurmaId = $agendamento->agendarNovaTurma($dadosTurma, $diasLetivos, $salasIds);

            http_response_code(201);
            echo json_encode(['message' => 'Turma agendada com sucesso!', 'id' => $novaTurmaId]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido.']);
            break;
    }
} catch (InvalidArgumentException $e) {
    http_response_code(400); 
    echo json_encode(['error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}