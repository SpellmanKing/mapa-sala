import { getPool } from '../db/mysql.js';
import { getFeriadosRecessos } from './feriados_service.js';
import { calcularCronograma } from './cronograma.js';
import { findBestAllocation } from './alocarTurmas_service.js';
import { findAuditFallbackSala } from './audit_fallback_service.js';

const TURNOS_MAP = {
  'manhã': 1,
  'tarde': 2,
  'noite': 3,
  'integral': 4,
  'vespertino': 5
};

async function getCursoById(cursoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT 
      c.carga_horaria,
      ts.idTipo_sala AS id_tipo_sala,
      c.curso_tem
     FROM cursos c
     LEFT JOIN tipos_sala ts ON c.idTipo_sala = ts.idTipo_sala
     WHERE c.id_cursos = ?`,
    [cursoId]
  );
  if (!rows?.length) return null;
  return rows[0];
}

async function buscarTodasSalas() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT 
      s.id_salas,
      s.nome_sala,
      s.capacidade_maxima,
      ts.idTipo_sala,
      ts.nome_tipo AS tipo_sala
     FROM salas s
     JOIN tipos_sala ts ON s.idTipo_sala = ts.idTipo_sala
     ORDER BY s.nome_sala ASC`
  );
  return rows;
}

async function verificarSalasDisponiveisPorDias({ salas, diasLetivos, tipoSalaNecessaria }) {
  // Mantém mesma regra do PHP: sala precisa ser do tipo necessário E estar livre em TODOS os dias.
  const pool = getPool();

  // Pré-carrega ocupação: registros em agendamentos para as salas e dias
  const salaIds = salas
    .filter(s => Number(s.idTipo_sala) === Number(tipoSalaNecessaria))
    .map(s => s.id_salas);

  if (!salaIds.length) return [];

  // Para evitar query gigante, agrupamos por chunks.
  const chunk = 50;
  const occupied = new Set(); // key: `${salaId}|${data}`

  for (let i = 0; i < salaIds.length; i += chunk) {
    const chunkIds = salaIds.slice(i, i + chunk);
    // placeholders para IN
    const placeholders = chunkIds.map(() => '?').join(',');
    const params = [...chunkIds];

    // data_aula IN
    const dateChunks = 60;
    for (let j = 0; j < diasLetivos.length; j += dateChunks) {
      const chunkDates = diasLetivos.slice(j, j + dateChunks);
      const phDates = chunkDates.map(() => '?').join(',');
      const sql = `SELECT id_salas, data_aula FROM agendamentos
                   WHERE id_salas IN (${placeholders})
                   AND data_aula IN (${phDates})`;
      const [rows] = await pool.query(sql, [...chunkIds, ...chunkDates]);
      for (const r of rows) {
        occupied.add(`${r.id_salas}|${r.data_aula}`);
      }
    }
  }

  const disponiveis = [];
  for (const sala of salas) {
    if (Number(sala.idTipo_sala) !== Number(tipoSalaNecessaria)) continue;

    let estaLivre = true;
    for (const dia of diasLetivos) {
      if (occupied.has(`${sala.id_salas}|${dia}`)) {
        estaLivre = false;
        break;
      }
    }
    if (estaLivre) disponiveis.push(sala);
  }

  return disponiveis;
}

export async function handleAlocarTurma(data) {
  // Validação idêntica (chave esperada) ao PHP controller
  const required = ['cursoId', 'totalAlunos', 'turno', 'diasSemana', 'dataInicio'];
  for (const k of required) {
    if (data?.[k] === undefined || data?.[k] === null || data?.[k] === '') {
      return { success: false, error: 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.' };
    }
  }

  const pool = getPool();

  const cursoId = Number(data.cursoId);
  const totalAlunos = Number(data.totalAlunos);
  const turno = data.turno;
  const diasSemana = data.diasSemana;
  const dataInicio = data.dataInicio;

  const turnoId = TURNOS_MAP[String(turno).toLowerCase()] ?? 0;
  if (!turnoId) {
    return { success: false, error: 'Turno inválido.' };
  }

  const curso = await getCursoById(cursoId);
  if (!curso) {
    return { success: false, error: 'Curso não encontrado.' };
  }

  const tipoSalaNecessaria = Number(curso.id_tipo_sala);
  const isTEMOuAprendizagem = Number(curso.curso_tem) === 1;

  if (!tipoSalaNecessaria) {
    return {
      success: false,
      error: 'Este curso necessita de uma sala ou laboratório específico que não temos no Senac Talal Abu Allan.'
    };
  }

  // Calcula Cronograma (portando regra do PHP calcular_cronograma.php)
  const feriadosRecessos = await getFeriadosRecessos(
    dataInicio,
    new Date(new Date(dataInicio + 'T00:00:00').getTime() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );

  // diasLetivos vem como lista de datas 'YYYY-MM-DD'
  const cronograma = calcularCronograma(Number(curso.carga_horaria), dataInicio, turno, diasSemana, feriadosRecessos);
  const dataTermino = cronograma.dataTermino;
  const diasLetivos = cronograma.diasLetivos;

  // Busca salas livres/compatíveis
  const todasSalas = await buscarTodasSalas();
  const salasDisponiveis = await verificarSalasDisponiveisPorDias({
    salas: todasSalas,
    diasLetivos,
    tipoSalaNecessaria
  });

  // Algoritmo (portado) de melhor encaixe/ocupação/divisão
  const dadosAlocacao = {
    total_alunos: totalAlunos,
    tipo_sala_necessaria: tipoSalaNecessaria,
    ehHibrida: isTEMOuAprendizagem ? 1 : 0
  };

  const sugestaoSalas = findBestAllocation(salasDisponiveis, dadosAlocacao);
  if (sugestaoSalas) {
    return {
      success: true,
      salas: sugestaoSalas,
      message: 'Alocação automática concluída com sucesso. Verifique a sugestão abaixo.',
      dataInicio,
      dataTermino,
      turnoId
    };
  }

  // Fallback auditório (último recurso): idTipo_sala = 5 e capacidade >= totalAlunos
  const salasAudit = await findAuditFallbackSala({
    todasSalas,
    totalAlunos,
    cronograma,
    diasLetivos,
    agendamentoCheck: true
  });

  if (salasAudit?.length) {
    return {
      success: false,
      salas: salasAudit,
      message: 'Alocação padrão impossível. Sugestão: Auditório (último recurso).',
      dataInicio,
      dataTermino,
      turnoId
    };
  }

  return {
    success: false,
    error: 'Nenhuma sala livre, compatível ou de último recurso encontrada para o cronograma e regras.'
  };
}


