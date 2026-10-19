export const HORAS_POR_TURNO: Record<string, number> = {
  'Manhã': 4,
  Tarde: 4,
  Noite: 3
};

export function horasPorTurno(nomeTurno: string): number {
  const horas = HORAS_POR_TURNO[nomeTurno];
  if (horas === undefined) throw new Error(`Turno sem duração configurada: ${nomeTurno}`);
  return horas;
}
