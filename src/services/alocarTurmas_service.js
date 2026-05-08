export function findBestAllocation(salasDisponiveis, dadosTurma) {
  // Transposição direta do PHP AlocarTurmas::encontrarMelhorAlocacao (base).
  const totalAlunos = dadosTurma.total_alunos;
  const tipoSalaNecessaria = dadosTurma.tipo_sala_necessaria;

  const OCUPACAO_MINIMA_IDEAL = 0.8;

  const melhorEncaixe = encontrarMelhorEncaixe(salasDisponiveis, totalAlunos, tipoSalaNecessaria);
  if (melhorEncaixe) return [melhorEncaixe];

  const ocupacaoMaxima = encontrarOcupacaoMaxima(salasDisponiveis, totalAlunos, tipoSalaNecessaria);
  if (ocupacaoMaxima) return [ocupacaoMaxima];

  const combinacaoHibrida = encontrarCombinacaoHibrida(salasDisponiveis, totalAlunos, tipoSalaNecessaria);
  if (combinacaoHibrida && dadosTurma.ehHibrida === 1) return combinacaoHibrida;

  return null;
}

function encontrarMelhorEncaixe(salas, totalAlunos, tipoSala) {
  let melhorSala = null;
  let menorDiferenca = Number.MAX_SAFE_INTEGER;

  for (const sala of salas) {
    if (sala.idTipo_sala !== tipoSala && sala.idTipo_sala !== String(tipoSala)) continue;

    if (sala.capacidade_maxima >= totalAlunos) {
      const ocupacaoAtual = totalAlunos / sala.capacidade_maxima;
      if (ocupacaoAtual >= OCUPACAO_MINIMA_IDEAL) {
        const diferenca = sala.capacidade_maxima - totalAlunos;
        if (diferenca < menorDiferenca) {
          menorDiferenca = diferenca;
          melhorSala = sala;
        }
      }
    }
  }

  return melhorSala;
}

function encontrarOcupacaoMaxima(salas, totalAlunos, tipoSala) {
  let melhorSala = null;
  let maiorCapacidade = 0;

  for (const sala of salas) {
    if (Number(sala.idTipo_sala) === Number(tipoSala)) {
      if (sala.capacidade_maxima > maiorCapacidade) {
        maiorCapacidade = sala.capacidade_maxima;
        melhorSala = sala;
      }
    }
  }

  if (melhorSala && maiorCapacidade >= totalAlunos * 0.5) return melhorSala;
  return null;
}

function encontrarCombinacaoHibrida(salas, totalAlunos, tipoSala) {
  let melhorCombinacao = null;
  let menorDiferenca = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < salas.length; i++) {
    for (let j = i + 1; j < salas.length; j++) {
      const sala1 = salas[i];
      const sala2 = salas[j];
      if (Number(sala1.idTipo_sala) !== Number(tipoSala)) continue;
      if (Number(sala2.idTipo_sala) !== Number(tipoSala)) continue;

      const capacidadeCombinada = sala1.capacidade_maxima + sala2.capacidade_maxima;
      const diferenca = capacidadeCombinada - totalAlunos;

      if (capacidadeCombinada >= totalAlunos && diferenca < menorDiferenca) {
        menorDiferenca = diferenca;
        melhorCombinacao = [sala1, sala2];
      }
    }
  }

  return melhorCombinacao;
}

