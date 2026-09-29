import { prisma } from '../infrastructure/prismaClient.js';
import { HttpError } from '../utils/errors.js';

export interface FeriadoInfo {
  data: string;
  descricao: string;
  tipo?: string;
}

export class CalculadoraService {
  async calcularCronograma(
    cargaHoraria: number,
    dataInicioInput: string | Date,
    diasSemana: string[],
    horasPorDia = 4
  ) {
    // Busca todos os feriados e recessos com descrição e tipo
    const feriadosDb = await prisma.feriadosRecessos.findMany({
      include: { tipoFeriado: true }
    });

    const feriadosMap = new Map<string, { descricao: string; tipo?: string }>();
    feriadosDb.forEach(f => {
      const dateStr = f.data_feriado.toISOString().split('T')[0] || '';
      if (dateStr) {
        feriadosMap.set(dateStr, {
          descricao: f.descricao,
          tipo: f.tipoFeriado?.nome_tipo
        });
      }
    });

    const dailyHours = Number(horasPorDia);
    const totalHours = Number(cargaHoraria);
    if (!Number.isFinite(totalHours) || totalHours <= 0) {
      throw new HttpError(400, 'Carga horária deve ser positiva');
    }
    if (!Number.isFinite(dailyHours) || dailyHours <= 0 || dailyHours > 24) {
      throw new HttpError(400, 'Horas por dia deve estar entre 1 e 24');
    }
    if (!Array.isArray(diasSemana) || diasSemana.length === 0 || diasSemana.some(dia => !/^[0-6]$/.test(dia))) {
      throw new HttpError(400, 'Dias da semana inválidos');
    }

    const classesNeeded = Math.ceil(totalHours / dailyHours);

    // Normaliza a data de início para YYYY-MM-DD em UTC
    if (dataInicioInput instanceof Date && Number.isNaN(dataInicioInput.getTime())) {
      throw new HttpError(400, 'Data de início inválida');
    }

    const dateStrOnly = typeof dataInicioInput === 'string'
      ? dataInicioInput.split('T')[0] || ''
      : dataInicioInput.toISOString().split('T')[0] || '';
    const parts = dateStrOnly.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const startUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateStrOnly) ||
      Number.isNaN(startUtc.getTime()) ||
      startUtc.getUTCFullYear() !== year ||
      startUtc.getUTCMonth() !== month - 1 ||
      startUtc.getUTCDate() !== day
    ) {
      throw new HttpError(400, 'Data de início inválida');
    }

    let currentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    let classesScheduled = 0;
    const datasAulas: string[] = [];
    const feriadosPulados: FeriadoInfo[] = [];

    // Limite de segurança para evitar loops infinitos
    let safetyCounter = 0;
    const maxDays = classesNeeded * 7 + feriadosDb.length + 7;

    while (classesScheduled < classesNeeded && safetyCounter < maxDays) {
      safetyCounter++;
      const currentDateStr = currentDate.toISOString().split('T')[0] || '';
      const dayOfWeek = currentDate.getUTCDay().toString();

      const holiday = feriadosMap.get(currentDateStr);
      const isDiaDeAula = diasSemana.includes(dayOfWeek);

      if (isDiaDeAula) {
        if (holiday) {
          feriadosPulados.push({
            data: currentDateStr,
            descricao: holiday.descricao,
            tipo: holiday.tipo
          });
        } else {
          classesScheduled++;
          if (currentDateStr) {
            datasAulas.push(currentDateStr);
          }
        }
      }

      if (classesScheduled < classesNeeded) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    }

    if (classesScheduled < classesNeeded) {
      throw new HttpError(400, 'Não foi possível montar o cronograma com os dias informados');
    }

    const diffTime = Math.abs(currentDate.getTime() - startUtc.getTime());
    const diasCorridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const finalDateStr = currentDate.toISOString().split('T')[0] || '';

    return {
      dataTermino: finalDateStr,
      diasCorridos,
      totalAulas: classesNeeded,
      horasPorAula: dailyHours,
      datasAulas,
      feriadosPulados
    };
  }
}
