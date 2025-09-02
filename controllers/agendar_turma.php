<?php
// controllers/agendar_turma.php

// Garanta que todos os arquivos de classe são carregados
require '../models/conexao.php';
require '../models/entidades/agendador.php';
require '../models/entidades/instrutor.php';
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

// 1. Validação de Dados: Verifica se os dados essenciais estão presentes
if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['salaId']) || empty($data['turno']) || empty($data['diasSemana'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();

    // 2. Busca a carga horária do curso
    $curso = new Curso($pdo);
    $dadosCurso = $curso->buscarPorId($data['cursoId']);
    if (!$dadosCurso || empty($dadosCurso['carga_horaria'])) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado ou carga horária não especificada.']);
        exit;
    }
    $cargaHoraria = $dadosCurso['carga_horaria'];

    // 3. Verifica a disponibilidade da sala para CADA dia letivo
    $salasIds = is_array($data['salaId']) ? $data['salaId'] : [$data['salaId']];
    $agendamento = new Agendamento($pdo);
    
    // Calcula o cronograma ANTES de verificar a disponibilidade
    $cronograma = calcularCronograma($cargaHoraria, $data['dataInicio'], $data['turno'], $data['diasSemana']);
    $diasLetivos = $cronograma['diasLetivos'];
    
    foreach ($diasLetivos as $dia) {
        foreach ($salasIds as $salaId) {
            $isAvailable = $agendamento->verificarDisponibilidade($salaId, $dia, $data['turno']);
            if (!$isAvailable) {
                http_response_code(409); // Conflito
                echo json_encode(['error' => "A sala com ID $salaId já está ocupada no dia $dia e turno. Por favor, tente a Alocação Automática novamente ou escolha outra sala."]);
                exit;
            }
        }
    }
    
    $dataTermino = $cronograma['dataTermino'];

    // 4. Busca o ID do instrutor pelo nome
    $instrutorId = null;
    if (!empty($data['instrutorNome'])) {
        $instrutor = new Instrutor($pdo);
        $instrutorId = $instrutor->buscarIdPorNome($data['instrutorNome']);
    }

    // 5. Organiza os dados da turma para o Agendador
    $dadosTurma = [
        'cursoId' => $data['cursoId'],
        'dataInicio' => $data['dataInicio'],
        'dataTermino' => $dataTermino,
        'totalAlunos' => $data['totalAlunos'],
        'instrutorId' => $instrutorId,
        'turno' => $data['turno']
    ];

    // 6. Cria a instância do Agendador e agenda a turma
    $agendador = new Agendador($pdo);
    $novaTurmaId = $agendador->agendarNovaTurma($dadosTurma, $diasLetivos, $salasIds);

    echo json_encode([
        'success' => true,
        'message' => 'Turma agendada com sucesso!',
        'turmaId' => $novaTurmaId
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}