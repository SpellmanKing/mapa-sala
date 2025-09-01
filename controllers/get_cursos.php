<?php
// api/get_cursos.php (Corrigido para usar a classe Curso)

require '../models/conexao.php';
require '../models/entidades/curso.php';

try {
    // 1. Obtém a instância da conexão via a classe Conexao (padrão Singleton)
    $pdo = Conexao::getInstancia();
    
    // 2. Cria uma instância da classe Curso, passando a conexão para ela
    $curso = new Curso($pdo);
    
    // 3. Chama o método da classe para buscar os cursos
    $cursos = $curso->buscarTodos();
    
    // 4. Retorna a resposta em JSON
    echo json_encode($cursos);

} catch (Exception $e) {
    http_response_code(500); 
    echo json_encode(['error' => $e->getMessage()]);
}