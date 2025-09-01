<?php
// models/entidades/instrutor.php

class Instrutor {
    private $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    // Método para buscar o ID do instrutor pelo nome
    public function buscarIdPorNome($nome) {
        $stmt = $this->pdo->prepare("SELECT id_instrutores FROM instrutores WHERE nome_instrutor = ?");
        $stmt->execute([$nome]);
        $instrutor = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $instrutor ? $instrutor['id_instrutores'] : null;
    }
}