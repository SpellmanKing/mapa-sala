import { getPool } from '../db/mysql.js';

export async function findAuditFallbackSala({
  todasSalas,
  totalAlunos,
  diasLetivos
}) {
  // PHP fallback: busca salas do tipo 5 (Auditório) com capacidade >= totalAlunos
  const pool = getPool();
  const auditCandidates = todasSalas.filter(
    s => Number(s.idTipo_sala) === 5 && Number(s.capacidade_maxima) >= Number(totalAlunos)
  );

  if (!auditCandidates.length) return null;

  // No PHP usa reset($auditório) => primeira ocorrência
  const auditSala = auditCandidates[0];

  // Verificar disponibilidade: sala precisa estar livre em TODOS os dias
  if (!diasLetivos?.length) return [auditSala];

  // Busca ocupações para aquela sala nos dias do cronograma
  // chunks para não explodir query
  const salaId = auditSala.id_salas;
  const dateChunks = 60;
  const occupied = new Set();

  for (let i = 0; i < diasLetivos.length; i += dateChunks) {
    const chunkDates = diasLetivos.slice(i, i + dateChunks);
    const phDates = chunkDates.map(() => '?').join(',');
    const sql = `SELECT id_salas, data_aula FROM agendamentos
                 WHERE id_salas = ? AND data_aula IN (${phDates})`;
    const [rows] = await pool.query(sql, [salaId, ...chunkDates]);
    for (const r of rows) occupied.add(`${r.id_salas}|${r.data_aula}`);
  }

  let estaLivre = true;
  for (const dia of diasLetivos) {
    if (occupied.has(`${salaId}|${dia}`)) {
      estaLivre = false;
      break;
    }
  }

  return estaLivre ? [auditSala] : null;
}


