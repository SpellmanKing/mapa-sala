<?php
class AlocarTurmas {

    // Regra de Negócio: Ocupação mínima ideal de 80% da capacidade da sala
    const OCUPACAO_MINIMA_IDEAL = 0.8;

    public static function encontrarMelhorAlocacao($salasDisponiveis, $dadosTurma) {
        $totalAlunos = $dadosTurma['total_alunos'];
        $tipoSalaNecessaria = $dadosTurma['tipo_sala_necessaria'];

        // Regra 1: Melhor Encaixe (menor diferença entre capacidade e alunos, respeitando a regra de 80%)
        $melhorEncaixe = self::encontrarMelhorEncaixe($salasDisponiveis, $totalAlunos, $tipoSalaNecessaria);
        if ($melhorEncaixe) {
            return [$melhorEncaixe];
        }

        // Regra 2: Ocupação Máxima (melhor uso de salas maiores se "Melhor Encaixe" não for possível)
        // Se a regra de 80% for ignorada, o sistema pode sugerir uma sala maior disponível,
        // mas o algoritmo prioriza o melhor encaixe. Se não achou NADA que se encaixe perfeitamente,
        // o sistema deve buscar a maior sala do tipo, como fallback, para o controller decidir.
        $ocupacaoMaxima = self::encontrarOcupacaoMaxima($salasDisponiveis, $totalAlunos, $tipoSalaNecessaria);
        if ($ocupacaoMaxima) {
            // Se chegou aqui, o controller deve alertar o usuário que a sala sugerida é
            // a melhor opção, mas não atende à regra de 80% (capacidade/alunos).
            return [$ocupacaoMaxima];
        }

        // Regra 3: Divisão entre Salas (Alocação Híbrida)
        // Aplicada se a turma for TEM e a Regra 1 e 2 falharem, conforme a documentação.
        $combinacaoHibrida = self::encontrarCombinacaoHibrida($salasDisponiveis, $totalAlunos, $tipoSalaNecessaria);
        if ($combinacaoHibrida && ($dadosTurma['ehHibrida'] ?? 0) == 1) { // Só aplica se for marcada como Híbrida (TEM/Aprendizagem)
            return $combinacaoHibrida;
        }

        // Regra 4: Auditório (Último recurso)
        // Se todas as regras falharem, o sistema buscará a maior capacidade que não seja do tipo obrigatório.
        // Essa lógica de fallback deve ser implementada no Controller/Service que chama esta classe,
        // buscando salas de "último recurso" como o Auditório.
        
        return null;
    }

    private static function encontrarMelhorEncaixe($salas, $totalAlunos, $tipoSala) {
        $melhorSala = null;
        $menorDiferenca = PHP_INT_MAX;

        foreach ($salas as $sala) {
            // 1. Compatibilidade: Deve ser do tipo de sala necessário
            if ($sala['idTipo_sala'] != $tipoSala) {
                continue;
            }

            // 2. Capacidade Suficiente: A sala deve suportar o número de alunos
            if ($sala['capacidade_maxima'] >= $totalAlunos) {
                // 3. Regra de Otimização (80%): Verifica se a ocupação é de pelo menos 80%
                $ocupacaoAtual = $totalAlunos / $sala['capacidade_maxima'];
                
                // Prioridade: Se a ocupação estiver acima de 80%, o encaixe é ideal
                if ($ocupacaoAtual >= self::OCUPACAO_MINIMA_IDEAL) {
                    $diferenca = $sala['capacidade_maxima'] - $totalAlunos;

                    // 4. Melhor Encaixe: Encontra a menor diferença (o melhor encaixe) dentro das que atendem a 80%
                    if ($diferenca < $menorDiferenca) {
                        $menorDiferenca = $diferenca;
                        $melhorSala = $sala;
                    }
                }
            }
        }
        
        return $melhorSala;
    }

    private static function encontrarOcupacaoMaxima($salas, $totalAlunos, $tipoSala) {
        $melhorSala = null;
        $maiorCapacidade = 0;

        foreach ($salas as $sala) {
            if ($sala['idTipo_sala'] === $tipoSala) {
                if ($sala['capacidade_maxima'] > $maiorCapacidade) {
                    $maiorCapacidade = $sala['capacidade_maxima'];
                    $melhorSala = $sala;
                }
            }
        }
        
        // Mantemos a regra de 50% como um fallback de otimização, como no original.
        // A lógica do controller chamador deve validar se esta sala é aceitável.
        if ($melhorSala && $maiorCapacidade >= ($totalAlunos * 0.5)) {
            return $melhorSala;
        }
        
        return null;
    }
    
    // A lógica de combinação de salas parece estar bem estruturada para a sua regra de negócio.
    private static function encontrarCombinacaoHibrida($salas, $totalAlunos, $tipoSala) {
        $melhorCombinacao = null;
        $menorDiferenca = PHP_INT_MAX;

        // Itera sobre todos os pares de salas para encontrar a melhor combinação
        for ($i = 0; $i < count($salas); $i++) {
            for ($j = $i + 1; $j < count($salas); $j++) {
                $sala1 = $salas[$i];
                $sala2 = $salas[$j];

                if ($sala1['tipo_sala'] === $tipoSala && 
                    $sala2['tipo_sala'] === $tipoSala) {

                    $capacidadeCombinada = $sala1['capacidade_maxima'] + $sala2['capacidade_maxima'];
                    $diferenca = $capacidadeCombinada - $totalAlunos;

                    // Verificamos se a capacidade combinada é suficiente e se a diferença é a menor encontrada até agora
                    if ($capacidadeCombinada >= $totalAlunos && $diferenca < $menorDiferenca) {
                        $menorDiferenca = $diferenca;
                        $melhorCombinacao = [$sala1, $sala2];
                    }
                }
            }
        }
        return $melhorCombinacao;
    }
}