<?php
// controllers/get_sala.php
header('Content-Type: application/json');

// Garante que o arquivo da classe seja incluído apenas uma vez
require __DIR__ . '/../models/conexao.php';
require __DIR__ . '/../models/entidades/sala.php';

try {
    // 1. Obtém a instância da conexão
    $pdo = Conexao::getInstancia();
    
    // 2. Cria uma instância da classe Sala
    $sala = new Sala($pdo);
    
    // 3. Chama o método da classe para buscar as salas
    $salas = $sala->buscarTodas();
    
    // 4. Retorna a resposta em JSON
    echo json_encode($salas);

} catch (PDOException $e) {
    // Se houver um erro de banco de dados, retorne uma mensagem de erro JSON
    http_response_code(500); 
    echo json_encode(['error' => 'Erro de banco de dados: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Para outros tipos de erro, retorne uma mensagem genérica
    http_response_code(500); 
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}
