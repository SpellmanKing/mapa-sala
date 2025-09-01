<?php
// api/get_salas.php (Corrigido para usar a classe Sala)

require '../models/conexao.php';
require '../models/entidades/sala.php';

try {
    // 1. Obtém a instância da conexão
    $pdo = Conexao::getInstancia();
    
    // 2. Cria uma instância da classe Sala
    $sala = new Sala($pdo);
    
    // 3. Chama o método da classe para buscar as salas
    $salas = $sala->buscarTodas();
    
    // 4. Retorna a resposta em JSON
    echo json_encode($salas);

} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => $e->getMessage()]);
}