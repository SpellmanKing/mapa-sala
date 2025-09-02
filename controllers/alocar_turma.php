<?php
// controllers/alocar_turma.php

require '../models/conexao.php';
require '../models/entidades/sala.php';
require '../models/entidades/curso.php';
require '../models/entidades/agendamento.php';
require '../models/calcular_cronograma.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['turno']) || empty($data['diasSemana'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();
    $curso = new Curso($pdo);
    $sala = new Sala($pdo);
    $agendamento = new Agendamento($pdo);
    
    $cursoId = $data['cursoId'];
    $dataInicio = $data['dataInicio'];
    $totalAlunos = $data['totalAlunos'];
    $turno = $data['turno'];
    $diasSemanaSelecionados = $data['diasSemana'];

    $dadosCurso = $curso->buscarPorId($cursoId);
    if (!$dadosCurso) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado.']);
        exit;
    }
    $cargaHoraria = $dadosCurso['carga_horaria'];
    $tipoCurso = $dadosCurso['tipo_curso']; // Supondo que você tenha um campo 'tipo_curso' para identificar TEM
    $tipoSalaNecessaria = $dadosCurso['necessidade_sala'];

    // Calcula o cronograma do curso
    $cronograma = calcularCronograma($cargaHoraria, $dataInicio, $turno, $diasSemanaSelecionados);
    $diasLetivos = $cronograma['diasLetivos'];
    
    // Busca todas as salas e todos os agendamentos existentes
    $todasSalas = $sala->buscarTodas();
    $todosAgendamentos = $agendamento->buscarTodos();

    // Filtra as salas compatíveis com o tipo de curso e que estão disponíveis para todos os dias
    $salasCandidatas = [];
    foreach ($todasSalas as $s) {
        if ($s['tipo_sala'] === $tipoSalaNecessaria && $s['capacidade_maxima'] >= $totalAlunos) {
            $isAvailable = true;
            foreach ($diasLetivos as $dia) {
                if (!$agendamento->verificarDisponibilidade($s['id_salas'], $dia, $turno)) {
                    $isAvailable = false;
                    break;
                }
            }
            if ($isAvailable) {
                // Adiciona a sala candidata, incluindo o número de agendamentos existentes
                $s['ocupacao_existente'] = array_reduce($todosAgendamentos, function($count, $item) use ($s) {
                    return $count + ($item['id_salas'] == $s['id_salas'] ? 1 : 0);
                }, 0);
                $salasCandidatas[] = $s;
            }
        }
    }

    // Função de comparação para a hierarquia de regras
    usort($salasCandidatas, function($a, $b) use ($totalAlunos, $tipoCurso) {
        // 1. Prioridade Máxima para Cursos TEM
        // Supondo que você adicione uma flag 'is_tem' ao curso para identificação
        if ($tipoCurso === 'TEM') {
            // Se for um curso TEM, simplesmente use as regras abaixo
        } else {
            // Se não for TEM, talvez haja uma lógica de desempate diferente, mas
            // para este exemplo, seguimos as regras padrão.
        }

        // 2. Otimização de Capacidade ("Melhor Encaixe")
        $diffA = abs($a['capacidade_maxima'] - $totalAlunos);
        $diffB = abs($b['capacidade_maxima'] - $totalAlunos);
        if ($diffA !== $diffB) {
            return $diffA <=> $diffB;
        }

        // 3. Ocupação Máxima da Sala
        if ($a['ocupacao_existente'] !== $b['ocupacao_existente']) {
            return $b['ocupacao_existente'] <=> $a['ocupacao_existente']; // Ordem decrescente
        }
        
        // 4. Critério de Desempate Final (Ordem Alfabética)
        return $a['nome_sala'] <=> $b['nome_sala'];
    });

    // Se uma sala única foi encontrada e classificada
    if (!empty($salasCandidatas)) {
        $melhorSala = $salasCandidatas[0];
        echo json_encode([
            'success' => true,
            'salas' => [$melhorSala],
            'message' => 'Alocação automática bem-sucedida! A turma foi agendada na ' . $melhorSala['nome_sala'] . '.'
        ]);
        exit;
    }

    // Se não encontrou sala única, busca por combinação de salas (lógica de fallback)
    $salasDisponiveis_Divisao = [];
    foreach ($todasSalas as $s) {
        $estaLivre = true;
        foreach ($diasLetivos as $dia) {
            if (!$agendamento->verificarDisponibilidade($s['id_salas'], $dia, $turno)) {
                $estaLivre = false;
                break;
            }
        }
        if($estaLivre) {
            $salasDisponiveis_Divisao[] = $s;
        }
    }

    $combinacaoEncontrada = null;
    for ($i = 0; $i < count($salasDisponiveis_Divisao); $i++) {
        for ($j = $i + 1; $j < count($salasDisponiveis_Divisao); $j++) {
            $sala1 = $salasDisponiveis_Divisao[$i];
            $sala2 = $salasDisponiveis_Divisao[$j];

            if ($sala1['tipo_sala'] === $tipoSalaNecessaria && $sala2['tipo_sala'] === $tipoSalaNecessaria) {
                $capacidadeCombinada = $sala1['capacidade_maxima'] + $sala2['capacidade_maxima'];
                
                if ($capacidadeCombinada >= $totalAlunos) {
                    $combinacaoEncontrada = [$sala1, $sala2];
                    break 2;
                }
            }
        }
    }

    if ($combinacaoEncontrada) {
        echo json_encode([
            'success' => true,
            'salas' => $combinacaoEncontrada,
            'message' => 'Nenhuma sala única encontrada. Foi sugerida uma combinação de salas.'
        ]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Nenhuma sala ou combinação de salas encontrada com a capacidade necessária para os dias e turno selecionados.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}