<?php
require 'Models/Database.php';
try {
    $db = new Database();
    echo "Conexão com o banco de dados BEM-SUCEDIDA!";
} catch (Exception $e) {
    echo "ERRO DE CONEXÃO: " . $e->getMessage();
}