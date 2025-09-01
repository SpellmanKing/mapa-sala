<?php

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

    /**
     * Busca um único curso pelo seu ID.
     * @param int $id O ID do curso.
     * @return array|false Um array representando o curso ou false se não encontrado.
     */
    public function buscarPorId($id) {
        try {
            $stmt = $this->pdo->prepare("SELECT carga_horaria, necessidade_sala FROM cursos WHERE id_cursos = ?");
            $stmt->execute([$id]);
            $curso = $stmt->fetch(PDO::FETCH_ASSOC);
            return $curso;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar curso por ID: " . $e->getMessage());
        }
    }
}