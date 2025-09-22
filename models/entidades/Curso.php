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
            // A consulta agora usa JOIN para buscar o nome do tipo de sala
            $stmt = $this->pdo->query("
                SELECT 
                    c.id_cursos, 
                    c.nome_curso, 
                    c.carga_horaria, 
                    ts.nome_tipo AS necessidade_sala,
                    ts.idTipo_sala AS id_tipo_sala
                FROM cursos c
                LEFT JOIN tipos_sala ts ON c.idTipo_sala = ts.idTipo_sala
                ORDER BY c.nome_curso ASC
            ");
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
            // A consulta agora usa JOIN para buscar a carga horária e o tipo de sala
            $stmt = $this->pdo->prepare("
                SELECT 
                    c.carga_horaria,
                    ts.nome_tipo AS necessidade_sala,
                    ts.idTipo_sala AS id_tipo_sala
                FROM cursos c
                LEFT JOIN tipos_sala ts ON c.idTipo_sala = ts.idTipo_sala
                WHERE c.id_cursos = ?
            ");
            $stmt->execute([$id]);
            $curso = $stmt->fetch(PDO::FETCH_ASSOC);
            return $curso;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar curso por ID: " . $e->getMessage());
        }
    }

    /**
     * Insere um novo curso no banco de dados.
     * @param string $nome O nome do novo curso.
     * @param int $cargaHoraria A carga horária do curso.
     * @param int $idTipoSala O ID do tipo de sala necessário.
     * @return int O ID do curso recém-criado.
     */
    public function cadastrarCurso(string $nome, int $cargaHoraria, int $idTipoSala): int {
        $sql = "INSERT INTO cursos (nome_curso, carga_horaria, idTipo_sala) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$nome, $cargaHoraria, $idTipoSala]);
        return $this->pdo->lastInsertId();
    }

    /**
     * Atualiza um curso existente.
     * @param int $id O ID do curso a ser atualizado.
     * @param string $nome O novo nome do curso.
     * @param int $cargaHoraria A nova carga horária do curso.
     * @param int $idTipoSala O novo ID do tipo de sala.
     * @return bool Retorna true se a atualização for bem-sucedida.
     */
    public function atualizarCurso(int $id, string $nome, int $cargaHoraria, int $idTipoSala): bool {
        $sql = "UPDATE cursos SET nome_curso = ?, carga_horaria = ?, idTipo_sala = ? WHERE id_cursos = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$nome, $cargaHoraria, $idTipoSala, $id]);
    }

    /**
     * Deleta um curso do banco de dados.
     * @param int $id O ID do curso a ser deletado.
     * @return bool Retorna true se a deleção for bem-sucedida.
     */
    public function excluirCurso(int $id): bool {
        $sql = "DELETE FROM cursos WHERE id_cursos = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }
}