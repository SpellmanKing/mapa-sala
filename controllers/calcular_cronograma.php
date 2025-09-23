<?php
function calcularCronograma(int $cargaHorariaTotal, string $dataInicio, string $turno, array $diasSemanaSelecionados, array $feriadosRecessos, $porcentagemRemoto = 0): array {
    
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
    $calendario = [];
    $currentDate = new DateTime($dataInicio);

    $diasPresenciais = 0;
    $diasRemotos = 0;

    // Apenas para demonstração, o array de dias letivos será populado
    // com objetos para refletir o que o front-end espera
    $diasLetivos = [];

    $diasTotaisDeAula = ($cargaHorariaTotal / $horasPorDia);
    $diasRemotosNecessarios = round($diasTotaisDeAula * ($porcentagemRemoto / 100));
    $diasPresenciaisNecessarios = $diasTotaisDeAula - $diasRemotosNecessarios;

    while ($cargaHorariaRestante > 0) {
        $diaDaSemana = (int)$currentDate->format('N');
        $diaFormatado = $currentDate->format('Y-m-d');
        $isFeriadoOuRecesso = in_array($diaFormatado, $feriadosRecessos);
        $isDiaDeAula = in_array($diaDaSemana, $diasSemanaSelecionados) && !$isFeriadoOuRecesso;

        $diaData = [
            'date' => $diaFormatado,
            'is_weekend' => ($diaDaSemana == 6 || $diaDaSemana == 7),
            'is_holiday' => $isFeriadoOuRecesso,
            'is_class_day' => $isDiaDeAula,
            'type' => null, // 'presencial', 'remoto', etc. - Adicione sua lógica aqui
            'description' => '' // Adicione descrições de feriados/recessos aqui
        ];

        if ($isDiaDeAula) {
            $cargaHorariaRestante -= $horasPorDia;
            $totalDiasAula++;
            
            // Lógica para diferenciar dias presenciais/remotos
            if ($diasRemotos < $diasRemotosNecessarios) {
                $diasRemotos++;
                $diaData['type'] = 'remoto';
                $diaData['description'] = "Dia de Aula Remoto";
            } else {
                $diasPresenciais++;
                $diaData['type'] = 'presencial';
                $diaData['description'] = "Dia de Aula Presencial";
            }
        }
        
        $calendario[] = $diaData;

        $currentDate->modify('+1 day');
    }
        
    return [
        'total_carga_horaria' => $cargaHorariaTotal,
        'data_termino' => $currentDate->modify('-1 day')->format('Y-m-d'),
        'calendario' => $calendario,
        'dias_letivos' => $diasLetivos,
        'total_dias_aula' => $totalDiasAula
    ];
}