<?php
// api/Entidades/Instrutor.php

class Instrutor {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca o ID de um instrutor pelo seu nome.
     * @param string $nome O nome do instrutor.
     * @return int|null O ID do instrutor ou null se não for encontrado.
     */
    public function buscarIdPorNome($nome) {
        $sql = "SELECT id_instrutores FROM instrutores WHERE nome_instrutor = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$nome]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $resultado ? $resultado['id_instrutores'] : null;
    }
}