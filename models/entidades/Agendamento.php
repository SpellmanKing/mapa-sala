<?php

class Agendamento {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function agendarNovaTurma($dadosTurma, $diasLetivos, $salasIds) {
        try {
            // Validação de dados de entrada: o instrutor agora é obrigatório
            if (empty($dadosTurma['instrutorId'])) {
                throw new InvalidArgumentException("É necessário fornecer um ID de instrutor para agendar uma turma.");
            }
            
            $this->pdo->beginTransaction();

            // 1. Insere a nova turma na tabela `turmas`
            $sql_turma = "INSERT INTO turmas
                          (id_cursos, id_instrutores, data_inicio, data_termino, total_alunos, turno, status)
                          VALUES (?, ?, ?, ?, ?, ?, 'Planejada')";

            $stmt_turma = $this->pdo->prepare($sql_turma);
            $stmt_turma->execute([
                $dadosTurma['cursoId'],
                $dadosTurma['instrutorId'],
                $dadosTurma['dataInicio'],
                $dadosTurma['dataTermino'],
                $dadosTurma['totalAlunos'],
                $dadosTurma['turno']
            ]);

            $novaTurmaId = $this->pdo->lastInsertId();

            // 2. Insere cada agendamento na tabela `agendamentos`
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

    /**
     * Busca todos os agendamentos, com dados de turma, curso, sala e instrutor.
     * @return array Um array de objetos representando os agendamentos.
     */
    public function buscarTodos() {
        try {
            $sql = "SELECT 
                        t.id_turmas,
                        i.nome_instrutor AS instrutor,
                        t.total_alunos,
                        t.status,
                        t.turno,
                        c.nome_curso,
                        s.nome_sala,
                        s.id_salas,
                        a.data_aula
                    FROM agendamentos a
                    JOIN turmas t ON a.id_turmas = t.id_turmas
                    JOIN cursos c ON t.id_cursos = c.id_cursos
                    JOIN salas s ON a.id_salas = s.id_salas
                    JOIN instrutores i ON t.id_instrutores = i.id_instrutores
                    ORDER BY a.data_aula ASC, s.nome_sala ASC";

            $stmt = $this->pdo->query($sql);
            $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $agendamentos;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar agendamentos: " . $e->getMessage());
        }
    }

    public function verificarDisponibilidade(int $salaId, string $data, string $turno): bool {
        try {
            // Verifica se a sala já está ocupada no mesmo dia e turno.
            // Para turnos que não são 'Integral', verifica se há conflito com o mesmo turno ou com um agendamento 'Integral'.
            // Para o turno 'Integral', verifica se já existe qualquer agendamento naquele dia.
            if ($turno === 'Integral') {
                $sql = "SELECT 1 FROM agendamentos WHERE id_salas = ? AND data_aula = ? LIMIT 1";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$salaId, $data]);
            } else {
                $sql = "SELECT 1 FROM agendamentos WHERE id_salas = ? AND data_aula = ? AND (turno = ? OR turno = 'Integral') LIMIT 1";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$salaId, $data, $turno]);
            }

            return $stmt->fetch(PDO::FETCH_ASSOC) === false;
        } catch (PDOException $e) {
            // Lançar a exceção para ser tratada no controlador principal
            throw new Exception("Erro ao verificar disponibilidade: " . $e->getMessage());
        }
    }
}