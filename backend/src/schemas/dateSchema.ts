import { z } from 'zod';

const validDateOnly = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
  .refine(value => {
    const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }, 'Data inválida');

const dateOnlySchema = validDateOnly.transform(value => new Date(value + 'T12:00:00.000Z'));

export const dateInputSchema = z.union([
  dateOnlySchema,
  z.date().refine(value => !Number.isNaN(value.getTime()), 'Data inválida')
]);

export const calendarDateSchema = z.union([
  validDateOnly.transform(value => new Date(value + 'T00:00:00.000Z')),
  z.date().refine(value => !Number.isNaN(value.getTime()), 'Data inválida')
]);
