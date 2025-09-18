<?php
header('Content-Type: application/json');

require __DIR__ . '/../models/calcular_cronograma.php';
require __DIR__ . '/../models/entidades/curso.php';
require __DIR__ . '/get_feriados.php';
require __DIR__ . '/../models/conexao.php';

// Validação de método de requisição
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validação dos dados
if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['turno']) || empty($data['diasSemana'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();
    $curso = new Curso($pdo);
    
    // Busca a carga horária do curso
    $cursoInfo = $curso->buscarPorId($data['cursoId']);
    if (!$cursoInfo) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado.']);
        exit;
    }
    $cargaHorariaTotal = $cursoInfo['carga_horaria'];
    
    // Obtém a lista de feriados
    $feriados = getFeriados();

    // Chama a função do Model para calcular o cronograma
    $cronograma = calcularCronograma($cargaHorariaTotal, $data['dataInicio'], $data['turno'], $data['diasSemana'], $feriados);

    // Retorna o resultado
    echo json_encode([
        'success' => true,
        'cronograma' => $cronograma,
        'message' => 'Cronograma calculado com sucesso.'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}
