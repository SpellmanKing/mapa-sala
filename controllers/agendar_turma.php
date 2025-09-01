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

    if (!$dadosCurso || empty($dadosCurso['carga_horaria']) || $dadosCurso['carga_horaria'] <= 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado ou carga horária inválida.']);
        exit;
    }

    $cargaHoraria = $dadosCurso['carga_horaria'];

    // 3. Busca o ID do instrutor a partir do nome (se fornecido)
    $instrutorId = null;
    if (!empty($data['instrutorNome'])) {
        $instrutor = new Instrutor($pdo);
        $instrutorId = $instrutor->buscarIdPorNome($data['instrutorNome']);
        // Se o instrutor não for encontrado, o ID continuará sendo null.
        // Isso permite agendar a turma sem instrutor no início.
    }

    // 4. Calcula o cronograma
    // O erro pode ter ocorrido aqui se a carga horária não for um número.
    // Agora, verificamos se a carga horária é válida antes.
    $cronograma = calcularCronograma($cargaHoraria, $data['dataInicio'], $data['turno']);
    $diasLetivos = $cronograma['diasLetivos'];
    $dataTermino = $cronograma['dataTermino'];
    
    // 5. Organiza os dados da turma para o Agendador
    $dadosTurma = [
        'cursoId' => $data['cursoId'],
        'dataInicio' => $data['dataInicio'],
        'dataTermino' => $dataTermino,
        'totalAlunos' => $data['totalAlunos'],
        'instrutorId' => $instrutorId, 
        'turno' => $data['turno'],
        'salaId' => $data['salaId']
    ];

    // 6. Cria a instância do Agendador e agenda a turma
    $agendador = new Agendador($pdo);
    $novaTurmaId = $agendador->agendarNovaTurma($dadosTurma, $diasLetivos);
    
    http_response_code(201); // 201 Created é mais apropriado para uma nova criação
    echo json_encode(['message' => 'Turma agendada com sucesso!', 'turmaId' => $novaTurmaId]);

} catch (Exception $e) {
    // 7. Tratamento de Exceções
    http_response_code(500); 
    echo json_encode(['error' => 'Erro ao agendar turma: ' . $e->getMessage()]);
}
