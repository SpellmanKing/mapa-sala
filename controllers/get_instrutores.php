<?php

header('Content-Type: application/json');

// Inclui o arquivo do modelo de instrutor
require __DIR__ . '/../models/conexao.php';
require __DIR__ . '/../models/entidades/instrutor.php';

try {
    // 1. Obtém a instância da conexão
    $pdo = Conexao::getInstancia();

    // 2. Cria uma instância da classe Instrutor
    $instrutor = new Instrutor($pdo);

    // 3. Chama o método do modelo para buscar os instrutores
    $instrutores = $instrutor->buscarTodos();

    // 4. Retorna a resposta em JSON
    echo json_encode($instrutores);

} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => 'Erro ao buscar instrutores: ' . $e->getMessage()]);
}