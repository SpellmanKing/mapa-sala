<?php

class Instrutor {
    private $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca todos os instrutores do banco de dados, incluindo os cursos habilitados.
     * @return array Um array de objetos representando os instrutores.
     */
    public function buscarTodos() {
        try {
            $sql = "SELECT 
                        i.id_instrutores, 
                        i.nome_instrutor, 
                        GROUP_CONCAT(c.nome_curso SEPARATOR '||') AS cursos_habilitados_nomes,
                        GROUP_CONCAT(c.id_cursos SEPARATOR ',') AS cursos_habilitados_ids
                    FROM instrutores i
                    LEFT JOIN instrutores_cursos ic ON i.id_instrutores = ic.id_instrutores
                    LEFT JOIN cursos c ON ic.id_cursos = c.id_cursos
                    GROUP BY i.id_instrutores, i.nome_instrutor
                    ORDER BY i.nome_instrutor ASC";
                    
            $stmt = $this->pdo->query($sql);
            $instrutores = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Transforma as strings concatenadas em arrays
            return array_map(function($instrutor) {
                $instrutor['cursos_habilitados_ids'] = $instrutor['cursos_habilitados_ids'] ? explode(',', $instrutor['cursos_habilitados_ids']) : [];
                $instrutor['cursos_habilitados_nomes'] = $instrutor['cursos_habilitados_nomes'] ? explode('||', $instrutor['cursos_habilitados_nomes']) : [];
                return $instrutor;
            }, $instrutores);

        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar instrutores e cursos: " . $e->getMessage());
        }
    }

    /**
     * Busca o ID do instrutor pelo nome.
     */
    public function buscarIdPorNome($nome) {
        $stmt = $this->pdo->prepare("SELECT id_instrutores FROM instrutores WHERE nome_instrutor = ?");
        $stmt->execute([$nome]);
        $instrutor = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $instrutor ? $instrutor['id_instrutores'] : null;
    }

    /**
     * Cadastra um novo instrutor e retorna o ID.
     */
    public function cadastarInstrutor(string $nome): int {
        $sql = "INSERT INTO instrutores (nome_instrutor) VALUES (?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$nome]);
        return $this->pdo->lastInsertId();
    }

    /**
     * Atualiza o nome de um instrutor existente.
     */
    public function alterarInstrutor(int $id, string $nome): bool {
        $sql = "UPDATE instrutores SET nome_instrutor = ? WHERE id_instrutores = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$nome, $id]);
    }

    /**
     * Deleta um instrutor.
     */
    public function excluirInstrutor(int $id): bool {
        // A exclusão de `instrutores_cursos` deve ser tratada com CASCADE no BD, 
        // ou feita manualmente aqui se não houver CASCADE.
        // Assumindo CASCADE na tabela `turmas` ou que a exclusão de instrutores
        // não é bloqueada por turmas existentes.
        $sql = "DELETE FROM instrutores WHERE id_instrutores = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }
    
    /**
     * Gerencia a vinculação de cursos (habilitações) de um instrutor.
     * Isso substitui todas as habilitações anteriores pelas novas.
     */
    public function gerenciarHabilitacoes(int $instrutorId, array $cursosIds): bool {
        try {
            $this->pdo->beginTransaction();

            // 1. Deleta todas as habilitações existentes
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
     */
    public function estaHabilitadoParaCurso(int $instrutorId, int $cursoId): bool {
        try {
            $stmt = $this->pdo->prepare("SELECT 1 FROM instrutores_cursos WHERE id_instrutores = ? AND id_cursos = ? LIMIT 1");
            $stmt->execute([$instrutorId, $cursoId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
        } catch (PDOException $e) {
            throw new Exception("Erro ao verificar habilitação: " . $e->getMessage());
        }
    }
}