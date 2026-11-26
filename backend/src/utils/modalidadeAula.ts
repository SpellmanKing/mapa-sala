import type { Curso } from '@prisma/client';

type ModalidadeCurso = Pick<Curso, 'modalidade' | 'dias_remotos_padrao'>;

export function ehAulaRemota(curso: ModalidadeCurso | undefined, data: Date): boolean {
  return curso?.modalidade === 'Remoto' ||
    (curso?.dias_remotos_padrao?.split(',').some(dia => dia.trim() === String(data.getUTCDay())) ?? false);
}

export function datasRemotasDoCronograma(curso: ModalidadeCurso, datas: string[]) {
  return new Set(datas.filter(data => ehAulaRemota(curso, new Date(data))));
}
