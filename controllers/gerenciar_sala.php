<?php

// controllers/get_sala.php
header('Content-Type: application/json');

// Garante que o arquivo da classe seja incluído apenas uma vez
require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Sala.php';

try {
    // 1. Obtém a instância da conexão
    $pdo = Conexao::getInstancia();
    $sala = new Sala($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $salas = $sala->buscarTodas();
        echo json_encode($salas);
        exit;
    }
    
} catch (PDOException $e) {
    // Se houver um erro de banco de dados, retorne uma mensagem de erro JSON
    http_response_code(500); 
    echo json_encode(['error' => 'Erro de banco de dados: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Para outros tipos de erro, retorne uma mensagem genérica
    http_response_code(500); 
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}