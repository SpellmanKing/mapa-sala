<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Sala.php';

try {
    // 1. Obtém a instância da conexão
    $pdo = Conexao::getInstancia();
    $sala = new Sala($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $salas = $sala->buscarTodas();
        http_response_code(200);
        echo json_encode($salas);
        exit;
    }
    
    // Se o método não for GET, retorna 405 (Método Não Permitido)
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Utilize GET.']);

} catch (Exception $e) {
    // Captura exceções do Model e erros gerais
    http_response_code(500); 
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}