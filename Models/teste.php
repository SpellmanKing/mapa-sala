<?php
require_once 'TurmaModel.php';

$turmaModel = new TurmaModel();
$turmas = $turmaModel->getAgendamentosParaPainel();

echo "<pre>";
print_r($turmas); 
echo "</pre>";