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
            $horasPorDia = 4; // Simplificação: 4h/dia padrão
            break;
        case 'Integral':
            $horasPorDia = 8; // 8h/dia
            break;
        case 'Vespertino':
            $horasPorDia = 5; // 5h/dia (Adicionado para flexibilidade)
            break;
        default:
            throw new InvalidArgumentException("Turno inválido ou horas por dia não configuradas.");
    }

    if ($horasPorDia <= 0) {
        throw new InvalidArgumentException("Não foi possível determinar a carga horária diária.");
    }
    
    // Calcula o Total de Dias Letivos (TDL) necessários
    $totalDiasLetivos = (int) ceil($cargaHorariaTotal / $horasPorDia); // TDL = CH Total / CH Diária
    
    // Calculo para dias remotos
    $diasRemotosNecessarios = floor($diasLetivosNecessarios * ($porcentagemRemoto / 100));
    $diasPresenciaisNecessarios = $diasLetivosNecessarios - $diasRemotosNecessarios;
    
    // Estruturas de controle para a simulação
    $currentDate = new DateTime($dataInicio);
    $feriadosMap = array_flip($feriadosRecessosParam); // Mapa para busca rápida O(1)
    
    $diasLetivos = [];
    $totalDiasAula = 0;
    $dataTermino = null;

    // Simulação da Agenda
    while ($totalDiasAula < $totalDiasLetivos) {
        $diaDaSemana = (int) $currentDate->format('N'); // 1 (Segunda) a 7 (Domingo)
        $dataAtual = $currentDate->format('Y-m-d');

        $isDiaDeAulaProgramado = in_array($diaDaSemana, $diasSemanaSelecionados);
        $isFeriadoOuRecesso = isset($feriadosMap[$dataAtual]);

        // Se for um dia da semana de aula programado E não for feriado/recesso
        if ($isDiaDeAulaProgramado && !$isFeriadoOuRecesso) {
            
            $diasLetivos[] = $dataAtual;
            $totalDiasAula++;
            $dataTermino = $dataAtual; // A data de término é o último dia de aula contado
        }

        $currentDate->modify('+1 day');
    }
        
    return [
        'dataTermino' => $dataTermino,
        'diasLetivos' => $diasLetivos,
        'totalDiasAula' => $totalDiasAula,
        'horasPorDia' => $horasPorDia
        // Outras informações de calendário (presencial/remoto) podem ser adicionadas se necessário,
        // mas não são estritamente necessárias para a alocação de sala/agendamento.
    ];
}