import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Populando Feriados Nacionais e do DF (2025, 2026, 2027) ---');

  const tipoNacional = await prisma.tipoFeriado.upsert({
    where: { nome_tipo: 'Nacional' },
    update: {},
    create: { nome_tipo: 'Nacional' }
  });

  const tipoDistrital = await prisma.tipoFeriado.upsert({
    where: { nome_tipo: 'Distrital' },
    update: {},
    create: { nome_tipo: 'Distrital' }
  });

  const feriadosList = [
    // 2025
    { data_feriado: new Date('2025-01-01T00:00:00.000Z'), descricao: 'Confraternização Universal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-03-04T00:00:00.000Z'), descricao: 'Carnaval', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-04-18T00:00:00.000Z'), descricao: 'Paixão de Cristo', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-04-21T00:00:00.000Z'), descricao: 'Tiradentes / Fundação de Brasília', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-05-01T00:00:00.000Z'), descricao: 'Dia do Trabalho', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-06-19T00:00:00.000Z'), descricao: 'Corpus Christi', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-09-07T00:00:00.000Z'), descricao: 'Independência do Brasil', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-10-12T00:00:00.000Z'), descricao: 'Nossa Senhora Aparecida', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-11-02T00:00:00.000Z'), descricao: 'Finados', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-11-15T00:00:00.000Z'), descricao: 'Proclamação da República', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-11-20T00:00:00.000Z'), descricao: 'Dia Nacional de Zumbi e da Consciência Negra', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-11-30T00:00:00.000Z'), descricao: 'Dia do Evangélico (DF)', fk_id_tipo_feriado: tipoDistrital.id_tipo_feriado },
    { data_feriado: new Date('2025-12-25T00:00:00.000Z'), descricao: 'Natal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },

    // 2026
    { data_feriado: new Date('2026-01-01T00:00:00.000Z'), descricao: 'Confraternização Universal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-02-17T00:00:00.000Z'), descricao: 'Carnaval', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-04-03T00:00:00.000Z'), descricao: 'Paixão de Cristo', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-04-21T00:00:00.000Z'), descricao: 'Tiradentes / Fundação de Brasília', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-05-01T00:00:00.000Z'), descricao: 'Dia do Trabalho', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-06-04T00:00:00.000Z'), descricao: 'Corpus Christi', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-09-07T00:00:00.000Z'), descricao: 'Independência do Brasil', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-10-12T00:00:00.000Z'), descricao: 'Nossa Senhora Aparecida', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-11-02T00:00:00.000Z'), descricao: 'Finados', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-11-15T00:00:00.000Z'), descricao: 'Proclamação da República', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-11-20T00:00:00.000Z'), descricao: 'Dia Nacional de Zumbi e da Consciência Negra', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-11-30T00:00:00.000Z'), descricao: 'Dia do Evangélico (DF)', fk_id_tipo_feriado: tipoDistrital.id_tipo_feriado },
    { data_feriado: new Date('2026-12-25T00:00:00.000Z'), descricao: 'Natal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },

    // 2027
    { data_feriado: new Date('2027-01-01T00:00:00.000Z'), descricao: 'Confraternização Universal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-02-09T00:00:00.000Z'), descricao: 'Carnaval', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-03-26T00:00:00.000Z'), descricao: 'Paixão de Cristo', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-04-21T00:00:00.000Z'), descricao: 'Tiradentes / Fundação de Brasília', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-05-01T00:00:00.000Z'), descricao: 'Dia do Trabalho', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-05-27T00:00:00.000Z'), descricao: 'Corpus Christi', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-09-07T00:00:00.000Z'), descricao: 'Independência do Brasil', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-10-12T00:00:00.000Z'), descricao: 'Nossa Senhora Aparecida', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-11-02T00:00:00.000Z'), descricao: 'Finados', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-11-15T00:00:00.000Z'), descricao: 'Proclamação da República', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-11-20T00:00:00.000Z'), descricao: 'Dia Nacional de Zumbi e da Consciência Negra', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-11-30T00:00:00.000Z'), descricao: 'Dia do Evangélico (DF)', fk_id_tipo_feriado: tipoDistrital.id_tipo_feriado },
    { data_feriado: new Date('2027-12-25T00:00:00.000Z'), descricao: 'Natal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
  ];

  await prisma.feriadosRecessos.createMany({
    data: feriadosList,
    skipDuplicates: true
  });

  const total = await prisma.feriadosRecessos.count();
  console.log(`Sucesso! Total de feriados no banco: ${total}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
