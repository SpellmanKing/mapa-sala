<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// controllers/gerenciar_cursos.php
header('Content-Type: application/json');

require __DIR__ . '/../models/Conexao.php';
require __DIR__ . '/../models/entidades/Curso.php';

try {
    $pdo = Conexao::getInstancia();
    $curso = new Curso($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $cursos = $curso->buscarTodos();
        echo json_encode($cursos);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    switch ($method) {
        case 'POST': // Criar curso
            if (empty($data['nome_curso']) || empty($data['carga_horaria']) || empty($data['idTipo_sala'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nome, carga horária e tipo de sala são obrigatórios.']);
                exit;
            }
            $cursoId = $curso->cadastarCurso($data['nome_curso'], $data['carga_horaria'], $data['idTipo_sala']);
            echo json_encode(['message' => 'Curso criado com sucesso!', 'id' => $cursoId]);
            break;

        case 'PUT': // Atualizar curso
            if (empty($data['id_cursos']) || empty($data['nome_curso']) || empty($data['carga_horaria']) || empty($data['idTipo_sala'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID, nome, carga horária e tipo de sala são obrigatórios.']);
                exit;
            }
            $curso->atualizarCurso($data['id_cursos'], $data['nome_curso'], $data['carga_horaria'], $data['idTipo_sala']);
            echo json_encode(['message' => 'Curso atualizado com sucesso!']);
            break;

        case 'DELETE': // Deletar curso
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID do curso é obrigatório.']);
                exit;
            }
            $curso->excluirCurso($id);
            echo json_encode(['message' => 'Curso deletado com sucesso!']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido.']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}
