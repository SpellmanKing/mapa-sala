<?php
// controllers/get_feriados.php

// A função 'getFeriados' agora retorna o array, em vez de imprimi-lo.
function getFeriados() {
    // Lista de feriados (exemplo)
    $feriados = [
        '2025-01-01', // Ano Novo
        '2025-02-25', // Carnaval
        '2025-02-26', // Carnaval
        '2025-04-18', // Paixão de Cristo
        '2025-04-21', // Tiradentes
        '2025-05-01', // Dia do Trabalho
        '2025-06-19', // Corpus Christi
        '2025-09-07', // Independência do Brasil
        '2025-10-12', // Nossa Senhora Aparecida
        '2025-11-02', // Finados
        '2025-11-15', // Proclamação da República
        '2025-12-25'  // Natal
    ];
    
    return $feriados;
}

// Verifica se a requisição foi feita diretamente para o arquivo
// Se sim, ele retorna o JSON como antes, para que o JavaScript possa usar a rota separadamente.
if (basename($_SERVER['PHP_SELF']) == 'get_feriados.php') {
    header('Content-Type: application/json');
    echo json_encode(['feriados' => getFeriados()]);
    exit;
}