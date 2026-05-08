import { getPool } from '../db/mysql.js';
import { cacheGet, cacheSet } from '../cache/redisCache.js';
import { cacheKeys } from '../cache/cacheKeys.js';

export async function getSalas() {
  const cacheKey = cacheKeys.salas();
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

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

  const result = rows.map(r => ({
    id_salas: r.id_salas,
    nome_sala: r.nome_sala,
    capacidade_maxima: r.capacidade_maxima,
    tipo_sala: r.tipo_sala,
    idTipo_sala: r.idTipo_sala
  }));

  // TTL curto para permitir updates via admin sem exigir restart
  await cacheSet(cacheKey, result, Number(process.env.SALAS_CACHE_TTL_SECONDS || 60));

  return result;
}


