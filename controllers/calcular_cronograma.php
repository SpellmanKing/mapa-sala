<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

/**
 * Calcula o cronograma de aulas, data de término e dias letivos de um curso.
 *
 * @param int $cargaHorariaTotal Carga horária total do curso em horas.
 * @param string $dataInicio Data de início (formato YYYY-MM-DD).
 * @param string $turno Turno ('Manhã', 'Tarde', 'Noite', 'Integral').
 * @param array $diasSemanaSelecionados Array com os números dos dias da semana (1=Segunda a 7=Domingo).
 * @param array $feriadosRecessosParam Array de datas de feriados/recessos (formato YYYY-MM-DD).
 * @param int $porcentagemRemoto Porcentagem da carga horária que deve ser remota (0 a 100).
 * @return array Contendo a data de término, dias letivos, e o calendário completo.
 */
function calcularCronograma(int $cargaHorariaTotal, string $dataInicio, string $turno, array $diasSemanaSelecionados, array $feriadosRecessosParam = [], $porcentagemRemoto = 0): array {
    
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

    if ($horasPorDia <= 0) {
        throw new InvalidArgumentException("Não foi possível determinar a carga horária diária.");
    }
    
    $cargaHorariaRestante = $cargaHorariaTotal;
    $diasLetivosNecessarios = ceil($cargaHorariaTotal / $horasPorDia);
    
    // Calculo para dias remotos
    $diasRemotosNecessarios = floor($diasLetivosNecessarios * ($porcentagemRemoto / 100));
    $diasPresenciaisNecessarios = $diasLetivosNecessarios - $diasRemotosNecessarios;
    
    $diasPresenciais = 0;
    $diasRemotos = 0;
    
    $calendario = [];
    $totalDiasAula = 0;
    
    $currentDate = new DateTime($dataInicio);
    $dataTermino = null;

    // Loop até que a carga horária restante seja totalmente distribuída
    while ($cargaHorariaRestante > 0) {
        $dataTermino = $currentDate->format('Y-m-d');
        
        // 1. Verifica se a data atual é feriado/recesso
        $diaFormatado = $currentDate->format('Y-m-d');
        $isFeriadoOuRecesso = in_array($diaFormatado, $feriadosRecessosParam);
        
        // 2. Verifica o dia da semana (1=Segunda, 7=Domingo)
        $diaDaSemana = (int)$currentDate->format('N'); 
        
        // 3. Define se é um dia de aula potencial
        $isDiaDeAula = in_array($diaDaSemana, $diasSemanaSelecionados) && !$isFeriadoOuRecesso;

        $diaData = [
            'date' => $diaFormatado,
            'is_weekend' => ($diaDaSemana == 6 || $diaDaSemana == 7),
            'is_holiday' => $isFeriadoOuRecesso,
            'is_class_day' => $isDiaDeAula,
            'type' => null, // 'presencial' ou 'remoto'
            'description' => '' // Descrição do dia (Aula, Feriado, Recesso, etc)
        ];

        if ($isFeriadoOuRecesso) {
            // Se for feriado, buscar descrição do feriado (opcional, mas útil para o calendário)
            $diaData['description'] = 'Feriado/Recesso';
        }
        
        if ($isDiaDeAula) {
            $cargaHorariaRestante -= $horasPorDia;
            $totalDiasAula++;
            
            // Lógica para diferenciar dias presenciais/remotos
            // Prioriza dias remotos para distribuir uniformemente (ou conforme a regra de negócio)
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

        // Avança para o próximo dia
        $currentDate->modify('+1 day');
    }
        
    return [
        'total_carga_horaria' => $cargaHorariaTotal,
        'data_termino' => $dataTermino,
        'diasLetivos' => array_filter($calendario, function($dia) {
            return $dia['is_class_day'];
        }),
        'calendarioCompleto' => $calendario
    ];
}