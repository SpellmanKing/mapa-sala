<?php
// api/get_agendamentos.php (Corrigido para usar a classe Agendamento)

require '../models/conexao.php';
require '../models/entidades/agendamento.php';

try {
    // Obtém a instância da conexão via a classe Conexao
    $pdo = Conexao::getInstancia();
    
    // Cria uma instância da classe Agendamento, passando a conexão para ela
    $agendamento = new Agendamento($pdo);
    
    // Chama o método da classe para buscar os agendamentos
    $agendamentos = $agendamento->buscarTodos();
    
    // Retorna a resposta em JSON
    echo json_encode($agendamentos);

} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => $e->getMessage()]);
}