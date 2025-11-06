<?php 
require_once 'Database.php';

class InstrutorModel {
    private $db;
    public function __construct() { $this->db = new Database(); }

    /**
     * Busca todos os instrutores para listagem no CRUD.
     */
    public function getAllInstrutores() {
        $sql = "SELECT id_instrutores, nome_instrutor, segmento_principal, habilidades_extras FROM instrutores ORDER BY nome_instrutor";
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Adiciona ou atualiza um instrutor (CRUD).
     * Nota: No sistema final, seria necessário tratar 'habilidades_extras'.
     */
    public function saveInstrutor($nome, $segmento, $id = null) {
        if ($id) {
            // Atualizar
            $sql = "UPDATE instrutores SET nome_instrutor = :nome, segmento_principal = :segmento WHERE id_instrutores = :id";
            $params = ['nome' => $nome, 'segmento' => $segmento, 'id' => $id];
        } else {
            // Inserir
            $sql = "INSERT INTO instrutores (nome_instrutor, segmento_principal) VALUES (:nome, :segmento)";
            $params = ['nome' => $nome, 'segmento' => $segmento];
        }
        return $this->db->query($sql, $params);
    }

    /**
     * Deleta um instrutor (CRUD).
     */
    public function deleteInstrutor($id) {
        // Observação: O FK na tabela 'turmas' está como ON DELETE SET NULL, então a exclusão é segura.
        $sql = "DELETE FROM instrutores WHERE id_instrutores = :id";
        return $this->db->query($sql, ['id' => $id]);
    }
}