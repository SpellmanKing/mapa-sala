<?php
require_once 'Database.php';
require_once 'SalaModel.php';
require_once 'CalendarioModel.php'; 
/**
 * Classe Alocacao
 * Implementa a complexa lógica de Alocação Automática
 */
class Alocacao {
    private $db;
    private $salaModel;
    
    // Regra de Capacidade Padrão
    const CAPACIDADE_PADRAO_PERCENTUAL = 0.8;

    public function __construct() {
        $this->db = new Database();
        $this->salaModel = new SalaModel();
    }

    /**
     * Implementa a lógica principal da Alocação Automática.
     * @param int $id_curso ID do curso.
     * @param string $data_inicio Data de início.
     * @param string $data_termino Data de término (já calculada).
     * @param int $total_alunos Número de alunos na turma.
     * @param array $dias_semana Dias da semana que a turma terá aula (ex: [1, 3, 5] para Seg, Qua, Sex).
     * @return array Sugestões de salas.
    */

    public function buscarSalasAutomaticas($id_curso, $data_inicio, $data_termino, $total_alunos, $dias_semana) {
        
        // 1. Obter Requisitos da Turma
        // Adicionando 'carga_horaria' para completude, embora a alocação use apenas 'idTipo_sala'
        $curso = $this->db->fetchOne("SELECT curso_tem, idTipo_sala, carga_horaria FROM cursos WHERE id_cursos = :id", ['id' => $id_curso]);
        if (!$curso) {
            return ['status' => 'error', 'message' => 'Curso não encontrado.'];
        }
        $tipo_sala_exigido = $curso['idTipo_sala'];
        
        // 2. Buscar Salas Livres e Compatíveis 
        // Simplificação: Buscamos apenas salas que atendam ao Tipo e à Capacidade.
        $salas_compativeis = $this->salaModel->getSalasPorTipo($tipo_sala_exigido);
        $salas_elegiveis = [];

        foreach ($salas_compativeis as $sala) {
            
            // Aplica a Regra de Capacidade Padrão: Ocupação mínima de 80% do necessário.
            $capacidade_minima_necessaria = ceil($total_alunos / self::CAPACIDADE_PADRAO_PERCENTUAL);
            
            if ($sala['capacidade_maxima'] >= $capacidade_minima_necessaria) {
                
                // Calcula o "Melhor Encaixe": menor diferença é melhor.
                $diferenca_capacidade = $sala['capacidade_maxima'] - $total_alunos;

                $sala['diferenca_capacidade'] = $diferenca_capacidade;

                // Adiciona a sala elegível
                $salas_elegiveis[] = $sala;
            }
        }
        
        // 3. Aplica Prioridade e Melhor Encaixe
        // Ordenação: 1. Melhor Encaixe (menor diferença é melhor)
        usort($salas_elegiveis, function($a, $b) {
            return $a['diferenca_capacidade'] <=> $b['diferenca_capacidade'];
        });

        if (!empty($salas_elegiveis)) {
            // A melhor sala é a primeira depois da ordenação
            $sala_sugerida = $salas_elegiveis[0];
            
            return [
                'status' => 'success', 
                'sala_sugerida' => $sala_sugerida,
                'data_alocacao' => $this->gerarDatasAlocacao($data_inicio, $data_termino, $dias_semana),
                'regra_aplicada' => "Melhor Encaixe (Capacidade: {$sala_sugerida['capacidade_maxima']} / Alunos: {$total_alunos}) - RF05"
            ];
        }

        // 4. Uso do Auditório como último recurso
        // Se nenhuma sala específica foi encontrada, mas a turma é grande o suficiente.
        $id_auditório = 5; 
        if ($total_alunos > 35) {
            $auditório = $this->db->fetchOne("SELECT * FROM salas WHERE idTipo_sala = :id_auditorio LIMIT 1", ['id_auditorio' => $id_auditório]);
            if ($auditório && $auditório['capacidade_maxima'] >= $total_alunos) {
                return [
                    'status' => 'success', 
                    'sala_sugerida' => $auditório,
                    'data_alocacao' => $this->gerarDatasAlocacao($data_inicio, $data_termino, $dias_semana),
                    'regra_aplicada' => 'Uso do Auditório (Último Recurso - RF10)'
                ];
            }
        }

        return ['status' => 'error', 'message' => 'Nenhuma sala compatível e livre encontrada para esta turma.'];
    }
    
    /**
     * Função auxiliar para simular a geração de dias de aula.
     */
    private function gerarDatasAlocacao($data_inicio, $data_termino, $dias_semana) {
        $nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        $dias_nomes = array_map(function($dia) use ($nomes) { return $nomes[$dia % 7]; }, $dias_semana);

        return [
            'primeira_aula' => $data_inicio,
            'ultima_aula' => $data_termino,
            'simulacao_dias_aula' => "Aulas nas: " . implode(', ', $dias_nomes)
        ];
    }
}