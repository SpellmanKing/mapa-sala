<?php
require_once 'Database.php';

/**
 * Classe CalendarioModel
 * Responsável por gerenciar datas não letivas (feriados e recessos) e o CRUD.
 */
class CalendarioModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Busca todas as datas de feriados e recessos para a listagem.
     */
    public function getAllFeriados() {
        // Junta com tipo_feriado para buscar o nome do tipo.
        $sql = "SELECT fr.*, tf.nome_tipo 
                FROM feriados_recessos fr
                JOIN tipo_feriado tf ON fr.fk_id_tipo_feriado = tf.id_tipo_feriado
                ORDER BY data_feriado";
        return $this->db->fetchAll($sql);
    }

    /**
     * Busca todas as datas de feriados e recessos para uso na calculadora.
     * @return array Um array simples de strings de datas não letivas.
     */
    public function getDatasNaoLetivas() {
        $sql = "SELECT data_feriado FROM feriados_recessos";
        $datas = $this->db->fetchAll($sql);
        // Converte o array de arrays em um array simples para busca rápida
        return array_column($datas, 'data_feriado');
    }
    
    /**
     * Adiciona ou atualiza um feriado/recesso (Simples CRUD).
     */
    public function saveFeriado($data, $descricao, $tipo, $id = null) {
        if ($id) {
            // Atualizar
            $sql = "UPDATE feriados_recessos SET data_feriado = :data, descricao = :descricao, fk_id_tipo_feriado = :tipo WHERE id_feriado = :id";
            $params = ['data' => $data, 'descricao' => $descricao, 'tipo' => $tipo, 'id' => $id];
        } else {
            // Inserir
            $sql = "INSERT INTO feriados_recessos (data_feriado, descricao, fk_id_tipo_feriado) VALUES (:data, :descricao, :tipo)";
            $params = ['data' => $data, 'descricao' => $descricao, 'tipo' => $tipo];
        }
        return $this->db->query($sql, $params);
    }

    /**
     * Deleta um feriado/recesso.
     */
    public function deleteFeriado($id) {
        $sql = "DELETE FROM feriados_recessos WHERE id_feriado = :id";
        return $this->db->query($sql, ['id' => $id]);
    }
}