<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Feriado.php';

try {
    $pdo = Conexao::getInstancia();
    $feriadoModel = new Feriado($pdo);

    $method = $_SERVER['REQUEST_METHOD'];

    // Para POST/PUT/DELETE precisamos dos dados JSON
    $data = null;
    if (in_array($method, ['POST', 'PUT'])) {
        $data = json_decode(file_get_contents('php://input'), true);
    }
    
    switch ($method) {
        case 'GET': // Buscar todos os feriados
            $feriados = $feriadoModel->buscarTodos();
            echo json_encode($feriados);
            break;

        case 'POST': // Criar feriado
            if (empty($data['data_feriado']) || empty($data['descricao']) || empty($data['tipo'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Data, descrição e tipo são obrigatórios.']);
                exit;
            }
            $id = $feriadoModel->cadastrarFeriado($data['data_feriado'], $data['descricao'], $data['tipo']);
            http_response_code(201); 
            echo json_encode(['message' => 'Registro criado com sucesso!', 'id' => $id]);
            break;

        case 'PUT': // Atualizar feriado
            if (empty($data['id_feriado']) || empty($data['data_feriado']) || empty($data['descricao']) || empty($data['tipo'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID, data, descrição e tipo são obrigatórios.']);
                exit;
            }
            $feriadoModel->atualizarFeriado($data['id_feriado'], $data['data_feriado'], $data['descricao'], $data['tipo']);
            echo json_encode(['message' => 'Registro atualizado com sucesso!']);
            break;

        case 'DELETE': // Deletar feriado
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID do feriado é obrigatório.']);
                exit;
            }
            $feriadoModel->excluirFeriado($id);
            echo json_encode(['message' => 'Registro deletado com sucesso!']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido.']);
            break;
    }

} catch (Exception $e) {
    // Captura exceções do Model e erros gerais
    http_response_code(500); 
    echo json_encode(['error' => 'Erro na operação: ' . $e->getMessage()]);
}