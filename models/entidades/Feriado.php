<?php

class Feriado {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca todos os feriados e recessos.
     * @return array Um array de objetos representando os feriados/recessos.
     */
    public function buscarTodos() {
        try {
            $stmt = $this->pdo->query("SELECT id_feriado, DATE_FORMAT(data_feriado, '%Y-%m-%d') AS data_feriado, descricao, tipo FROM feriados_recessos ORDER BY data_feriado ASC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar feriados/recessos: " . $e->getMessage());
        }
    }

    /**
     * Cadastra um novo feriado/recesso.
     */
    public function cadastrarFeriado(string $data, string $descricao, string $tipo): int {
        $sql = "INSERT INTO feriados_recessos (data_feriado, descricao, tipo) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        try {
            $stmt->execute([$data, $descricao, $tipo]);
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            // 23000 é o código de erro para violação de chave única (data_feriado)
            if ($e->getCode() == 23000) { 
                 throw new Exception("Esta data já está cadastrada como feriado ou recesso.");
            }
            throw new Exception("Erro ao cadastrar feriado/recesso: " . $e->getMessage());
        }
    }

    /**
     * Atualiza um feriado/recesso existente.
     */
    public function atualizarFeriado(int $id, string $data, string $descricao, string $tipo): bool {
        $sql = "UPDATE feriados_recessos SET data_feriado = ?, descricao = ?, tipo = ? WHERE id_feriado = ?";
        $stmt = $this->pdo->prepare($sql);
        try {
            return $stmt->execute([$data, $descricao, $tipo, $id]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                 throw new Exception("A data informada já está cadastrada em outro registro.");
            }
            throw new Exception("Erro ao atualizar feriado/recesso: " . $e->getMessage());
        }
    }

    /**
     * Deleta um feriado/recesso.
     */
    public function excluirFeriado(int $id): bool {
        $sql = "DELETE FROM feriados_recessos WHERE id_feriado = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }
}