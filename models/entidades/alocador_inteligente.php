<?php

class AlocadorInteligente {

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
            return [$ocupacaoMaxima];
        }

        // Regra 3: Divisão entre Salas (se uma sala única não for possível)
        // A lógica de hibridação precisa de mais regras de negócio, mas o método está no lugar certo.
        return self::encontrarCombinacaoHibrida($salasDisponiveis, $totalAlunos, $tipoSalaNecessaria);
    }

    private static function encontrarMelhorEncaixe($salas, $totalAlunos, $tipoSala) {
        $melhorSala = null;
        $menorDiferenca = PHP_INT_MAX;

        foreach ($salas as $sala) {
            if ($sala['tipo_sala'] === $tipoSala && $sala['capacidade_maxima'] >= $totalAlunos) {
                $diferenca = $sala['capacidade_maxima'] - $totalAlunos;
                if ($diferenca < $menorDiferenca) {
                    $menorDiferenca = $diferenca;
                    $melhorSala = $sala;
                }
            }
        }
        return $melhorSala;
    }

    private static function encontrarOcupacaoMaxima($salas, $totalAlunos, $tipoSala) {
        $melhorSala = null;
        $maiorCapacidade = 0;

        foreach ($salas as $sala) {
            if ($sala['tipo_sala'] === $tipoSala && $sala['capacidade_maxima'] >= $totalAlunos) {
                if ($sala['capacidade_maxima'] > $maiorCapacidade) {
                    $maiorCapacidade = $sala['capacidade_maxima'];
                    $melhorSala = $sala;
                }
            }
        }
        return $melhorSala;
    }

    private static function encontrarCombinacaoHibrida($salas, $totalAlunos, $tipoSala) {
        for ($i = 0; $i < count($salas); $i++) {
            for ($j = $i + 1; $j < count($salas); $j++) {
                $sala1 = $salas[$i];
                $sala2 = $salas[$j];
                if ($sala1['tipo_sala'] === $tipoSala && $sala2['tipo_sala'] === $tipoSala) {
                    $capacidadeCombinada = $sala1['capacidade_maxima'] + $sala2['capacidade_maxima'];
                    if ($capacidadeCombinada >= $totalAlunos) {
                        return [$sala1, $sala2];
                    }
                }
            }
        }
        return null;
    }
}