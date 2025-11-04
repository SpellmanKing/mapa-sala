<?php

class Feriado {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca todos os feriados e recessos, recuperando o nome do tipo.
     * @return array Um array de objetos representando os feriados/recessos.
     */
    public function buscarTodos() {
        try {
            $sql = "SELECT 
                        fr.id_feriado, 
                        DATE_FORMAT(fr.data_feriado, '%Y-%m-%d') AS data_feriado, 
                        fr.descricao, 
                        tf.nome_tipo AS tipo 
                    FROM feriados_recessos fr
                    JOIN tipo_feriado tf ON fr.fk_id_tipo_feriado = tf.id_tipo_feriado
                    ORDER BY data_feriado ASC";
                    
            $stmt = $this->pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar feriados/recessos: " . $e->getMessage());
        }
    }

    /**
     * Cadastra um novo feriado/recesso.
     * @param int $idTipoFeriado O ID do tipo (1=feriado, 2=recesso).
     */
    public function cadastrarFeriado(string $data, string $descricao, int $idTipoFeriado): int {
        $sql = "INSERT INTO feriados_recessos (data_feriado, descricao, fk_id_tipo_feriado) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        try {
            $stmt->execute([$data, $descricao, $idTipoFeriado]); 
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { 
                 throw new Exception("Esta data já está cadastrada como feriado ou recesso.");
            }
            throw new Exception("Erro ao cadastrar feriado/recesso: " . $e->getMessage());
        }
    }

    /**
     * Atualiza um feriado/recesso existente.
     * @param int $idTipoFeriado O ID do tipo (1=feriado, 2=recesso).
     */
    public function atualizarFeriado(int $id, string $data, string $descricao, int $idTipoFeriado): bool {
        $sql = "UPDATE feriados_recessos SET data_feriado = ?, descricao = ?, fk_id_tipo_feriado = ? WHERE id_feriado = ?";
        $stmt = $this->pdo->prepare($sql);
        try {
            return $stmt->execute([$data, $descricao, $idTipoFeriado, $id]);
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
    public function deletarFeriado(int $id): bool {
        $sql = "DELETE FROM feriados_recessos WHERE id_feriado = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }

    /**
     * Busca todos os dias letivos entre duas datas, excluindo feriados e recessos.
     */
    public function buscarDatasNaoLetivas(string $dataInicio, string $dataFim): array {
        $sql = "SELECT data_feriado FROM feriados_recessos WHERE data_feriado BETWEEN ? AND ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$dataInicio, $dataFim]);
        
        // Retorna um array simples de strings de datas (ex: ['2025-01-01', '2025-01-02'])
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}