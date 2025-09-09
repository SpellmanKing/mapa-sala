<?php

class Agendador {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Agenda uma nova turma e seus respectivos agendamentos.
     * @param array $dadosTurma Dados da turma a ser agendada.
     * @param array $diasLetivos Lista de datas das aulas.
     * @param array $salasIds IDs das salas a serem agendadas.
     * @return int O ID da nova turma criada.
     */
    public function agendarNovaTurma($dadosTurma, $diasLetivos, $salasIds) {
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
                $dadosTurma['instrutorId'],
                $dadosTurma['turno']
            ]);

            $novaTurmaId = $this->pdo->lastInsertId();

            // 2. Insere cada agendamento na tabela `agendamentos`
            // NOVO: Adiciona a coluna 'turno' na instrução SQL e no execute
            $sql_agendamento = "INSERT INTO agendamentos (id_turmas, id_salas, data_aula, turno) VALUES (?, ?, ?, ?)";
            $stmt_agendamento = $this->pdo->prepare($sql_agendamento);
            
            // Loop aninhado para cada sala
            foreach ($salasIds as $salaId) {
                // E para cada dia letivo da turma
                foreach ($diasLetivos as $data_aula) {
                    $stmt_agendamento->execute([
                        $novaTurmaId, 
                        $salaId, 
                        $data_aula,
                        $dadosTurma['turno'] // Passa o turno para a tabela de agendamentos
                    ]);
                }
            }

            $this->pdo->commit(); // Confirma a transação

            return $novaTurmaId;
        } catch (PDOException $e) {
            $this->pdo->rollBack(); // Desfaz a transação em caso de erro
            throw new Exception("Erro ao agendar a turma: " . $e->getMessage());
        }
    }
}