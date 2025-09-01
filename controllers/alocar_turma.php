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

if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['turno'])) {
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

    // 1. Busca a carga horária e tipo de sala do curso
    $dadosCurso = $curso->buscarPorId($cursoId);
    if (!$dadosCurso) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado.']);
        exit;
    }
    
    $cargaHoraria = $dadosCurso['carga_horaria'];
    $tipoSalaNecessaria = $dadosCurso['necessidade_sala'];

    // 2. Calcula o cronograma do curso
    $cronograma = calcularCronograma($cargaHoraria, $dataInicio, $turno);
    $diasLetivos = $cronograma['diasLetivos'];
    
    // 3. Busca todas as salas e todos os agendamentos existentes
    $todasSalas = $sala->buscarTodas();
    $todosAgendamentos = $agendamento->buscarTodos();

    // 4. Encontra salas disponíveis (livres para todo o período)
    $salasDisponiveis = [];

    foreach ($todasSalas as $s) {
        $salaOcupada = false;
        foreach ($diasLetivos as $dia) {
            foreach ($todosAgendamentos as $ag) {
                if ($ag['id_salas'] == $s['id_salas'] && $ag['data_aula'] === $dia && $ag['turno'] === $turno) {
                    $salaOcupada = true;
                    break 2;
                }
            }
        }
        
        if (!$salaOcupada) {
            $salasDisponiveis[] = $s;
        }
    }

    // --- LÓGICA AVANÇADA DE ALOCAÇÃO ---

    // 5. Tenta encontrar uma Única Sala com "Melhor Encaixe"
    $melhorEncaixe = null;
    $menorDiferenca = PHP_INT_MAX;

    foreach ($salasDisponiveis as $s) {
        if ($s['capacidade_maxima'] >= $totalAlunos && $s['tipo_sala'] === $tipoSalaNecessaria) {
            $diferenca = $s['capacidade_maxima'] - $totalAlunos;
            if ($diferenca < $menorDiferenca) {
                $menorDiferenca = $diferenca;
                $melhorEncaixe = $s;
            }
        }
    }

    if ($melhorEncaixe) {
        echo json_encode([
            'success' => true,
            'salaId' => $melhorEncaixe['id_salas'],
            'nome_sala' => $melhorEncaixe['nome_sala'],
            'message' => 'Sala encontrada com sucesso via Melhor Encaixe!'
        ]);
        exit;
    }

    // 6. Se não houver sala única, tenta encontrar "Divisão entre Salas"
    $combinacaoEncontrada = null;

    // Remove salas que não são compatíveis com o tipo de curso
    $salasCompatíveis = array_filter($salasDisponiveis, function($s) use ($tipoSalaNecessaria) {
        return $s['tipo_sala'] === $tipoSalaNecessaria;
    });

    // Tenta encontrar uma combinação de duas salas
    for ($i = 0; $i < count($salasCompatíveis); $i++) {
        for ($j = $i + 1; $j < count($salasCompatíveis); $j++) {
            $sala1 = $salasCompatíveis[$i];
            $sala2 = $salasCompatíveis[$j];

            $capacidadeCombinada = $sala1['capacidade_maxima'] + $sala2['capacidade_maxima'];
            
            if ($capacidadeCombinada >= $totalAlunos) {
                $combinacaoEncontrada = [$sala1, $sala2];
                break 2; // Encontrou a primeira combinação e sai dos loops
            }
        }
    }

    if ($combinacaoEncontrada) {
        // Retorna as duas salas. O front-end precisará lidar com isso
        echo json_encode([
            'success' => true,
            'salas' => $combinacaoEncontrada,
            'message' => 'Combinação de salas encontrada com sucesso!'
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Nenhuma sala disponível ou combinação encontrada para os critérios informados.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ocorreu um erro interno: ' . $e->getMessage()]);
}