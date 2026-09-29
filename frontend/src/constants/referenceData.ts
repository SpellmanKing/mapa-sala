export const WEEK_DAYS = [
  { id: '1', label: 'Segunda-feira', short: 'Seg' },
  { id: '2', label: 'Terça-feira', short: 'Ter' },
  { id: '3', label: 'Quarta-feira', short: 'Qua' },
  { id: '4', label: 'Quinta-feira', short: 'Qui' },
  { id: '5', label: 'Sexta-feira', short: 'Sex' },
  { id: '6', label: 'Sábado', short: 'Sáb' },
  { id: '0', label: 'Domingo', short: 'Dom' }
] as const;

export const CLASS_DAYS = WEEK_DAYS.filter(day => day.id !== '0');

export const SHIFTS = [
  { id: 1, label: 'Manhã' },
  { id: 2, label: 'Tarde' },
  { id: 3, label: 'Noite' }
] as const;

export function getShiftId(label: string): number {
  const id = SHIFTS.find(shift => shift.label === label)?.id;
  if (!id) throw new Error('Turno inválido');
  return id;
}

// ponytail: não há entidade de unidade; remover o fallback quando a API fornecer o cadastro.
export const REFERENCE_UNITS = [
  'Cep Talal',
  'Polo Recanto',
  'Colégio CED 308',
  'Colégio CEM 111',
  'Colégio CEM 12',
  'Colégio CED 11',
  'Colégio CED 7'
] as const;

export function mergeReferenceValues(
  values: Array<string | null | undefined>,
  fallback: readonly string[] = []
) {
  return [...new Set([...values.filter((value): value is string => Boolean(value)), ...fallback])].sort(
    (a, b) => a.localeCompare(b, 'pt-BR')
  );
}
