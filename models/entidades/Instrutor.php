<?php

class Instrutor {
    private $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca todos os instrutores do banco de dados.
     * @return array Um array de objetos representando os instrutores.
     */
    public function buscarTodos() {
        try {
            $stmt = $this->pdo->query("SELECT id_instrutores, nome_instrutor FROM instrutores ORDER BY nome_instrutor ASC");
            $instrutores = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $instrutores;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar instrutores: " . $e->getMessage());
        }
    }

    /**
     * Busca o ID do instrutor pelo nome.
     * @param string $nome O nome do instrutor a ser buscado.
     * @return int|null O ID do instrutor ou null se não for encontrado.
     */
    public function buscarIdPorNome($nome) {
        $stmt = $this->pdo->prepare("SELECT id_instrutores FROM instrutores WHERE nome_instrutor = ?");
        $stmt->execute([$nome]);
        $instrutor = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $instrutor ? $instrutor['id_instrutores'] : null;
    }

    /**
     * Insere um novo instrutor no banco de dados.
     * @param string $nome O nome do novo instrutor.
     * @return int O ID do instrutor recém-criado.
     */
    public function cadastrarInstrutor(string $nome): int {
        $sql = "INSERT INTO instrutores (nome_instrutor) VALUES (?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$nome]);
        return $this->pdo->lastInsertId();
    }

    /**
     * Atualiza um instrutor existente.
     * @param int $id O ID do instrutor a ser atualizado.
     * @param string $nome O novo nome do instrutor.
     * @return bool Retorna true se a atualização for bem-sucedida.
     */
    public function alterarInstrutor(int $id, string $nome): bool {
        $sql = "UPDATE instrutores SET nome_instrutor = ? WHERE id_instrutores = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$nome, $id]);
    }

    /**
     * Deleta um instrutor do banco de dados.
     * @param int $id O ID do instrutor a ser deletado.
     * @return bool Retorna true se a deleção for bem-sucedida.
     */
    public function excluirInstrutor(int $id): bool {
        $sql = "DELETE FROM instrutores WHERE id_instrutores = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }

    /**
     * Gerencia a habilitação de um instrutor para múltiplos cursos.
     * Primeiro, ele deleta as habilitações existentes, depois insere as novas.
     * @param int $instrutorId O ID do instrutor.
     * @param array $cursosIds Uma lista de IDs de cursos para habilitar.
     * @return bool Retorna true se a operação for bem-sucedida.
     */
    public function gerenciarHabilitacoes(int $instrutorId, array $cursosIds): bool {
        try {
            $this->pdo->beginTransaction();

            // 1. Deleta todas as habilitações existentes para este instrutor
            $sqlDelete = "DELETE FROM instrutores_cursos WHERE id_instrutores = ?";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([$instrutorId]);

            // 2. Insere as novas habilitações
            if (!empty($cursosIds)) {
                $sqlInsert = "INSERT INTO instrutores_cursos (id_instrutores, id_cursos) VALUES (?, ?)";
                $stmtInsert = $this->pdo->prepare($sqlInsert);
                foreach ($cursosIds as $cursoId) {
                    $stmtInsert->execute([$instrutorId, $cursoId]);
                }
            }

            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new Exception("Erro ao gerenciar habilitações: " . $e->getMessage());
        }
    }

    /**
     * Verifica se um instrutor está habilitado para um curso específico.
     * @param int $instrutorId O ID do instrutor.
     * @param int $cursoId O ID do curso.
     * @return bool Retorna true se o instrutor estiver habilitado, false caso contrário.
     */
    public function estaHabilitadoParaCurso(int $instrutorId, int $cursoId): bool {
        try {
            $stmt = $this->pdo->prepare("SELECT 1 FROM instrutores_cursos WHERE id_instrutores = ? AND id_cursos = ? LIMIT 1");
            $stmt->execute([$instrutorId, $cursoId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
        } catch (PDOException $e) {
            throw new Exception("Erro ao verificar a habilitação do instrutor: " . $e->getMessage());
        }
    }    
}