<?php
// api/Entidades/Curso.php

class Curso {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca todos os cursos no banco de dados.
     * @return array Um array de objetos representando os cursos.
     */
    public function buscarTodos() {
        try {
            $stmt = $this->pdo->query("SELECT id_cursos, nome_curso, carga_horaria, necessidade_sala FROM cursos ORDER BY nome_curso ASC");
            $cursos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $cursos;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar cursos: " . $e->getMessage());
        }
    }
}