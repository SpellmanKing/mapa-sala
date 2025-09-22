<?php
// controllers/gerenciar_instrutores.php
header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Instrutor.php';

try {
    $pdo = Conexao::getInstancia();
    $instrutor = new Instrutor($pdo);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $instrutores = $instrutor->buscarTodos();
        echo json_encode($instrutores);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    switch ($method) {
        case 'POST': // Criar instrutor
            if (empty($data['nome_instrutor'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nome do instrutor é obrigatório.']);
                exit;
            }
            $instrutorId = $instrutor->cadastarInstrutor($data['nome_instrutor']);
            echo json_encode(['message' => 'Instrutor criado com sucesso!', 'id' => $instrutorId]);
            break;

        case 'PUT': // Atualizar instrutor
            if (empty($data['id_instrutores']) || empty($data['nome_instrutor'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID e nome do instrutor são obrigatórios.']);
                exit;
            }
            $instrutor->alterarInstrutor($data['id_instrutores'], $data['nome_instrutor']);
            echo json_encode(['message' => 'Instrutor atualizado com sucesso!']);
            break;

        case 'DELETE': // Deletar instrutor
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID do instrutor é obrigatório.']);
                exit;
            }
            $instrutor->excluirInstrutor($id);
            echo json_encode(['message' => 'Instrutor deletado com sucesso!']);
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