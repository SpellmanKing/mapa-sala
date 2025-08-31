<?php
// api/calcular_cronograma.php
// Este arquivo contém uma função utilitária para calcular o cronograma de um curso.

/**
 * Calcula os dias letivos e a data de término de um curso.
 * @param int $cargaHorariaTotal A carga horária total do curso em horas.
 * @param string $dataInicio A data de início do curso no formato 'YYYY-MM-DD'.
 * @param string $turno O turno do curso ('manha', 'tarde', 'noite', 'integral').
 * @return array Um array contendo 'diasLetivos' e 'dataTermino'.
 */
function calcularCronograma(int $cargaHorariaTotal, string $dataInicio, string $turno): array {
    
    // Regra de negócio: Carga horária por dia
    $horasPorDia = 0;
    switch ($turno) {
        case 'manha':
        case 'tarde':
        case 'noite':
            $horasPorDia = 4;
            break;
        case 'integral':
            $horasPorDia = 8;
            break;
        default:
            throw new InvalidArgumentException("Turno inválido.");
    }

    $diasLetivos = [];
    $cargaHorariaRestante = $cargaHorariaTotal;
    $currentDate = new DateTime($dataInicio);

    // Datas não letivas (Feriados e Recessos)
    $feriadosRecessos = [
        '2025-01-01', '2025-02-24', '2025-02-25', '2025-02-26', '2025-04-18', '2025-04-21', 
        '2025-05-01', '2025-06-19', '2025-09-07', '2025-10-12', '2025-10-28', '2025-11-02',
        '2025-11-15', '2025-11-20', '2025-11-30', '2025-12-25',
        '2025-03-03', '2025-03-04', '2025-03-05', '2025-03-06', '2025-03-07',
        '2025-07-07', '2025-07-08', '2025-07-09', '2025-07-10', '2025-07-11'
    ];

    // Loop para encontrar os dias de aula
    while ($cargaHorariaRestante > 0) {
        $diaDaSemana = (int)$currentDate->format('N'); // 1 = Segunda, 7 = Domingo
        $dataFormatada = $currentDate->format('Y-m-d');

        // Verifica se o dia é útil (segunda a sexta) e não é feriado/recesso
        if ($diaDaSemana >= 1 && $diaDaSemana <= 5 && !in_array($dataFormatada, $feriadosRecessos)) {
            $diasLetivos[] = $dataFormatada;
            $cargaHorariaRestante -= $horasPorDia;
        }
        
        // Avança para o próximo dia
        $currentDate->modify('+1 day');
    }

    $dataTermino = end($diasLetivos);
    
    return [
        'dataTermino' => $dataTermino,
        'diasLetivos' => $diasLetivos
    ];
}