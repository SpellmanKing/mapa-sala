<?php // SalaModel.php
require_once 'Database.php';

class SalaModel {
    private $db;
    public function __construct() { $this->db = new Database(); }

    public function getTiposSala() {
        $sql = "SELECT idTipo_sala, nome_tipo FROM tipos_sala ORDER BY nome_tipo";
        return $this->db->fetchAll($sql);
    }
    
    public function getSalasPorTipo($idTipo_sala) {
        $sql = "SELECT * FROM salas WHERE idTipo_sala = :idTipo_sala";
        return $this->db->fetchAll($sql, ['idTipo_sala' => $idTipo_sala]);
    }
    
    /**
     * Retorna todas as salas para o Painel Visual
     */
    public function getAllSalas() {
        $sql = "SELECT id_salas, nome_sala, capacidade_maxima, idTipo_sala FROM salas ORDER BY nome_sala";
        return $this->db->fetchAll($sql);
    }
}