<?php

header('Content-Type: application/json');

try {
    // 1. Dados dos feriados e recessos
    // A lista agora está centralizada no backend
    $feriadosRecessos = [
        '2025-01-01', '2025-02-24', '2025-02-25', '2025-02-26', '2025-04-18', '2025-04-21',
        '2025-05-01', '2025-06-19', '2025-09-07', '2025-10-12', '2025-10-28', '2025-11-02',
        '2025-11-15', '2025-11-20', '2025-11-30', '2025-12-25',
        '2025-03-03', '2025-03-04', '2025-03-05', '2025-03-06', '2025-03-07',
        '2025-07-07', '2025-07-08', '2025-07-09', '2025-07-10', '2025-07-11',
        '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-26', '2025-12-29', '2025-12-30', '2025-12-31'
    ];

    // NOVO: Criamos um array associativo com uma chave 'feriados'
    // Isso garante que o JavaScript receba um objeto com uma propriedade 'feriados' que é um array
    $response = ['feriados' => $feriadosRecessos];

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar feriados: ' . $e->getMessage()]);
}