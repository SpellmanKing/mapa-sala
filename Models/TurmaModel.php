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
     * Calcula a data de término de uma turma, descontando feriados.
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

    public function agendarNovaTurma(
        $id_curso, $id_instrutor, $codigo_turma, $data_inicio, $data_termino, 
        $turno, $total_alunos, $id_sala, $dias_semana_raw
    ) {
        // Validação básica
        if (empty($id_sala) || empty($data_termino)) {
             throw new Exception("Dados de alocação (Sala e Data Término) são obrigatórios para registrar a turma.");
        }
        
        // 1. Encontrar o ID do turno
        $turno_result = $this->db->fetchOne("SELECT id_turno FROM turno WHERE nome_turno = :nome", ['nome' => $turno]);
        $turno_id = $turno_result['id_turno'] ?? 1; // Padrão: Manhã

        // 2. Inserir a nova turma
        // STATUS 1 = Planejada
        $sql_turma = "INSERT INTO turmas (id_cursos, id_instrutores, codigo_turma, fk_id_status, data_inicio, data_termino, fk_id_turno, total_alunos)
                      VALUES (:curso, :instrutor, :codigo, 1, :inicio, :termino, :turno_id, :alunos)";
        $params_turma = [
            'curso' => $id_curso, 'instrutor' => $id_instrutor, 'codigo' => $codigo_turma, 
            'inicio' => $data_inicio, 'termino' => $data_termino, 'turno_id' => $turno_id, 'alunos' => $total_alunos
        ];
        $this->db->query($sql_turma, $params_turma);
        $id_turma = $this->db->lastInsertId();

        // 3. Gerar e Inserir Agendamentos (Lógica Simplificada)
        // **ATENÇÃO:** Esta lógica registra apenas a data de início (e a de término se for diferente) 
        // Você precisará de uma lógica mais complexa para iterar por TODOS os dias de aula.

        $datas_agendar = [$data_inicio]; 
        if ($data_inicio != $data_termino) {
            $datas_agendar[] = $data_termino;
        }

        foreach ($datas_agendar as $data_aula) {
            $sql_alocacao = "INSERT INTO agendamentos (id_turmas, id_salas, data, fk_id_turno) 
                             VALUES (:turma, :sala, :data_aula, :turno_id)";
            $params_alocacao = [
                'turma' => $id_turma, 
                'sala' => $id_sala, 
                'data_aula' => $data_aula,
                'turno_id' => $turno_id
            ];
            $this->db->query($sql_alocacao, $params_alocacao);
        }
        
        return $id_turma;
    }
    
    /**
     * Busca agendamentos para o Painel Visual.
     */
    public function getAgendamentosParaPainel() {
        $sql = "SELECT 
                    a.id_agendamento AS id, 
                    t.codigo_turma, 
                    c.nome_curso, 
                    a.data_aula AS start,           
                    a.data_aula AS end,             
                    a.id_salas, 
                    ts.nome_status, 
                    '#1b7987' AS color, 
                    c.carga_horaria 
                FROM 
                    agendamentos a
                JOIN 
                    turmas t ON a.id_turmas = t.id_turmas
                JOIN 
                    cursos c ON t.id_cursos = c.id_cursos
                JOIN 
                    status_turma ts ON t.fk_id_status = ts.id_status";
        
        return $this->db->fetchAll($sql);
    }
    
    public function getAllTurmas() {
        $sql = "SELECT t.*, c.nome_curso, i.nome_instrutor 
                FROM turmas t
                JOIN cursos c ON t.id_cursos = c.id_cursos
                LEFT JOIN instrutores i ON t.id_instrutores = i.id_instrutores";
        
        return $this->db->fetchAll($sql);
    }
}