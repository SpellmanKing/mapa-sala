<?php
// api/Entidades/Sala.php

class Sala {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca todas as salas no banco de dados.
     * @return array Um array de objetos representando as salas.
     */
    public function buscarTodas() {
        try {
            $stmt = $this->pdo->query("SELECT id_salas, nome_sala, capacidade_maxima, tipo_sala FROM salas ORDER BY nome_sala ASC");
            $salas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $salas;
        } catch (PDOException $e) {
            // Em vez de sair, vamos lançar uma exceção que será tratada no controlador principal.
            throw new Exception("Erro ao buscar salas: " . $e->getMessage());
        }
    }
}