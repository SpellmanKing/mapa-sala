<?php
// api/agendar_turma.php (Corrigido para o banco de dados)

require '../models/conexao.php';
require '../models/entidades/agendador.php';
require '../models/entidades/instrutor.php';
require '../models/calcular_cronograma.php'; 

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['cursoId']) || empty($data['dataInicio']) || empty($data['totalAlunos']) || empty($data['salaId']) || empty($data['turno'])) {
    http_response_code(400); 
    echo json_encode(['error' => 'Dados incompletos.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();

    // 1. Busca a carga horária do curso
    $stmt_curso = $pdo->prepare("SELECT carga_horaria FROM cursos WHERE id_cursos = ?");
    $stmt_curso->execute([$data['cursoId']]);
    $curso = $stmt_curso->fetch(PDO::FETCH_ASSOC);

    if (!$curso) {
        http_response_code(404);
        echo json_encode(['error' => 'Curso não encontrado.']);
        exit;
    }

    $cargaHoraria = $curso['carga_horaria'];

    // 2. Calcula o cronograma
    $cronograma = calcularCronograma($cargaHoraria, $data['dataInicio'], $data['turno']);
    $diasLetivos = $cronograma['diasLetivos'];
    $dataTermino = $cronograma['dataTermino'];
    
    // NOVO: Busca o ID do instrutor a partir do nome
    $instrutorId = null;
    if (!empty($data['instrutorNome'])) {
        $instrutor = new Instrutor($pdo);
        $instrutorId = $instrutor->buscarIdPorNome($data['instrutorNome']);
    }

    // 3. Organiza os dados da turma para passar para o Agendador
    $dadosTurma = [
        'cursoId' => $data['cursoId'],
        'dataInicio' => $data['dataInicio'],
        'dataTermino' => $dataTermino,
        'totalAlunos' => $data['totalAlunos'],
        'instrutorId' => $instrutorId, // Passa o ID
        'turno' => $data['turno'],
        'salaId' => $data['salaId']
    ];

    // 4. Cria a instância do Agendador e chama o método
    $agendador = new Agendador($pdo);
    $novaTurmaId = $agendador->agendarNovaTurma($dadosTurma, $diasLetivos);

    http_response_code(201);
    echo json_encode([
        'message' => 'Turma e cronograma agendados com sucesso!',
        'turmaId' => $novaTurmaId
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}