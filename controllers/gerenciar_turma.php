<?php
// api/gerenciar_turma.php (Corrigido para o banco de dados)

require '../models/conexao.php';
require '../models/entidades/turma.php';
require '../models/entidades/instrutor.php';

header('Content-Type: application/json');

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
    
    // NOVO: Busca o ID do instrutor a partir do nome
    $novoInstrutorId = null;
    if (!empty($data['instrutorNome'])) {
        $instrutor = new Instrutor($pdo);
        $novoInstrutorId = $instrutor->buscarIdPorNome($data['instrutorNome']);
    }

    $turma = new Turma($pdo);
    $turma->atualizarStatus($turmaId, $novoStatus, $novoInstrutorId);
    
    http_response_code(200);
    echo json_encode(['message' => 'Turma atualizada com sucesso!']);
    
} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => $e->getMessage()]);
}