<?php
// api/Conexao.php

class Conexao {
    // A propriedade estática para armazenar a única instância PDO
    private static $pdo;

    // Construtor privado para evitar que a classe seja instanciada
    private function __construct() {}

    /**
     * Retorna a única instância da conexão com o banco de dados.
     * Se a instância ainda não existir, ela será criada.
     * * @return PDO A instância do objeto PDO.
     */
    public static function getInstancia() {
        if (self::$pdo === null) {
            $db_host = 'localhost';
            $db_user = 'root'; 
            $db_pass = '';    
            $db_name = 'sgst_bd';

            try {
                self::$pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
                self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (PDOException $e) {
                http_response_code(500); 
                echo json_encode(['error' => 'Erro ao conectar ao banco de dados.']);
                exit;
            }
        }
        return self::$pdo;
    }
}