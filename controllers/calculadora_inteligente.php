<?php
// controllers/calculadora_inteligente.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Curso.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Utilize GET.']);
    exit;
}

try {
    $pdo = Conexao::getInstancia();
    $cursoModel = new Curso($pdo);

    // Passa os parâmetros GET diretamente para o método do Model
    $filtros = $_GET;
    $cursos = $cursoModel->buscarCursosComFiltros($filtros);
    
    echo json_encode($cursos);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor ao buscar cursos: ' . $e->getMessage()]);
}