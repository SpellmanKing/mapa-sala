<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// controllers/calculadora_inteligente.php
header('Content-Type: application/json');

// Garante que todos os arquivos de classe são carregados
require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Curso.php';

$query = "SELECT * FROM cursos WHERE 1=1";
$params = [];

if (isset($_GET['segmento']) && !empty($_GET['segmento'])) {
    $query .= " AND segmento = ?";
    $params[] = $_GET['segmento'];
}

if (isset($_GET['modalidade']) && !empty($_GET['modalidade'])) {
    $query .= " AND modalidade = ?";
    $params[] = $_GET['modalidade'];
}

if (isset($_GET['nome_curso']) && !empty($_GET['nome_curso'])) {
    $query .= " AND nome_curso LIKE ?";
    $params[] = '%' . $_GET['nome_curso'] . '%';
}

if (isset($_GET['ch_min']) && !empty($_GET['ch_min'])) {
    $query .= " AND carga_horaria >= ?";
    $params[] = $_GET['ch_min'];
}

if (isset($_GET['ch_max']) && !empty($_GET['ch_max'])) {
    $query .= " AND carga_horaria <= ?";
    $params[] = $_GET['ch_max'];
}

if (isset($_GET['tem']) && $_GET['tem'] === 'true') {
    $query .= " AND tem = 1";
}

if (isset($_GET['bolsa']) && $_GET['bolsa'] === 'true') {
    $query .= " AND compativel_bolsa = 1";
}

try {
    $pdo = Conexao::getInstancia();
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $cursos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // O retorno está no formato JSON
    echo json_encode($cursos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de banco de dados: ' . $e->getMessage()]);
}
