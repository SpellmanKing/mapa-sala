<?php
require_once 'Database.php';
require_once 'CalendarioModel.php'; 

/**
 * Classe TurmaModel
 * Responsável pela lógica de negócio e acesso a dados relacionados às Turmas.
 */
class TurmaModel {
    private $db;
    private $calendarioModel;
    const HORAS_POR_DIA = 4; // Assunção inicial: 4 horas de aula por dia.

    public function __construct() {
        $this->db = new Database();
        $this->calendarioModel = new CalendarioModel(); 
    }

    /**
     * RF02: Calcula a data de término de uma turma, descontando feriados.
     */
    public function calcularDataTermino(int $carga_horaria, string $data_inicio, array $dias_semana) {
        $dias_aula_necessarios = (int)ceil($carga_horaria / self::HORAS_POR_DIA);
        $datas_nao_letivas = $this->calendarioModel->getDatasNaoLetivas();

        $dias_letivos_contados = 0;
        $data_atual = new DateTime($data_inicio);

        while ($dias_letivos_contados < $dias_aula_necessarios) {
            $dia_semana = (int)$data_atual->format('N'); // 1=Segunda, 7=Domingo
            $data_string = $data_atual->format('Y-m-d');
            
            // Verifica se é um dia de aula programado E se NÃO é feriado/recesso
            if (in_array($dia_semana, $dias_semana) && !in_array($data_string, $datas_nao_letivas)) {
                $dias_letivos_contados++;
            }
            
            // Avança para o próximo dia, exceto se já tivermos alcançado o número de dias necessários.
            if ($dias_letivos_contados < $dias_aula_necessarios) {
                $data_atual->modify('+1 day');
            }
        }
        
        // A data_atual já está no último dia letivo, pois o modify('+1 day') só roda se for necessário mais um dia.
        return $data_atual->format('Y-m-d');
    }
    
    /**
     * Busca agendamentos para o Painel Visual.
     */
    public function getAgendamentosParaPainel() {
        $sql = "SELECT 
                    ag.id_agendamento AS id,
                    ag.data_aula AS start,
                    s.id_salas,
                    s.nome_sala AS title,
                    t.id_turmas,
                    t.codigo_turma,
                    c.nome_curso,
                    tr.nome_turno AS turno,
                    s.capacidade_maxima
                FROM agendamentos ag
                JOIN salas s ON ag.id_salas = s.id_salas
                JOIN turmas t ON ag.id_turmas = t.id_turmas
                JOIN cursos c ON t.id_cursos = c.id_cursos
                JOIN turno tr ON t.fk_id_turno = tr.id_turno";
        return $this->db->fetchAll($sql);
    }
    
    // Método para simular o agendamento real da turma (necessário para a rota 'agendarTurma' no Controller)
    public function agendarNovaTurma($id_curso, $id_instrutor, $codigo_turma, $data_inicio, $data_termino, $turno, $total_alunos, $id_sala, $dias_semana_raw) {
        $dias_semana = explode(',', $dias_semana_raw);

        // 1. Encontrar o ID do turno
        $turno_id = $this->db->fetchOne("SELECT id_turno FROM turno WHERE nome_turno = :nome", ['nome' => $turno])['id_turno'] ?? 1; // Padrão: Manhã

        // 2. Inserir a nova turma
        $sql_turma = "INSERT INTO turmas (id_cursos, id_instrutores, codigo_turma, fk_id_status, data_inicio, data_termino, fk_id_turno, total_alunos)
                      VALUES (:curso, :instrutor, :codigo, 1, :inicio, :termino, :turno_id, :alunos)";
        $params_turma = [
            'curso' => $id_curso, 'instrutor' => $id_instrutor, 'codigo' => $codigo_turma, 
            'inicio' => $data_inicio, 'termino' => $data_termino, 'turno_id' => $turno_id, 'alunos' => $total_alunos
        ];
        $this->db->query($sql_turma, $params_turma);
        $id_turma = $this->db->lastInsertId();

        // 3. Gerar e Inserir Agendamentos (simplificado para fins do beta)
        // No sistema completo, precisaria iterar dia a dia como na calculadora
        $datas_agendar = [$data_inicio, $data_termino]; // Apenas as datas inicial e final para o beta
        foreach ($datas_agendar as $data_aula) {
            $sql_agendamento = "INSERT INTO agendamentos (id_turmas, id_salas, data_aula) VALUES (:turma, :sala, :data)";
            $this->db->query($sql_agendamento, ['turma' => $id_turma, 'sala' => $id_sala, 'data' => $data_aula]);
        }
        
        return $id_turma;
    }
}