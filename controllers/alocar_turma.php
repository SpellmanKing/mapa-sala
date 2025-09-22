<?php
// controllers/alocar_turma.php
header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Sala.php';
require __DIR__ . '/../models/entidades/Curso.php';
require __DIR__ . '/../models/entidades/Agendamento.php';
require __DIR__ . '/calcular_cronograma.php';
require __DIR__ . '/get_feriados.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['cursoId']) || empty($data['totalAlunos']) || empty($data['turno']) || empty($data['diasSemana']) || empty($data['dataInicio'])) {
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
    $totalAlunos = $data['totalAlunos'];
    $turno = $data['turno'];
    $diasSemanaSelecionados = $data['diasSemana'];

    $dadosCurso = $curso->buscarPorId($cursoId);
    if (!$dadosCurso || empty($dadosCurso['carga_horaria']) || empty($dadosCurso['necessidade_sala'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Curso não encontrado, carga horária ou necessidade de sala não definida.']);
        exit;
    }
    
    $cargaHoraria = $dadosCurso['carga_horaria'];
    $tipoSalaNecessaria = $dadosCurso['necessidade_sala'];

    // 1. Calcula o cronograma
    $feriados = getFeriados();
    $cronograma = calcularCronograma($cargaHoraria, $data['dataInicio'], $turno, $diasSemanaSelecionados, $feriados);
    $diasLetivos = $cronograma['diasLetivos'];
    $dataInicio = $data['dataInicio'];
    $dataTermino = $cronograma['dataTermino'];

    // 2. Filtra as salas disponíveis para a alocação
    $todasSalas = $sala->buscarTodas();
    $salasDisponiveis = [];

    foreach ($todasSalas as $s) {
        // Verifica se a sala está disponível para todos os dias do cronograma
        $estaLivre = true;
        foreach ($diasLetivos as $dia) {
            if (!$agendamento->verificarDisponibilidade($s['id_salas'], $dia, $turno)) {
                $estaLivre = false;
                break;
            }
        }
        // Se a sala estiver disponível para todos os dias, e for do tipo compatível, a adicionamos
        if ($estaLivre && $s['tipo_sala'] === $tipoSalaNecessaria) {
            $salasDisponiveis[] = $s;
        }
    }

    // 3. Usa o alocador inteligente para encontrar a melhor sala
    $sugestaoSalas = AlocarTurmas::encontrarMelhorAlocacao($salasDisponiveis, ['total_alunos' => $totalAlunos, 'tipo_sala_necessaria' => $tipoSalaNecessaria]);
    
    if ($sugestaoSalas) {
        echo json_encode([
            'success' => true,
            'salas' => $sugestaoSalas,
            'message' => 'Alocação automática concluída com sucesso. Verifique a sugestão abaixo.',
            'dataInicio' => $dataInicio,
            'dataTermino' => $dataTermino
        ]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Não foi possível encontrar uma sala disponível que atenda aos critérios para este curso e período.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}