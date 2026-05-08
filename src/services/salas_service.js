import { getPool } from '../db/mysql.js';

export async function getSalas() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT
      s.id_salas,
      s.nome_sala,
      s.capacidade_maxima,
      ts.nome_tipo AS tipo_sala,
      s.idTipo_sala
    FROM salas s
    JOIN tipos_sala ts ON s.idTipo_sala = ts.idTipo_sala
    ORDER BY s.nome_sala ASC
  `);

  // Para compatibilidade, mantém nomes do PHP onde aplicável.
  return rows.map(r => ({
    id_salas: r.id_salas,
    nome_sala: r.nome_sala,
    capacidade_maxima: r.capacidade_maxima,
    tipo_sala: r.tipo_sala,
    idTipo_sala: r.idTipo_sala
  }));
}

