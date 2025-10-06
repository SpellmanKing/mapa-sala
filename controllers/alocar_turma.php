<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// controllers/alocar_turma.php
header('Content-Type: application/json');

require_once __DIR__ . '/../models/Conexao.php';
require_once __DIR__ . '/../models/entidades/Sala.php';
require_once __DIR__ . '/../models/entidades/Curso.php';
require_once __DIR__ . '/../models/entidades/Agendamento.php';
require_once __DIR__ . '/../models/entidades/AlocarTurmas.php';
require_once __DIR__ . '/../models/entidades/Feriado.php';
require_once __DIR__ . '/calcular_cronograma.php';

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
    $dataInicio = $data['dataInicio'];
    $totalAlunos = $data['totalAlunos'];
    $turno = $data['turno'];
    $diasSemana = $data['diasSemana'];
    $porcentagemRemoto = $data['porcentagemRemoto'] ?? 0;

    // 1. Busca a carga horária e o tipo de sala necessários para o curso
    $dadosCurso = $curso->buscarPorId($cursoId);
    if (!$dadosCurso) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Curso não encontrado.']);
        exit;
    }
    $cargaHorariaTotal = $dadosCurso['carga_horaria'];
    $tipoSalaNecessaria = $dadosCurso['necessidade_sala'];

    // 2. Calcula o cronograma (dias letivos)
    // A função calcularCronograma agora busca feriados do banco de dados internamente.
    $cronograma = calcularCronograma($cargaHorariaTotal, $dataInicio, $turno, $diasSemana, [], $porcentagemRemoto);
    $diasLetivos = array_column($cronograma['diasLetivos'], 'date');
    $dataTermino = $cronograma['data_termino'];

    // 3. Busca todas as salas e filtra por disponibilidade
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
            // Adiciona a sala se a capacidade for pelo menos 50% dos alunos, para otimizar o uso
            if ($s['capacidade_maxima'] >= ($totalAlunos * 0.5)) { 
                $salasDisponiveis[] = $s;
            }
        }
    }

    // 4. Usa o alocador inteligente para encontrar a melhor sala
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
    echo json_encode(['success' => false, 'error' => 'Não foi possível encontrar uma sala disponível que atenda aos requisitos de capacidade ou tipo para a turma.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}