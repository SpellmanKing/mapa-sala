<?php

class Turma {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Atualiza o status e/ou o instrutor de uma turma.
     * @param int $turmaId O ID da turma a ser atualizada.
     * @param string $novoStatus O novo status da turma.
     * @param int|null $novoInstrutorId O ID do novo instrutor (opcional).
     * @return bool Retorna true se a operação for bem-sucedida.
     */
    
    public function atualizarStatus($turmaId, $novoStatus, $novoInstrutorId = null) {
        try {
            $this->pdo->beginTransaction();
            
            // 1. Constrói a query de forma dinâmica para atualizar o instrutor apenas se um novo ID for fornecido
            $updateFields = ['status = ?'];
            $params = [$novoStatus];

            if ($novoInstrutorId !== null) {
                $updateFields[] = 'id_instrutores = ?';
                $params[] = $novoInstrutorId;
            }

            $params[] = $turmaId;
            
            $sql_update = "UPDATE turmas SET " . implode(', ', $updateFields) . " WHERE id_turmas = ?";
            $stmt_update = $this->pdo->prepare($sql_update);
            $stmt_update->execute($params);

            // 2. Se o status for 'Cancelada', deleta todos os agendamentos associados
            if ($novoStatus === 'Cancelada') {
                $sql_delete = "DELETE FROM agendamentos WHERE id_turmas = ?";
                $stmt_delete = $this->pdo->prepare($sql_delete);
                $stmt_delete->execute([$turmaId]);
            }

            $this->pdo->commit(); 
            return true;
            
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new Exception("Erro ao atualizar turma: " . $e->getMessage());
        }
    }
}