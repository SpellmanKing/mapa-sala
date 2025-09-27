<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// controllers/gerenciar_instrutores.php
header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Instrutor.php';

try {
    $pdo = Conexao::getInstancia();
    $instrutor = new Instrutor($pdo);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // O método buscarTodos agora traz os cursos vinculados (ajustado no Model)
        $instrutores = $instrutor->buscarTodos();
        echo json_encode($instrutores);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    // Array de IDs de cursos para habilitação. Assume vazio se não for enviado.
    // Garante que é um array, mesmo que o JSON envie null.
    $cursosIds = is_array($data['cursos_ids'] ?? null) ? $data['cursos_ids'] : [];

    switch ($method) {
        case 'POST': // Criar instrutor e habilitar cursos
            if (empty($data['nome_instrutor'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nome do instrutor é obrigatório.']);
                exit;
            }
            
            // 1. Cadastra o instrutor.
            $instrutorId = $instrutor->cadastarInstrutor($data['nome_instrutor']);
            
            // 2. Vincula os cursos
            if ($instrutorId && !empty($cursosIds)) {
                $instrutor->gerenciarHabilitacoes($instrutorId, $cursosIds);
            }
            
            http_response_code(201); // Created
            echo json_encode(['message' => 'Instrutor criado e cursos vinculados com sucesso!', 'id' => $instrutorId]);
            break;

        case 'PUT': // Atualizar instrutor e habilitar/desabilitar cursos
            if (empty($data['id_instrutores']) || empty($data['nome_instrutor'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID e nome do instrutor são obrigatórios.']);
                exit;
            }
            
            $instrutorId = $data['id_instrutores'];
            
            // 1. Atualiza o nome do instrutor
            $instrutor->alterarInstrutor($instrutorId, $data['nome_instrutor']);
            
            // 2. Gerencia as habilitações (isso substitui as antigas habilitações pelas novas)
            $instrutor->gerenciarHabilitacoes($instrutorId, $cursosIds);

            echo json_encode(['message' => 'Instrutor e cursos atualizados com sucesso!']);
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