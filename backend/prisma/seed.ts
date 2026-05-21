import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import path from 'path';

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
  let tipoNacional = await prisma.tipoFeriado.findFirst({ where: { nome_tipo: 'Nacional' } });
  if (!tipoNacional) {
    tipoNacional = await prisma.tipoFeriado.create({
      data: { nome_tipo: 'Nacional' }
    });
  }

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

  // Tipos de Salas (criar pelo menos um genérico se não tiver)
  let tipoComum = await prisma.tipoSala.findFirst({ where: { nome_tipo: 'Comum' } });
  if (!tipoComum) {
    tipoComum = await prisma.tipoSala.create({ data: { nome_tipo: 'Comum' } });
  }

  // --- LER ARQUIVO DE INSTRUTORES ---
  try {
    const instrutoresPath = path.resolve('../docs/instrutores_tabela.xlsx');
    const workbookInstrutores = xlsx.readFile(instrutoresPath);
    const sheetNameInstrutores = workbookInstrutores.SheetNames[0];
    const dataInstrutores = xlsx.utils.sheet_to_json(workbookInstrutores.Sheets[sheetNameInstrutores]) as any[];

    const instrutoresData = dataInstrutores.map((row) => ({
      nome_instrutor: row.Nome,
      // O banco não tem 'segmento' mapeado diretamente no Instrutor, 
      // precisaria ajustar o schema se quiser salvar. 
      // Por ora, vamos apenas inserir o nome.
    }));

    // Inserir os instrutores um a um usando skipDuplicates ou createMany
    await prisma.instrutor.createMany({
      data: instrutoresData,
      skipDuplicates: true,
    });
    console.log(`Injetados ${instrutoresData.length} instrutores com sucesso!`);
  } catch (error) {
    console.warn('Não foi possível ler/injetar instrutores_tabela.xlsx', error);
  }

  // --- LER ARQUIVO DE SALAS ---
  try {
    const salasPath = path.resolve('../docs/descricao_das_salas_talal.xlsx');
    const workbookSalas = xlsx.readFile(salasPath);
    const sheetNameSalas = workbookSalas.SheetNames[0];
    const dataSalas = xlsx.utils.sheet_to_json(workbookSalas.Sheets[sheetNameSalas]) as any[];

    // Garantir os tipos de sala listados
    for (const row of dataSalas) {
      const tipo = row.Tipo_de_sala || 'Comum';
      let tipoDb = await prisma.tipoSala.findFirst({ where: { nome_tipo: tipo } });
      if (!tipoDb) {
        tipoDb = await prisma.tipoSala.create({ data: { nome_tipo: tipo } });
      }

      await prisma.sala.create({
        data: {
          nome_sala: String(row.Nome_da_sala),
          capacidade_maxima: Number(row.Capacidade_maxima) || 30,
          local: row.Local || 'Desconhecido',
          fk_id_tipo_sala: tipoDb.id_tipo_sala,
        }
      });
    }
    console.log(`Injetadas ${dataSalas.length} salas com sucesso!`);
  } catch (error) {
    console.warn('Não foi possível ler/injetar descricao_das_salas_talal.xlsx', error);
  }

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
