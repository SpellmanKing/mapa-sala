import { prisma } from '../infrastructure/prismaClient.js';

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

    const dailyHours = Math.max(1, Number(horasPorDia) || 4);
    const classesNeeded = Math.ceil(Number(cargaHoraria) / dailyHours);

    // Normaliza a data de início para YYYY-MM-DD em UTC
    const dateStrOnly = typeof dataInicioInput === 'string' 
      ? (dataInicioInput.split('T')[0] || dataInicioInput)
      : dataInicioInput.toISOString().split('T')[0] || '';
      
    const parts = (dateStrOnly || new Date().toISOString().split('T')[0] || '2026-01-01').split('-');
    const year = Number(parts[0]) || 2026;
    const month = Number(parts[1]) || 1;
    const day = Number(parts[2]) || 1;

    let currentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    let classesScheduled = 0;
    const datasAulas: string[] = [];
    const feriadosPulados: FeriadoInfo[] = [];

    // Limite de segurança para evitar loops infinitos
    let safetyCounter = 0;
    const maxDays = 2000;

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

    const startUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
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
