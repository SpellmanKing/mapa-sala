<?php

// Não precisa de construtor pois a classe só tem métodos estáticos (puros)
class AlocarTurmas {

    public static function encontrarMelhorAlocacao($salasDisponiveis, $dadosTurma) {
        $totalAlunos = $dadosTurma['total_alunos'];
        $tipoSalaNecessaria = $dadosTurma['tipo_sala_necessaria'];

        // Regra 1: Melhor Encaixe (menor diferença entre capacidade e alunos)
        $melhorEncaixe = self::encontrarMelhorEncaixe($salasDisponiveis, $totalAlunos, $tipoSalaNecessaria);
        if ($melhorEncaixe) {
            return [$melhorEncaixe];
        }

        // Regra 2: Ocupação Máxima (melhor uso de salas maiores se "Melhor Encaixe" não for possível)
        $ocupacaoMaxima = self::encontrarOcupacaoMaxima($salasDisponiveis, $totalAlunos, $tipoSalaNecessaria);
        if ($ocupacaoMaxima) {
            // Nota: Este ponto indica que a sala encontrada não atende à capacidade, 
            // mas é a maior disponível do tipo. Isso precisa ser comunicado ao usuário.
            return [$ocupacaoMaxima];
        }

        // Regra 3: Divisão entre Salas (se uma sala única não for possível)
        // A lógica de hibridação precisa de mais regras de negócio, mas o método está no lugar certo.
        $combinacaoHibrida = self::encontrarCombinacaoHibrida($salasDisponiveis, $totalAlunos, $tipoSalaNecessaria);
        if ($combinacaoHibrida) {
             return $combinacaoHibrida;
        }

        return null;
    }

    private static function encontrarMelhorEncaixe($salas, $totalAlunos, $tipoSala) {
        $melhorSala = null;
        $menorDiferenca = PHP_INT_MAX;

        foreach ($salas as $sala) {
            // Verifica se a sala é do tipo correto e tem capacidade suficiente
            if ($sala['tipo_sala'] === $tipoSala && $sala['capacidade_maxima'] >= $totalAlunos) {
                $diferenca = $sala['capacidade_maxima'] - $totalAlunos;
                
                // Se a diferença for menor, ou se for a mesma diferença mas o ID for menor (desempate arbitrário)
                if ($diferenca < $menorDiferenca) {
                    $menorDiferenca = $diferenca;
                    $melhorSala = $sala;
                }
            }
        }
        return $melhorSala;
    }

    private static function encontrarOcupacaoMaxima($salas, $totalAlunos, $tipoSala) {
        $maiorCapacidade = 0;
        $melhorSala = null;

        foreach ($salas as $sala) {
            // Verifica se é do tipo correto
            if ($sala['tipo_sala'] === $tipoSala) {
                // Considera a sala que acomoda a maior quantidade de alunos, mesmo que não cubra o total.
                if ($sala['capacidade_maxima'] > $maiorCapacidade) {
                    $maiorCapacidade = $sala['capacidade_maxima'];
                    $melhorSala = $sala;
                }
            }
        }
        // Retorna apenas se a maior capacidade for no mínimo 50% dos alunos, como na lógica do controller chamador
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