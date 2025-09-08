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