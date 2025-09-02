<?php

class Agendamento {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
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

    /**
     * Verifica se uma sala está disponível em uma data e turno específicos.
     * @param int $salaId O ID da sala.
     * @param string $data A data no formato 'YYYY-MM-DD'.
     * @param string $turno O turno ('Manhã', 'Tarde', 'Noite', 'Integral').
     * @return bool Retorna true se a sala estiver disponível, false caso contrário.
     */
    public function verificarDisponibilidade(int $salaId, string $data, string $turno): bool {
        try {
            // Se o turno for 'Integral', ele ocupa todos os outros turnos.
            if ($turno === 'Integral') {
                $sql = "SELECT 1 FROM agendamentos a
                        JOIN turmas t ON a.id_turmas = t.id_turmas
                        WHERE a.id_salas = ? AND a.data_aula = ?
                        LIMIT 1";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$salaId, $data]);
            } else {
                // Para os demais turnos, verifica se a sala já está ocupada por 'Integral' ou pelo mesmo turno.
                $sql = "SELECT 1 FROM agendamentos a
                        JOIN turmas t ON a.id_turmas = t.id_turmas
                        WHERE a.id_salas = ? AND a.data_aula = ? AND (t.turno = ? OR t.turno = 'Integral')
                        LIMIT 1";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$salaId, $data, $turno]);
            }
            
            $agendamentoExistente = $stmt->fetch(PDO::FETCH_ASSOC);
            return $agendamentoExistente === false;
        } catch (PDOException $e) {
            throw new Exception("Erro ao verificar disponibilidade: " . $e->getMessage());
        }
    }
}