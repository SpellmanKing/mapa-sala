<?php
// controllers/agendar_turma.php
header('Content-Type: application/json');

// Garante que todos os arquivos de classe são carregados
require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Instrutor.php';
require __DIR__ . '/../models/entidades/Curso.php';
require __DIR__ . '/../models/entidades/Agendamento.php';

try {
    $pdo = Conexao::getInstancia();
    $agendamento = new Agendamento($pdo);
    
    // Verifica o método da requisição para decidir a ação
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET': // Busca todos os agendamentos
            $agendamentos = $agendamento->buscarTodos();
            echo json_encode($agendamentos);
            break;

        case 'POST': // Agenda uma nova turma
            $data = json_decode(file_get_contents('php://input'), true);

            // 1. Validação de Dados: Verifica se os dados essenciais estão presentes
            if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['salaId']) || empty($data['turno']) || empty($data['diasSemana'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
                exit;
            }

            // 2. Calcula o cronograma da turma
            $cargaHorariaTotal = (int) $agendamento->buscarCargaHorariaCurso($data['cursoId']);
            $diasSemanaSelecionados = $data['diasSemana'];
            $dataInicio = $data['dataInicio'];
            $turno = $data['turno'];

            // Obtém feriados e recessos
            require __DIR__ . './get_feriados.php';
            $feriadosRecessos = array_merge(getFeriados(), getPontes(), getNaoLetivos());

            // Inclui o controlador de cronograma
            require __DIR__ . './calcular_cronograma.php';
            $cronograma = calcularCronograma($cargaHorariaTotal, $dataInicio, $turno, $diasSemanaSelecionados, $feriadosRecessos);

            if (empty($cronograma['diasLetivos'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Não foi possível calcular o cronograma com os dados fornecidos.']);
                exit;
            }

            // 3. Validação de Disponibilidade das Salas
            $salasIds = is_array($data['salaId']) ? $data['salaId'] : [$data['salaId']]; // Garante que é um array
            foreach ($salasIds as $salaId) {
                foreach ($cronograma['diasLetivos'] as $dia) {
                    if (!$agendamento->verificarDisponibilidade($salaId, $dia['date'], $turno)) {
                        http_response_code(409);
                        echo json_encode(['error' => 'Conflito de agendamento detectado. A sala ' . $salaId . ' não está disponível no dia ' . $dia['date'] . ' no turno ' . $turno . '. Por favor, tente a Alocação Automática novamente ou escolha outra sala.']);
                        exit;
                    }
                }
            }
            
            $dataTermino = $cronograma['dataTermino'];

            // 4. Utiliza o instrutorId enviado pelo front-end
            $instrutorId = null;
            if (!empty($data['instrutorId'])) {
                $instrutorId = $data['instrutorId'];
            }


            // 5. Organiza os dados da turma para o Agendamento
            $dadosTurma = [
                'cursoId' => $data['cursoId'],
                'dataInicio' => $data['dataInicio'],
                'dataTermino' => $dataTermino,
                'totalAlunos' => $data['totalAlunos'],
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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}