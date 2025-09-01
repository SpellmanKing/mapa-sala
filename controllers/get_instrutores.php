<?php
// api/get_instrutores.php

require '../models/conexao.php';

try {
    $pdo = Conexao::getInstancia();
    $stmt = $pdo->query("SELECT id_instrutores, nome_instrutor FROM instrutores ORDER BY nome_instrutor ASC");
    $instrutores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($instrutores);

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(['error' => 'Erro ao buscar instrutores: ' . $e->getMessage()]);
}