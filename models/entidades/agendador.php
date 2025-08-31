<?php
// api/Entidades/Agendador.php (Corrigido)

class Agendador {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Agenda uma nova turma e seus respectivos agendamentos.
     * @param array $dadosTurma Dados da turma a ser agendada.
     * @param array $diasLetivos Lista de datas das aulas.
     * @return int O ID da nova turma criada.
     */
    public function agendarNovaTurma($dadosTurma, $diasLetivos) {
        try {
            $this->pdo->beginTransaction();

            // 1. Insere a nova turma na tabela `turmas`
            $sql_turma = "INSERT INTO turmas 
                          (id_cursos, data_inicio, data_termino, total_alunos, status, id_instrutores, turno) 
                          VALUES (?, ?, ?, ?, 'Planejada', ?, ?)";
            $stmt_turma = $this->pdo->prepare($sql_turma);
            $stmt_turma->execute([
                $dadosTurma['cursoId'],
                $dadosTurma['dataInicio'],
                $dadosTurma['dataTermino'],
                $dadosTurma['totalAlunos'],
                $dadosTurma['instrutorId'], // Salva o ID do instrutor
                $dadosTurma['turno']
            ]);

            $novaTurmaId = $this->pdo->lastInsertId();

            // 2. Insere cada dia letivo na tabela `agendamentos`
            $sql_agendamento = "INSERT INTO agendamentos (id_turmas, id_salas, data_aula) VALUES (?, ?, ?)";
            $stmt_agendamento = $this->pdo->prepare($sql_agendamento);
            foreach ($diasLetivos as $data_aula) {
                $stmt_agendamento->execute([
                    $novaTurmaId, 
                    $dadosTurma['salaId'], 
                    $data_aula
                ]);
            }

            $this->pdo->commit(); // Confirma a transação

            return $novaTurmaId;
        } catch (PDOException $e) {
            $this->pdo->rollBack(); // Desfaz tudo se houver erro
            throw new Exception("Erro ao agendar turma: " . $e->getMessage());
        }
    }
}