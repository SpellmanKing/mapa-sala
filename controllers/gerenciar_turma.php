<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Turma.php';
require __DIR__ . '/../models/entidades/Instrutor.php';

// Função Auxiliar para mapear nome do status (string) para o ID (INT)
$getStatusTurmaId = function (string $nomeStatus): int {
    // IDs baseados na inserção SQL: 1='Planejada', 2='Confirmada', 3='Em Andamento', 4='Concluída', 5='Cancelada'
    $statusMap = [
        'planejada' => 1, 
        'confirmada' => 2, 
        'em andamento' => 3, 
        'concluída' => 4, 
        'cancelada' => 5
    ];
    return $statusMap[strtolower($nomeStatus)] ?? 0;
};

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['turmaId']) || empty($data['status'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos. ID da turma e status são obrigatórios.']);
    exit;
}

$turmaId = $data['turmaId'];
$novoStatus = $data['status'];

$novoStatusId = $getStatusTurmaId($novoStatus);

if ($novoStatusId === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Status da turma inválido.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();
    
    $novoInstrutorId = null;
    if (!empty($data['instrutorId'])) {
        $novoInstrutorId = (int) $data['instrutorId'];
    }

    $turma = new Turma($pdo);
    $turma->atualizarStatus($turmaId, $novoStatusId, $novoInstrutorId); 

    echo json_encode(['message' => 'Turma atualizada com sucesso!']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao atualizar a turma: ' . $e->getMessage()]);
}