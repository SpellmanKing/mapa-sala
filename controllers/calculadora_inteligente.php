<?php
// controllers/calculadora_inteligente.php
header('Content-Type: application/json');

// Garante que todos os arquivos de classe são carregados
require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Instrutor.php';
require __DIR__ . '/../models/entidades/Curso.php';
require __DIR__ . '/../models/entidades/Agendamento.php';
require __DIR__ . '/calcular_cronograma.php';
require __DIR__ . '/get_feriados.php';


$query = "SELECT * FROM cursos WHERE 1=1";
$params = [];
$types = '';

if (isset($_GET['segmento']) && !empty($_GET['segmento'])) {
    $query .= " AND segmento = ?";
    $params[] = $_GET['segmento'];
    $types .= 's';
}

if (isset($_GET['modalidade']) && !empty($_GET['modalidade'])) {
    $query .= " AND modalidade = ?";
    $params[] = $_GET['modalidade'];
    $types .= 's';
}

if (isset($_GET['nome_curso']) && !empty($_GET['nome_curso'])) {
    $query .= " AND nome_curso LIKE ?";
    $params[] = '%' . $_GET['nome_curso'] . '%';
    $types .= 's';
}

if (isset($_GET['ch_min']) && !empty($_GET['ch_min'])) {
    $query .= " AND carga_horaria >= ?";
    $params[] = $_GET['ch_min'];
    $types .= 'i';
}

if (isset($_GET['ch_max']) && !empty($_GET['ch_max'])) {
    $query .= " AND carga_horaria <= ?";
    $params[] = $_GET['ch_max'];
    $types .= 'i';
}

if (isset($_GET['tem']) && $_GET['tem'] === 'true') {
    $query .= " AND tem = 1";
}

if (isset($_GET['bolsa']) && $_GET['bolsa'] === 'true') {
    $query .= " AND compativel_bolsa = 1";
}

$stmt = $conn->prepare($query);

if ($types) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$courses = [];
while ($row = $result->fetch_assoc()) {
    $courses[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode($courses);