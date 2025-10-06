<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Turma.php';
require __DIR__ . '/../models/entidades/Instrutor.php';

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

try {
    $pdo = Conexao::getInstancia();
    
    $novoInstrutorId = null;
    if (!empty($data['instrutorId'])) {
        $novoInstrutorId = $data['instrutorId'];
    }

    $turma = new Turma($pdo);
    $turma->atualizarStatus($turmaId, $novoStatus, $novoInstrutorId);
    
    http_response_code(200);
    echo json_encode(['message' => 'Turma atualizada com sucesso!']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao atualizar a turma: ' . $e->getMessage()]);
}