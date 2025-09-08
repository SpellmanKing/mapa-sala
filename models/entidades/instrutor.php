<?php

class Instrutor {
    private $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca todos os instrutores do banco de dados.
     * @return array Um array de objetos representando os instrutores.
     */
    public function buscarTodos() {
        try {
            $stmt = $this->pdo->query("SELECT id_instrutores, nome_instrutor FROM instrutores ORDER BY nome_instrutor ASC");
            $instrutores = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $instrutores;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar instrutores: " . $e->getMessage());
        }
    }

    /**
     * Busca o ID do instrutor pelo nome.
     * @param string $nome O nome do instrutor a ser buscado.
     * @return int|null O ID do instrutor ou null se não for encontrado.
     */
    public function buscarIdPorNome($nome) {
        $stmt = $this->pdo->prepare("SELECT id_instrutores FROM instrutores WHERE nome_instrutor = ?");
        $stmt->execute([$nome]);
        $instrutor = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $instrutor ? $instrutor['id_instrutores'] : null;
    }
}