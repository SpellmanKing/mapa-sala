import { prisma } from '../infrastructure/prismaClient.js';

export class CalculadoraService {
  async calcularCronograma(cargaHoraria: number, dataInicio: Date, diasSemana: string[]) {
    // Busca todos os feriados e recessos
    const feriadosDb = await prisma.feriadosRecessos.findMany();
    const feriados = feriadosDb.map(f => f.data_feriado.toISOString().split('T')[0] as string);

    const horasPorDia = 4; // Padrão assumido
    const classesNeeded = Math.ceil(cargaHoraria / horasPorDia);

    let currentDate = new Date(dataInicio);
    let classesScheduled = 0;
    const datasAulas: string[] = [];

    while (classesScheduled < classesNeeded) {
      const currentDateStr = currentDate.toISOString().split('T')[0] as string;
      const dayOfWeek = currentDate.getUTCDay().toString();

      const isFeriado = feriados.includes(currentDateStr);
      const isDiaDeAula = diasSemana.includes(dayOfWeek);

      if (isDiaDeAula && !isFeriado) {
        classesScheduled++;
        datasAulas.push(currentDateStr);
      }

      if (classesScheduled < classesNeeded) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    }

    const start = new Date(dataInicio);
    const diffTime = Math.abs(currentDate.getTime() - start.getTime());
    const diasCorridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      dataTermino: (currentDate.toISOString().split('T')[0] as string),
      diasCorridos,
      totalAulas: classesNeeded,
      datasAulas
    };
  }
}
