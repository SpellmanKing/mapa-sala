<?php
require_once 'Database.php';

class CursoModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getAllCursos() {
        $sql = "SELECT c.*, ts.nome_tipo 
                FROM cursos c
                LEFT JOIN tipos_sala ts ON c.idTipo_sala = ts.idTipo_sala
                ORDER BY c.nome_curso";
        return $this->db->fetchAll($sql);
    }
    
    public function getSegmentos() {
        $sql = "SELECT DISTINCT segmento FROM cursos ORDER BY segmento";
        $results = $this->db->fetchAll($sql);
        return array_column($results, 'segmento');
    }
    
    /**
     * Adiciona ou atualiza um curso (CRUD).
     */
    public function saveCurso($nome, $carga_horaria, $segmento, $idTipo_sala, $id = null) {
        // Usando valores padrão para campos não essenciais no modal beta
        $modalidade = 'Presencial';
        $valor = 1000.00;
        $curso_tem = 0; // 0=FIC/APRENDIZAGEM, 1=TEM (Simplificação)

        if ($id) {
            // Atualizar
            $sql = "UPDATE cursos SET nome_curso = :nome, carga_horaria = :ch, idTipo_sala = :tipo_sala, segmento = :segmento, modalidade = :modalidade, valor = :valor
                    WHERE id_cursos = :id";
            $params = [
                'nome' => $nome, 
                'ch' => $carga_horaria, 
                'tipo_sala' => $idTipo_sala, 
                'segmento' => $segmento,
                'modalidade' => $modalidade,
                'valor' => $valor,
                'id' => $id
            ];
        } else {
            // Inserir
            $sql = "INSERT INTO cursos (nome_curso, carga_horaria, idTipo_sala, segmento, modalidade, valor, curso_tem) 
                    VALUES (:nome, :ch, :tipo_sala, :segmento, :modalidade, :valor, :curso_tem)";
            $params = [
                'nome' => $nome, 
                'ch' => $carga_horaria, 
                'tipo_sala' => $idTipo_sala, 
                'segmento' => $segmento,
                'modalidade' => $modalidade,
                'valor' => $valor,
                'curso_tem' => $curso_tem
            ];
        }
        return $this->db->query($sql, $params);
    }

    /**
     * Deleta um curso (CRUD).
     */
    public function deleteCurso($id) {
        // Segue o comportamento CASCADE do seu BD para turmas associadas (ideal é usar RESTRICT).
        $sql = "DELETE FROM cursos WHERE id_cursos = :id";
        return $this->db->query($sql, ['id' => $id]);
    }
}