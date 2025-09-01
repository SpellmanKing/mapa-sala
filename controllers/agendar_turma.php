<?php
// controllers/agendar_turma.php

require '../models/conexao.php';
require '../models/entidades/agendador.php';
require '../models/entidades/instrutor.php';
require '../models/entidades/curso.php'; 
require '../models/calcular_cronograma.php'; 

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// 1. Validação de Dados: Verifica se os dados essenciais estão presentes
// Agora o 'salaId' pode ser uma string com múltiplos IDs
if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['salaId']) || empty($data['turno'])) {
    http_response_code(400); 
    echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();

    // 2. Busca a carga horária do curso utilizando a classe Curso
    $curso = new Curso($pdo);
    $dadosCurso = $curso->buscarPorId($data['cursoId']);

    if (!$dadosCurso || empty($dadosCurso['carga_horaria'])) {
        http_response_code(404);
        echo json_encode(['error' => 'Carga horária do curso não encontrada.']);
        exit;
    }

    $cargaHoraria = $dadosCurso['carga_horaria'];

    // 3. Obtém o ID do instrutor
    $instrutorId = null;
    if (!empty($data['instrutorNome'])) {
        $instrutor = new Instrutor($pdo);
        $instrutorId = $instrutor->buscarIdPorNome($data['instrutorNome']);
    }

    // 4. Calcula o cronograma
    $cronograma = calcularCronograma($cargaHoraria, $data['dataInicio'], $data['turno']);
    $diasLetivos = $cronograma['diasLetivos'];
    $dataTermino = $cronograma['dataTermino'];
    
    // NOVO: Transforma a string de IDs de sala em um array
    $salasIds = array_map('intval', explode(',', $data['salaId']));

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
    // Passa o array de salas para o método
    $novaTurmaId = $agendador->agendarNovaTurma($dadosTurma, $diasLetivos, $salasIds);
    
    http_response_code(201); // Created
    echo json_encode(['success' => true, 'message' => 'Turma agendada com sucesso!', 'turmaId' => $novaTurmaId]);

} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => 'Ocorreu um erro ao agendar a turma: ' . $e->getMessage()]);
}