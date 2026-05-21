import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Inserir StatusTurma
  await prisma.statusTurma.createMany({
    data: [
      { nome_status: 'Planejada' },
      { nome_status: 'Em Andamento' },
      { nome_status: 'Concluída' },
      { nome_status: 'Cancelada' }
    ],
    skipDuplicates: true,
  });

  // Inserir Turnos
  await prisma.turno.createMany({
    data: [
      { nome_turno: 'Manhã' },
      { nome_turno: 'Tarde' },
      { nome_turno: 'Noite' }
    ],
    skipDuplicates: true,
  });

  // TipoFeriado
  const tipoNacional = await prisma.tipoFeriado.create({
    data: { nome_tipo: 'Nacional' }
  });

  // Feriados (Exemplos de 2026 para testar)
  await prisma.feriadosRecessos.createMany({
    data: [
      { data_feriado: new Date('2026-01-01'), descricao: 'Confraternização Universal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-02-17'), descricao: 'Carnaval', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-04-03'), descricao: 'Paixão de Cristo', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-04-21'), descricao: 'Tiradentes', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-05-01'), descricao: 'Dia do Trabalho', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-09-07'), descricao: 'Independência do Brasil', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-10-12'), descricao: 'Nossa Sr.a Aparecida', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-11-02'), descricao: 'Finados', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-11-15'), descricao: 'Proclamação da República', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
      { data_feriado: new Date('2026-12-25'), descricao: 'Natal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    ],
    skipDuplicates: true,
  });

  // Salas
  await prisma.sala.createMany({
    data: [
      { nome_sala: 'S-1', capacidade_maxima: 30, local: 'Bloco A' },
      { nome_sala: 'S-2', capacidade_maxima: 30, local: 'Bloco A' },
      { nome_sala: 'Lab Info 1', capacidade_maxima: 20, local: 'Bloco B' },
    ],
    skipDuplicates: true,
  });

  // Cursos base
  await prisma.curso.createMany({
    data: [
      { nome_curso: 'Técnico em Administração', segmento: 'Gestão', modalidade: 'Presencial', carga_horaria: 800, valor: 0 },
      { nome_curso: 'Lógica de Programação', segmento: 'TI', modalidade: 'Híbrida', carga_horaria: 40, valor: 150 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
