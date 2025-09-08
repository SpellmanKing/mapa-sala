<?php
// models/calcular_cronograma.php

/**
 * Calcula o cronograma de aulas de um curso.
 *
 * @param int $cargaHorariaTotal A carga horária total do curso.
 * @param string $dataInicio A data de início do curso (formato Y-m-d).
 * @param string $turno O turno das aulas ('Manhã', 'Tarde', 'Noite', 'Integral').
 * @param array $diasSemanaSelecionados Um array de dias da semana selecionados (1=Segunda a 7=Domingo).
 * @param array $feriadosRecessos Uma lista de datas não letivas (formato Y-m-d).
 * @return array Um array contendo a data de término e a lista de dias letivos.
 */
function calcularCronograma(int $cargaHorariaTotal, string $dataInicio, string $turno, array $diasSemanaSelecionados, array $feriadosRecessos): array {
    
    // Regra de negócio: Carga horária por dia
    $horasPorDia = 0;
    switch ($turno) {
        case 'Manhã':
        case 'Tarde':
        case 'Noite':
            $horasPorDia = 4;
            break;
        case 'Integral':
            $horasPorDia = 8;
            break;
        default:
            throw new InvalidArgumentException("Turno inválido.");
    }

    $cargaHorariaRestante = $cargaHorariaTotal;
    $diasLetivos = [];
    $currentDate = new DateTime($dataInicio);

    while ($cargaHorariaRestante > 0) {
        // Pega o dia da semana atual (1 para Segunda, 7 para Domingo)
        $diaDaSemana = (int)$currentDate->format('N');
        $diaFormatado = $currentDate->format('Y-m-d');
        
        // Verifica se é um dia de semana selecionado E não é um feriado/recesso
        if (in_array($diaDaSemana, $diasSemanaSelecionados) && !in_array($diaFormatado, $feriadosRecessos)) {
            $diasLetivos[] = $diaFormatado;
            $cargaHorariaRestante -= $horasPorDia;
        }

        $currentDate->modify('+1 day');
    }
        
    return [
        'dataTermino' => end($diasLetivos),
        'diasLetivos' => $diasLetivos
    ];
}