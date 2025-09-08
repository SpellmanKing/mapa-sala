<?php

class Sala {
    
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

// Código dentro da classe Sala
public function buscarTodas() {
    try {
        // A consulta agora usa o nome da coluna correto: idTipo_sala
        $stmt = $this->pdo->query("
            SELECT 
                s.id_salas, 
                s.nome_sala, 
                s.capacidade_maxima, 
                ts.nome_tipo AS tipo_sala
            FROM salas s
            JOIN tipos_sala ts ON s.idTipo_sala = ts.idTipo_sala
            ORDER BY s.nome_sala ASC
        ");
        $salas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $salas;
    } catch (PDOException $e) {
        throw new Exception("Erro ao buscar salas: " . $e->getMessage());
    }
}
}