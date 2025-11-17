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
     * */
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
        
        // A data_atual já está no último dia letivo
        return $data_atual->format('Y-m-d');
    }
    
    /**
     * Busca agendamentos para o Painel Visual.
     * */
    public function getAgendamentosParaPainel() {
        $sql = "SELECT 
                    a.id_agendamentos AS id, 
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
                    status_turma ts ON t.id_status = ts.id_status";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Agenda a nova turma e gera os registros de agendamento (dias de aula).
     *
     */
    public function agendarNovaTurma($id_curso, $id_instrutor, $codigo_turma, $data_inicio, $data_termino, $turno, $total_alunos, $id_sala, $dias_semana_raw) {
        
        // Validação básica
        if (empty($id_sala) || empty($data_termino)) {
            throw new Exception("Dados de alocação (Sala e Data Término) são obrigatórios para registrar a turma.");
        }

        // 1. Encontrar o ID do turno
        $turno_id = $this->db->fetchOne("SELECT id_turno FROM turno WHERE nome_turno = :nome", ['nome' => $turno])['id_turno'] ?? 1;
        
        // 2. Inserir a nova turma no cabeçalho (turmas)
        $sql_turma = "INSERT INTO turmas (id_cursos, id_instrutores, codigo_turma, id_status, data_inicio, data_termino, id_turno, total_alunos)
                      VALUES (:curso, :instrutor, :codigo, 1, :inicio, :termino, :turno_id, :alunos)";
        $params_turma = [
            'curso' => $id_curso, 'instrutor' => $id_instrutor, 'codigo' => $codigo_turma, 
            'inicio' => $data_inicio, 'termino' => $data_termino, 'turno_id' => $turno_id, 'alunos' => $total_alunos
        ];
        $this->db->query($sql_turma, $params_turma);
        $id_turma = $this->db->lastInsertId();
        
        // Converte a string de dias da semana em um array de números inteiros
        $dias_semana = array_map('intval', explode(',', $dias_semana_raw));
        
        // Buscar a carga horária do curso
        $cursoData = $this->db->fetchOne("SELECT carga_horaria FROM cursos WHERE id_cursos = :id", ['id' => $id_curso]);
        $carga_horaria = $cursoData['carga_horaria'] ?? 0;
        
        if ($carga_horaria === 0) {
            // Rollback seria ideal aqui, mas vamos apenas lançar a exceção.
            throw new Exception("Carga horária do curso não encontrada. Agendamento interrompido.");
        }
        
        // Recalcular dias necessários e buscar feriados (aqui reutilizamos a lógica da calculadora)
        $dias_aula_necessarios = (int)ceil($carga_horaria / self::HORAS_POR_DIA);
        $datas_nao_letivas = $this->calendarioModel->getDatasNaoLetivas();

        $dias_letivos_contados = 0;
        $data_atual = new DateTime($data_inicio);
        $data_final = new DateTime($data_termino); // Usamos a data de término calculada
        $datas_agendadas = [];

        // Itera até que o número de dias necessários tenha sido atingido E a data atual não ultrapasse a data de término
        while ($dias_letivos_contados < $dias_aula_necessarios) {
            $dia_semana = (int)$data_atual->format('N'); // 1=Segunda, 7=Domingo
            $data_string = $data_atual->format('Y-m-d');
            
            // Condição de Segurança: Se a data atual for maior que a data de término calculada, algo está errado no cálculo.
            if ($data_atual > $data_final) {
                // Se a iteração exceder o limite, algo está errado. Parar e lançar um erro.
                throw new Exception("Erro de cálculo: O número de dias letivos excedeu a data de término calculada. Turma agendada no cabeçalho, mas sem detalhes.");
            }
            
            // Se for um dia de aula programado E não for feriado
            if (in_array($dia_semana, $dias_semana) && !in_array($data_string, $datas_nao_letivas)) {
                $datas_agendadas[] = $data_string;
                $dias_letivos_contados++;
            }
            
            $data_atual->modify('+1 day');
        }
        
        // 4. Inserir todos os dias de aula na tabela agendamentos
        foreach ($datas_agendadas as $data_aula) {
            $sql_alocacao = "INSERT INTO agendamentos (id_turmas, id_salas, data_aula, id_turno) 
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

    public function getAllTurmas() {
        $sql = "SELECT t.*, c.nome_curso, i.nome_instrutor 
                FROM turmas t
                JOIN cursos c ON t.id_cursos = c.id_cursos
                LEFT JOIN instrutores i ON t.id_instrutores = i.id_instrutores";
        
        return $this->db->fetchAll($sql);
    }
}