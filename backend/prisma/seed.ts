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
    const instrutoresPath = path.join(process.cwd(), '../docs/instrutores_tabela.xlsx');
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
    const novasSalas = [
      { nome_sala: 'Sala Inovadora 1', capacidade_maxima: 30, tipo: 'Sala de aula Inovadora' },
      { nome_sala: 'Sala Inovadora 2', capacidade_maxima: 20, tipo: 'Sala de aula Inovadora' },
      { nome_sala: 'Sala Inovadora 3', capacidade_maxima: 35, tipo: 'Sala de aula Inovadora' },
      { nome_sala: 'Sala Inovadora 4', capacidade_maxima: 33, tipo: 'Sala de aula Inovadora' },
      { nome_sala: 'Sala Inovadora 5', capacidade_maxima: 20, tipo: 'Sala de aula Inovadora' },
      { nome_sala: 'Sala Inovadora 6', capacidade_maxima: 32, tipo: 'Sala de aula Inovadora' },
      
      { nome_sala: 'Laboratório de Informática 1', capacidade_maxima: 28, tipo: 'Laboratório de TI' },
      { nome_sala: 'Laboratório de Informática 2', capacidade_maxima: 28, tipo: 'Laboratório de TI' },
      { nome_sala: 'Laboratório de Informática 3', capacidade_maxima: 33, tipo: 'Laboratório de TI' },
      
      { nome_sala: 'Laboratório de Moda', capacidade_maxima: 20, tipo: 'Laboratório de Moda' },
      
      { nome_sala: 'Laboratório de Imagem Pessoal 1 (Cabelo)', capacidade_maxima: 18, tipo: 'Laboratório de Imagem Pessoal' },
      { nome_sala: 'Laboratório de Imagem Pessoal 2 (Estética e Unhas)', capacidade_maxima: 16, tipo: 'Laboratório de Imagem Pessoal' },
      { nome_sala: 'Laboratório de Imagem Pessoal 3 (Maquiagem e Produção)', capacidade_maxima: 14, tipo: 'Laboratório de Imagem Pessoal' },
      
      { nome_sala: 'Auditório', capacidade_maxima: 70, tipo: 'Auditório' },
      
      { nome_sala: 'Laboratório de Informática 1 (Recanto)', capacidade_maxima: 30, tipo: 'Laboratório de TI' },
      { nome_sala: 'Laboratório de Informática 2 (Recanto)', capacidade_maxima: 30, tipo: 'Laboratório de TI' },
      
      { nome_sala: 'Laboratório Multiuso (Recanto)', capacidade_maxima: 16, tipo: 'Laboratório Multiuso' },
    ];

    for (const row of novasSalas) {
      const tipo = row.tipo || 'Comum';
      let tipoDb = await prisma.tipoSala.findFirst({ where: { nome_tipo: tipo } });
      if (!tipoDb) {
        tipoDb = await prisma.tipoSala.create({ data: { nome_tipo: tipo } });
      }

      await prisma.sala.create({
        data: {
          nome_sala: row.nome_sala,
          capacidade_maxima: row.capacidade_maxima,
          local: row.nome_sala.includes('Recanto') ? 'Polo Recanto das Emas' : 'Cep Talal Abu Allan',
          idTipo_sala: tipoDb.idTipo_sala,
        }
      });
    }
    console.log(`Injetadas ${novasSalas.length} salas com sucesso!`);
  } catch (error) {
    console.warn('Não foi possível injetar as novas salas', error);
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
