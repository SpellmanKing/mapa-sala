<?php

header('Content-Type: application/json');

require __DIR__ . '/../models/conexao.php';
require __DIR__ . '/../models/entidades/agendamento.php';

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