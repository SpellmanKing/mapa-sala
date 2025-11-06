<?php
require_once 'TurmaModel.php';

$turmaModel = new TurmaModel();
$turmas = $turmaModel->getAllTurmas();

echo "<pre>";
print_r($turmas); 
echo "</pre>";
?>