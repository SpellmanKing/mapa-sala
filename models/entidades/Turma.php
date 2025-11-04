<?php

class Turma {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Atualiza o status e/ou o instrutor de uma turma.
     * @param int $turmaId O ID da turma a ser atualizada.
     * @param int $novoStatusId O novo ID de status da turma.
     * @param int|null $novoInstrutorId O ID do novo instrutor (opcional).
     * @return bool Retorna true se a operação for bem-sucedida.
    */
    
    public function atualizarStatus(int $turmaId, int $novoStatusId, $novoInstrutorId = null): bool {
        try {
            $this->pdo->beginTransaction();
            
            // 1. Constrói a query de forma dinâmica
            $updateFields = ['fk_id_status = ?'];
            $params = [$novoStatusId];

            if ($novoInstrutorId !== null) {
                $updateFields[] = 'id_instrutores = ?';
                $params[] = $novoInstrutorId;
            }

            $params[] = $turmaId;
            
            $sql_update = "UPDATE turmas SET " . implode(', ', $updateFields) . " WHERE id_turmas = ?";
            $stmt_update = $this->pdo->prepare($sql_update);
            $stmt_update->execute($params);

            // 2. Se o status for 'Cancelada' (ID 5 na nossa tabela auxiliar), deleta os agendamentos
            $STATUS_CANCELADA_ID = 5; 
            if ($novoStatusId === $STATUS_CANCELADA_ID) {
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