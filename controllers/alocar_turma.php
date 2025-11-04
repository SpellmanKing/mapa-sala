<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/../models/Conexao.php';
require_once __DIR__ . '/../models/entidades/Sala.php';
require_once __DIR__ . '/../models/entidades/Curso.php';
require_once __DIR__ . '/../models/entidades/Agendamento.php';
require_once __DIR__ . '/../models/entidades/AlocarTurmas.php';
require_once __DIR__ . '/../models/entidades/Feriado.php';
require_once __DIR__ . '/calcular_cronograma.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['cursoId']) || empty($data['totalAlunos']) || empty($data['turno']) || empty($data['diasSemana']) || empty($data['dataInicio'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.']);
    exit;
}

// Função Auxiliar para mapear nome do turno (string) para o ID (INT)
$getTurnoId = function (string $nomeTurno): int {
    $turnos = ['manhã' => 1, 'tarde' => 2, 'noite' => 3, 'integral' => 4, 'vespertino' => 5];
    return $turnos[strtolower($nomeTurno)] ?? 0;
};

try {
    $pdo = Conexao::getInstancia();
    $salaModel = new Sala($pdo);
    $agendamento = new Agendamento($pdo);
    $feriadoModel = new Feriado($pdo);

    // Obter e validar dados de entrada
    $cursoId = (int) $data['cursoId'];
    $totalAlunos = (int) $data['totalAlunos'];
    $dataInicio = $data['dataInicio'];
    $turno = $data['turno'];
    $diasSemana = $data['diasSemana'];

    $turnoId = $getTurnoId($turno);
    if ($turnoId === 0) {
        throw new InvalidArgumentException("Turno inválido.");
    }

    // Obter dados do Curso
    $cursoModel = new Curso($pdo);
    $cursoData = $cursoModel->buscarPorId($cursoId);

    if (!$cursoData) {
        throw new InvalidArgumentException("Curso não encontrado.");
    }

    $tipoSalaNecessaria = (int) $cursoData['id_tipo_sala'];
    $isTEMOuAprendizagem = $cursoData['curso_tem'] == 1; // Flag para lógica híbrida/prioridade

    // Regra de Negócio: Cursos não ministrados na unidade (verificação de tipo de sala vazia)
    if (empty($tipoSalaNecessaria)) {
        http_response_code(200);
        echo json_encode(['success' => false, 'error' => 'Este curso necessita de uma sala ou laboratório específico que não temos no Senac Talal Abu Allan.']);
        exit;
    }

    // Calcula Cronograma
    $feriadosRecessos = $feriadoModel->buscarDatasNaoLetivas($dataInicio, (new DateTime('+1 year'))->format('Y-m-d'));
    $cronograma = calcularCronograma($cursoData['carga_horaria'], $dataInicio, $turno, $diasSemana, $feriadosRecessos);
    $dataTermino = $cronograma['dataTermino'];

    // Busca Salas Livres e Compatíveis (Filtro Inicial)
    $salasDisponiveis = [];
    $todasSalas = $salaModel->buscarTodas(); 

    // Filtra apenas salas compatíveis com o tipo e livres em todos os dias
    foreach ($todasSalas as $s) {
        // Compatibilidade: A sala deve ser do tipo necessário.
        if ($s['idTipo_sala'] != $tipoSalaNecessaria) { 
            continue;
        }

        // Disponibilidade (Sala Livre): Checa todos os dias do cronograma
        $estaLivre = true;
        foreach ($cronograma['diasLetivos'] as $dia) {
            // O Model deve verificar o agendamento apenas pela data (id_salas, data_aula)
            if (!$agendamento->verificarDisponibilidade($s['id_salas'], $dia)) { 
                $estaLivre = false;
                break;
            }
        }
        
        // Se a sala estiver disponível para todos os dias, a adicionamos
        if ($estaLivre) {
            $salasDisponiveis[] = $s;
        }
    }

    // Aplica Algoritmo de Otimização (Melhor Encaixe/Ocupação Máxima)
    $dadosAlocacao = [
        'total_alunos' => $totalAlunos, 
        'tipo_sala_necessaria' => $tipoSalaNecessaria,
        'ehHibrida' => $isTEMOuAprendizagem ? 1 : 0
    ];

    $sugestaoSalas = AlocarTurmas::encontrarMelhorAlocacao($salasDisponiveis, $dadosAlocacao);

    if ($sugestaoSalas) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'salas' => $sugestaoSalas,
            'message' => 'Alocação automática concluída com sucesso. Verifique a sugestão abaixo.',
            'dataInicio' => $dataInicio,
            'dataTermino' => $dataTermino,
            'turnoId' => $turnoId 
        ]);
        exit;
    }

    // Alocação Impossível: Tenta Auditório 
    // Busca Auditório (idTipo_sala = 5)
    $auditório = array_filter($todasSalas, fn($s) => $s['idTipo_sala'] == 5 && $s['capacidade_maxima'] >= $totalAlunos);
    
    if (!empty($auditório)) {
        $sAuditório = reset($auditório); 
        $estaLivre = true;
        
        foreach ($cronograma['diasLetivos'] as $dia) {
            if (!$agendamento->verificarDisponibilidade($sAuditório['id_salas'], $dia)) {
                $estaLivre = false;
                break;
            }
        }

        if ($estaLivre) {
            http_response_code(200);
            echo json_encode([
                'success' => false, // Indica que não é a alocação padrão
                'salas' => [$sAuditório],
                'message' => 'Alocação padrão impossível. Sugestão: Auditório (último recurso).',
                'dataInicio' => $dataInicio,
                'dataTermino' => $dataTermino,
                'turnoId' => $turnoId
            ]);
            exit;
        }
    }

    // Falha Total
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Nenhuma sala livre, compatível ou de último recurso encontrada para o cronograma e regras.']);

} catch (InvalidArgumentException $e) {
    http_response_code(400); 
    echo json_encode(['error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}