<?php
// controllers/agendar_turma.php
header('Content-Type: application/json');

// Garante que todos os arquivos de classe são carregados
require __DIR__ . '/../models/conexao.php';
require __DIR__ . '/../models/entidades/agendador.php';
require __DIR__ . '/../models/entidades/instrutor.php';
require __DIR__ . '/../models/entidades/curso.php';
require __DIR__ . '/../models/entidades/agendamento.php';
require __DIR__ . '/../models/calcular_cronograma.php';
require __DIR__ . '/get_feriados.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// 1. Validação de Dados: Verifica se os dados essenciais estão presentes
if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['salaId']) || empty($data['turno']) || empty($data['diasSemana'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();

    // 2. Busca a carga horária do curso
    $curso = new Curso($pdo);
    $detalhesCurso = $curso->buscarPorId($data['cursoId']);
    if (!$detalhesCurso) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado.']);
        exit;
    }
    
    // 3. Calcula o cronograma da turma
    $feriados = json_decode(file_get_contents('get_feriados.php'), true);
    $diasSemanaInteiros = array_map('intval', $data['diasSemana']);
    $cronograma = calcularCronograma($detalhesCurso['carga_horaria'], $data['dataInicio'], $data['turno'], $diasSemanaInteiros, $feriados);
    
    // Converte a lista de salas para um array de inteiros
    $salasIds = array_map('intval', $data['salaId']);

    // Verifica a disponibilidade das salas para todos os dias letivos
    $agendamento = new Agendamento($pdo);
    foreach ($salasIds as $salaId) {
        foreach ($cronograma['diasLetivos'] as $dia) {
            $isAvailable = $agendamento->verificarDisponibilidade($salaId, $dia, $data['turno']);
            if (!$isAvailable) {
                http_response_code(409); // Conflito
                echo json_encode(['error' => "A sala com ID $salaId já está ocupada no dia $dia e turno. Por favor, tente a Alocação Automática novamente ou escolha outra sala."]);
                exit;
            }
        }
    }
    
    $dataTermino = $cronograma['dataTermino'];

    // 4. Busca o ID do instrutor pelo nome
    $instrutorId = null;
    if (!empty($data['instrutorNome'])) {
        $instrutor = new Instrutor($pdo);
        $instrutorId = $instrutor->buscarIdPorNome($data['instrutorNome']);
    }

    // 5. Organiza os dados da turma para o Agendador
    $dadosTurma = [
        'cursoId' => $data['cursoId'],
        'dataInicio' => $data['dataInicio'],
        'dataTermino' => $dataTermino,
        'totalAlunos' => $data['totalAlunos'],
        'instrutorId' => $instrutorId,
        'turno' => $data['turno']
    ];

    // 6. Cria a instância do Agendador e agenda a turma
    $agendador = new Agendador($pdo);
    $novaTurmaId = $agendador->agendarNovaTurma($dadosTurma, $cronograma['diasLetivos'], $salasIds);

    http_response_code(200);
    echo json_encode(['message' => 'Turma agendada com sucesso!', 'turmaId' => $novaTurmaId]);

} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}