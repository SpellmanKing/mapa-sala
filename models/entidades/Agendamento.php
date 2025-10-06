<?php

class Agendamento {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function agendarNovaTurma($dadosTurma, $diasLetivos, $salasIds) {
        try {
            if (empty($dadosTurma['instrutorId'])) {
                throw new InvalidArgumentException("É necessário fornecer um ID de instrutor para agendar uma turma.");
            }
            
            $this->pdo->beginTransaction();

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
            $sql_agendamento = "INSERT INTO agendamentos (id_turmas, id_salas, data_aula, turno) VALUES (?, ?, ?, ?)";
            $stmt_agendamento = $this->pdo->prepare($sql_agendamento);

            foreach ($diasLetivos as $diaAula) {
                $dataAula = $diaAula['date'];
                
                foreach ($salasIds as $salaId) {
                    $stmt_agendamento->execute([
                        $novaTurmaId, 
                        (int)$salaId, 
                        $dataAula, 
                        $dadosTurma['turno']
                    ]);
                }
            }

            $this->pdo->commit();
            return $novaTurmaId;
            
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            // Lança uma exceção mais específica para o Controller tratar
            throw new Exception("Erro de banco de dados ao agendar a turma: " . $e->getMessage());
        } catch (Exception $e) {
            $this->pdo->rollBack(); // Garante o rollback mesmo se a exceção não for PDO
            throw $e; // Relança a exceção de Argumento Inválido, por exemplo
        }
    }
    
    /**
     * Verifica a disponibilidade de uma sala em um dia e turno específicos.
     * @param int $salaId O ID da sala.
     * @param string $data A data da aula (YYYY-MM-DD).
     * @param string $turno O turno da aula ('Manhã', 'Tarde', 'Noite', 'Integral').
     * @return bool True se a sala estiver disponível, false caso contrário.
    */
    public function verificarDisponibilidade(int $salaId, string $data, string $turno): bool {
        try {
            if ($turno === 'Integral') {
                // Se a nova turma for 'Integral', verifica se há QUALQUER agendamento
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
            throw new Exception("Erro ao verificar disponibilidade: " . $e->getMessage());
        }
    }

    /**
     * Busca todos os agendamentos no banco de dados, com detalhes da turma e sala.
    */
    public function buscarTodosCalculadora() {
        try {
            $sql = "
                SELECT 
                    a.id_agendamentos, 
                    a.data_aula, 
                    a.turno,
                    s.nome_sala,
                    t.id_turmas,
                    c.nome_curso
                FROM agendamentos a
                JOIN salas s ON a.id_salas = s.id_salas
                JOIN turmas t ON a.id_turmas = t.id_turmas
                JOIN cursos c ON t.id_cursos = c.id_cursos
                ORDER BY a.data_aula DESC, s.nome_sala ASC";

            $stmt = $this->pdo->query($sql);
            $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $agendamentos;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar agendamentos: " . $e->getMessage());
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
                    LEFT JOIN instrutores i ON t.id_instrutores = i.id_instrutores
                    ORDER BY a.data_aula ASC, s.nome_sala ASC";

            $stmt = $this->pdo->query($sql);
            $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $agendamentos;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar agendamentos: " . $e->getMessage());
        }
    }
}