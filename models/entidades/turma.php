<?php
// api/Entidades/Turma.php (Corrigido)

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
            
            // 1. Atualiza o status e, opcionalmente, o instrutor da turma
            $sql_update = "UPDATE turmas SET status = ?, id_instrutores = ? WHERE id_turmas = ?";
            $stmt_update = $this->pdo->prepare($sql_update);
            $stmt_update->execute([$novoStatus, $novoInstrutorId, $turmaId]);

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
            throw new Exception("Erro ao gerenciar turma: " . $e->getMessage());
        }
    }
}