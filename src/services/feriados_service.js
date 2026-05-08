import { getPool } from '../db/mysql.js';

export async function getFeriadosRecessos(dataInicio, dataFim) {
  // Placeholder compatível: buscar todas datas não letivas no range.
  // A transposição completa depende de como o PHP define buscarDatasNaoLetivas.
  const pool = getPool();
  const fim = dataFim || new Date(new Date(dataInicio + 'T00:00:00').getTime() + 365 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const [rows] = await pool.query(
    `SELECT data_nao_letiva as data FROM feriados_recessos WHERE data_nao_letiva BETWEEN ? AND ?`,
    [dataInicio, fim]
  );

  return rows.map(r => r.data);
}

