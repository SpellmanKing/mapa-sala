<?php

class Agendamento {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Cadastra a nova turma e seus respectivos agendamentos.
     */
    public function agendarNovaTurma($dadosTurma, $diasLetivos, $salasIds): int {
        try {
            if (empty($dadosTurma['instrutorId'])) {
                throw new InvalidArgumentException("É necessário fornecer um ID de instrutor para agendar uma turma.");
            }
            
            // 1. Validação da Habilitação do Instrutor
            require_once __DIR__ . '/Instrutor.php';
            $instrutorModel = new Instrutor($this->pdo);

            if (!$instrutorModel->estaHabilitadoParaCurso($dadosTurma['instrutorId'], $dadosTurma['cursoId'])) {
                throw new InvalidArgumentException("O instrutor selecionado (ID: {$dadosTurma['instrutorId']}) não está habilitado para o curso (ID: {$dadosTurma['cursoId']}).");
            }

            $this->pdo->beginTransaction();

            // ID 1 é 'Planejada' na tabela status_turma
            $STATUS_PLANEJADA_ID = 1; 

            $sql_turma = "INSERT INTO turmas
                          (id_cursos, id_instrutores, data_inicio, data_termino, total_alunos, fk_id_turno, fk_id_status, eh_hibrida)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt_turma = $this->pdo->prepare($sql_turma);
            $stmt_turma->execute([
                $dadosTurma['cursoId'], 
                $dadosTurma['instrutorId'], 
                $dadosTurma['dataInicio'], 
                $dadosTurma['dataTermino'], 
                $dadosTurma['totalAlunos'], 
                $dadosTurma['turnoId'],
                $STATUS_PLANEJADA_ID, 
                $dadosTurma['ehHibrida'] ?? 0
            ]);

            $turmaId = $this->pdo->lastInsertId();

            // 2. Inserir Agendamentos (Dias de Aula)
            $sql_agendamento = "INSERT INTO agendamentos (id_turmas, id_salas, data_aula) VALUES (?, ?, ?)";
            $stmt_agendamento = $this->pdo->prepare($sql_agendamento);

            foreach ($diasLetivos as $dataAula) {
                foreach ($salasIds as $salaId) {
                    // Nota: O índice UNIQUE na tabela agendamentos (id_salas, data_aula) garantirá que não haja sobreposição de sala.
                    $stmt_agendamento->execute([$turmaId, $salaId, $dataAula]);
                }
            }

            $this->pdo->commit();
            return $turmaId;

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            // 23000 é o código para violação de chave única. Útil para identificar conflitos.
            if ($e->getCode() == 23000) { 
                 throw new Exception("Erro de Conflito de Agendamento: A sala já está ocupada na data " . $dataAula . " ou a turma já tem aula.");
            }
            throw new Exception("Erro ao agendar nova turma: " . $e->getMessage());
        } catch (InvalidArgumentException $e) {
            $this->pdo->rollBack();
            throw $e; // Propaga exceções de validação de argumento
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
                        t.codigo_turma,
                        t.total_alunos,
                        st.nome_status AS status,
                        tu.nome_turno AS turno,
                        c.nome_curso,
                        s.nome_sala,
                        s.id_salas,
                        a.data_aula
                    FROM agendamentos a
                    JOIN turmas t ON a.id_turmas = t.id_turmas
                    JOIN cursos c ON t.id_cursos = c.id_cursos
                    JOIN salas s ON a.id_salas = s.id_salas
                    JOIN status_turma st ON t.fk_id_status = st.id_status
                    JOIN turno tu ON t.fk_id_turno = tu.id_turno         
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