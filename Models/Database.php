<?php
// Define as credenciais de acesso ao banco de dados SGST
define('DB_HOST', 'localhost');  // Host do banco de dados (geralmente localhost)
define('DB_NAME', 'sgst_bd');    // Nome do seu banco de dados (o esquema criado no SQL)
define('DB_USER', 'root');       // Seu usuário MySQL (altere se for diferente)
define('DB_PASS', '');           // Sua senha MySQL (altere se for diferente)

/**
 * Classe Database
 * Responsável pela conexão e operações CRUD básicas (Create, Read, Update, Delete)
 * usando PDO e Programação Orientada a Objetos.
 */
class Database {
    // A propriedade PDO guarda o objeto de conexão
    private $pdo;
    
    // Construtor: Inicializa a conexão com o banco de dados
    public function __construct() {
        // Configura a string de conexão (DSN - Data Source Name)
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8";
        
        // Opções de conexão para PDO
        $options = [
            // Lança exceções em caso de erro SQL
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // Define o modo de retorno padrão como ARRAY associativo
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Desativa a emulação de prepared statements para maior segurança
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            // Tenta estabelecer a conexão
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            // Opcional: Feedback de sucesso da conexão
            // echo "Conexão com o banco de dados estabelecida com sucesso!";
        } catch (PDOException $e) {
            // Em caso de falha, exibe o erro e interrompe a execução
            die(json_encode(['status' => 'error', 'message' => 'Erro de Conexão com o BD: ' . $e->getMessage()]));
        }
    }

    /**
     * Método para executar consultas genéricas (SELECT, INSERT, UPDATE, DELETE).
     * @param string $sql A consulta SQL.
     * @param array $params Os parâmetros para o prepared statement (opcional).
     * @return PDOStatement|bool O objeto PDOStatement em caso de sucesso ou FALSE em caso de erro.
     */
    public function query($sql, $params = []) {
        try {
            // Prepara a consulta SQL
            $stmt = $this->pdo->prepare($sql);
            
            // Executa a consulta, passando os parâmetros para a segurança
            $stmt->execute($params);
            
            return $stmt;
        } catch (PDOException $e) {
            throw new Exception("Erro de Consulta: " . $e->getMessage() . " | SQL: " . $sql);
        }
    }

    /**
     * Método para buscar múltiplos resultados (SELECT com vários registros).
     * @param string $sql A consulta SQL.
     * @param array $params Os parâmetros para o prepared statement (opcional).
     * @return array Um array de resultados (vazio se não houver registros).
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetchAll() : [];
    }

    /**
     * Método para buscar um único resultado (SELECT com um único registro ou valor).
     * @param string $sql A consulta SQL.
     * @param array $params Os parâmetros para o prepared statement (opcional).
     * @return array|null Um array associativo com o resultado ou NULL se não encontrado.
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetch() : null;
    }
    
    /**
     * Retorna o ID da última linha inserida.
     * @return string O ID.
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
}