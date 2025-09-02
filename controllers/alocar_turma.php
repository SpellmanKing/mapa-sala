<?php
// controllers/alocar_turma.php
require '../models/conexao.php';
require '../models/entidades/sala.php';
require '../models/entidades/curso.php';
require '../models/entidades/agendamento.php';
require '../models/entidades/alocador_inteligente.php';
require '../models/calcular_cronograma.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['cursoId']) || empty($data['totalAlunos']) || empty($data['turno']) || empty($data['diasSemana'])) {
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
    if (!$dadosCurso) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado.']);
        exit;
    }
    
    $cargaHorariaTotal = $dadosCurso['carga_horaria'];
    $tipoSalaNecessaria = $dadosCurso['necessidade_sala'];

    // 1. Encontra a primeira data de início disponível
    $dataInicio = (new DateTime())->format('Y-m-d');
    $diasLetivos = [];
    $dataTermino = '';

    while (empty($diasLetivos)) {
        try {
            $cronograma = calcularCronograma($cargaHorariaTotal, $dataInicio, $turno, $diasSemanaSelecionados);
            $diasLetivos = $cronograma['diasLetivos'];
            $dataTermino = $cronograma['dataTermino'];
        } catch (Exception $e) {
            // Se o cálculo do cronograma falhar, avança a data de início
            $dataInicio = (new DateTime($dataInicio))->modify('+1 day')->format('Y-m-d');
        }
    }

    // 2. Busca todas as salas e filtra as disponíveis para a alocação
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
    $sugestaoSalas = AlocadorInteligente::encontrarMelhorAlocacao($salasDisponiveis, ['total_alunos' => $totalAlunos, 'tipo_sala_necessaria' => $tipoSalaNecessaria]);
    
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
    echo json_encode(['error' => 'Nenhuma sala disponível encontrada para os critérios selecionados.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}