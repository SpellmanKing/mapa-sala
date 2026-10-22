import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function findDocsFile(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), 'docs', filename),
    path.join(process.cwd(), '../docs', filename),
    path.join(process.cwd(), '..', 'docs', filename),
    path.resolve(__dirname, '../../docs', filename),
    path.resolve(__dirname, '../../../docs', filename),
    path.join('/app/docs', filename),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

export async function seedReferenceData() {
  console.log('--- Carregando Dados de Referência (Idempotente) ---');

  // 1. StatusTurma
  const statusList = [
    'Planejada',
    'Em Andamento',
    'Concluída',
    'Cancelada',
    'Liberado Para Matrícula',
    'Em Elaboração'
  ];
  for (const nome of statusList) {
    await prisma.statusTurma.upsert({
      where: { nome_status: nome },
      update: {},
      create: { nome_status: nome }
    });
  }
  console.log('✓ Status de turma garantidos.');

  // 2. Turnos
  const turnosList = ['Manhã', 'Tarde', 'Noite'];
  for (const nome of turnosList) {
    await prisma.turno.upsert({
      where: { nome_turno: nome },
      update: {},
      create: { nome_turno: nome }
    });
  }
  console.log('✓ Turnos garantidos.');

  // 3. Tipos de Feriado e Feriados Recessos
  const tiposFeriado = ['Nacional', 'Distrital', 'Recesso Escolar'];
  const dbTiposFeriado = new Map<string, number>();
  for (const nome of tiposFeriado) {
    const tf = await prisma.tipoFeriado.upsert({
      where: { nome_tipo: nome },
      update: {},
      create: { nome_tipo: nome }
    });
    dbTiposFeriado.set(nome, tf.id_tipo_feriado);
  }

  const idNacional = dbTiposFeriado.get('Nacional')!;
  const feriadosList = [
    { data: '2025-01-01', descricao: 'Confraternização Universal' },
    { data: '2025-03-04', descricao: 'Carnaval' },
    { data: '2025-04-18', descricao: 'Paixão de Cristo' },
    { data: '2025-04-21', descricao: 'Tiradentes' },
    { data: '2025-05-01', descricao: 'Dia do Trabalho' },
    { data: '2025-09-07', descricao: 'Independência do Brasil' },
    { data: '2025-10-12', descricao: 'Nossa Sr.a Aparecida' },
    { data: '2025-11-02', descricao: 'Finados' },
    { data: '2025-11-15', descricao: 'Proclamação da República' },
    { data: '2025-12-25', descricao: 'Natal' },

    { data: '2026-01-01', descricao: 'Confraternização Universal' },
    { data: '2026-02-17', descricao: 'Carnaval' },
    { data: '2026-04-03', descricao: 'Paixão de Cristo' },
    { data: '2026-04-21', descricao: 'Tiradentes' },
    { data: '2026-05-01', descricao: 'Dia do Trabalho' },
    { data: '2026-09-07', descricao: 'Independência do Brasil' },
    { data: '2026-10-12', descricao: 'Nossa Sr.a Aparecida' },
    { data: '2026-11-02', descricao: 'Finados' },
    { data: '2026-11-15', descricao: 'Proclamação da República' },
    { data: '2026-12-25', descricao: 'Natal' },

    { data: '2027-01-01', descricao: 'Confraternização Universal' },
    { data: '2027-02-09', descricao: 'Carnaval' },
    { data: '2027-03-26', descricao: 'Paixão de Cristo' },
    { data: '2027-04-21', descricao: 'Tiradentes' },
    { data: '2027-05-01', descricao: 'Dia do Trabalho' },
    { data: '2027-09-07', descricao: 'Independência do Brasil' },
    { data: '2027-10-12', descricao: 'Nossa Sr.a Aparecida' },
    { data: '2027-11-02', descricao: 'Finados' },
    { data: '2027-11-15', descricao: 'Proclamação da República' },
    { data: '2027-12-25', descricao: 'Natal' }
  ];

  for (const f of feriadosList) {
    const d = new Date(`${f.data}T00:00:00.000Z`);
    await prisma.feriadosRecessos.upsert({
      where: { data_feriado: d },
      update: { descricao: f.descricao, fk_id_tipo_feriado: idNacional },
      create: { data_feriado: d, descricao: f.descricao, fk_id_tipo_feriado: idNacional }
    });
  }
  console.log('✓ Feriados nacionais garantidos.');

  // 4. Tipos de Sala
  const tiposSala = [
    'Sala de aula Inovadora',
    'Laboratório de TI',
    'Laboratório Multiuso',
    'Laboratório de Imagem Pessoal',
    'Laboratório de Moda',
    'Auditório',
    'Comum'
  ];
  const dbTiposSala = new Map<string, number>();
  for (const nome of tiposSala) {
    const ts = await prisma.tipoSala.upsert({
      where: { nome_tipo: nome },
      update: {},
      create: { nome_tipo: nome }
    });
    dbTiposSala.set(nome, ts.idTipo_sala);
  }
  console.log('✓ Tipos de sala garantidos.');

  // 5. Salas (Ceilândia e Recanto das Emas)
  // Regras estritas:
  // - Recanto das Emas tem apenas: Laboratório 1, Laboratório 2 e Sala Multiuso.
  // - Laboratório de Informática 3 fica no CEP Talal Abu Allan.
  const salasDefinicoes = [
    // Cep Talal Abu Allan
    { nome: 'Sala 1', capacidade: 30, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '1º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Sala 2', capacidade: 20, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, mesas móveis em formato trapézio, TV ou projetor, climatização' },
    { nome: 'Sala 3', capacidade: 35, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Sala 4', capacidade: 33, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Sala 5', capacidade: 20, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, mesas móveis em formato trapézio, TV ou projetor, climatização' },
    { nome: 'Sala 6', capacidade: 32, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Laboratório de TI 1', capacidade: 28, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de TI', recursos: 'rack de rede com patch panels, 30 computadores, projetor multimídia' },
    { nome: 'Laboratório de TI 2', capacidade: 28, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de TI', recursos: 'rack de rede com patch panels, 30 computadores, projetor multimídia' },
    { nome: 'Laboratório de Informática 3', capacidade: 30, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de TI', recursos: '30 computadores, servidor local para testes e virtualização' },
    { nome: 'Produção de Moda', capacidade: 20, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Moda', recursos: 'máquinas de costura domésticas e industriais, mesa de corte grande' },
    { nome: 'Imagem - Cabelos', capacidade: 18, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Imagem Pessoal', recursos: 'cadeiras de cabeleireiro, lavatórios, espelhos grandes' },
    { nome: 'Imagem - Estética e Unhas', capacidade: 16, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Imagem Pessoal', recursos: 'macas reclináveis, cirandinhas e mesas de manicure' },
    { nome: 'Imagem - Maquiagem e Produção', capacidade: 14, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Imagem Pessoal', recursos: 'cadeiras de maquiagem, espelhos com iluminação camarim' },
    { nome: 'Auditório', capacidade: 70, local: 'Cep Talal Abu Allan', tipo: 'Auditório', recursos: 'Projetor, sistema de som, 70 cadeiras, climatização' },

    // Polo Recanto das Emas
    { nome: 'Laboratório 1 (Recanto)', capacidade: 30, local: 'Polo Recanto das Emas', tipo: 'Laboratório de TI', recursos: 'computadores, servidor local, projetor multimídia, climatização' },
    { nome: 'Laboratório 2 (Recanto)', capacidade: 30, local: 'Polo Recanto das Emas', tipo: 'Laboratório de TI', recursos: 'computadores, servidor local, projetor multimídia, climatização' },
    { nome: 'Sala Multiuso (Recanto)', capacidade: 16, local: 'Polo Recanto das Emas', tipo: 'Laboratório Multiuso', recursos: 'bancadas para estética, cadeiras de cabeleireiro, lavatório, cirandinha' }
  ];

  for (const s of salasDefinicoes) {
    const tipoId = dbTiposSala.get(s.tipo) || dbTiposSala.get('Comum')!;
    const salaExistente = await prisma.sala.findFirst({
      where: { nome_sala: s.nome, local: s.local }
    });

    if (salaExistente) {
      await prisma.sala.update({
        where: { id_salas: salaExistente.id_salas },
        data: {
          capacidade_maxima: s.capacidade,
          idTipo_sala: tipoId,
          recursos_especiais: s.recursos
        }
      });
    } else {
      await prisma.sala.create({
        data: {
          nome_sala: s.nome,
          capacidade_maxima: s.capacidade,
          local: s.local,
          idTipo_sala: tipoId,
          recursos_especiais: s.recursos
        }
      });
    }
  }
  console.log(`✓ ${salasDefinicoes.length} salas cadastradas/atualizadas sem duplicatas.`);

  // 6. Instrutores (docs/instrutores_tabela.xlsx)
  const instrutoresFilePath = findDocsFile('instrutores_tabela.xlsx');
  let totalInstrutores = 0;
  if (instrutoresFilePath) {
    try {
      const wb = xlsx.readFile(instrutoresFilePath);
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      for (const row of rows) {
        const nome = String(row.Nome || row.nome || '').trim();
        if (nome) {
          await prisma.instrutor.upsert({
            where: { nome_instrutor: nome },
            update: { segmento_principal: row.Segmento ? String(row.Segmento).trim() : null },
            create: { nome_instrutor: nome, segmento_principal: row.Segmento ? String(row.Segmento).trim() : null }
          });
          totalInstrutores++;
        }
      }
      console.log(`✓ ${totalInstrutores} instrutores carregados a partir de instrutores_tabela.xlsx.`);
    } catch (err) {
      console.warn('Aviso: erro ao ler instrutores_tabela.xlsx', err);
    }
  }

  // 7. Cursos (docs/portfolio.xlsx)
  const portfolioFilePath = findDocsFile('portfolio.xlsx');
  let totalCursos = 0;
  if (portfolioFilePath) {
    try {
      const wb = xlsx.readFile(portfolioFilePath);
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      for (const row of rows) {
        const nome = String(row['Nome do Curso'] || row.nome_curso || '').trim();
        if (nome) {
          const ch = Number(row['Carga Horaria']) || 160;
          const valorNum = typeof row.Valor === 'number' ? row.Valor : 0;
          await prisma.curso.upsert({
            where: { nome_curso: nome },
            update: {
              carga_horaria: ch,
              segmento: String(row.Segmento || 'Geral').trim(),
              modalidade: String(row.Modalidade || 'Presencial').trim(),
            },
            create: {
              nome_curso: nome,
              carga_horaria: ch,
              segmento: String(row.Segmento || 'Geral').trim(),
              modalidade: String(row.Modalidade || 'Presencial').trim(),
              valor: valorNum,
              bolsa_compativel: String(row['Compativel com Bolsa']).toUpperCase().includes('SIM')
            }
          });
          totalCursos++;
        }
      }
      console.log(`✓ ${totalCursos} cursos carregados a partir de portfolio.xlsx.`);
    } catch (err) {
      console.warn('Aviso: erro ao ler portfolio.xlsx', err);
    }
  }

  // Cursos adicionais conhecidos das turmas
  const cursosTurmasConhecidas = [
    { nome: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos', ch: 1020, segmento: 'Gestão' },
    { nome: 'Técnico em Desenvolvimento de Sistemas', ch: 1200, segmento: 'Tecnologia da Informação' },
    { nome: 'Assistente Administrativo', ch: 160, segmento: 'Gestão' },
    { nome: 'Cabeleireiro', ch: 400, segmento: 'Beleza' },
    { nome: 'Maquiador', ch: 160, segmento: 'Beleza' },
    { nome: 'Manicure e Pedicure', ch: 160, segmento: 'Beleza' },
    { nome: 'Costureiro', ch: 212, segmento: 'Moda' },
    { nome: 'Modelista', ch: 210, segmento: 'Moda' },
    { nome: 'Design de Sobrancelhas', ch: 20, segmento: 'Beleza' },
    { nome: 'Barbeiro', ch: 160, segmento: 'Beleza' },
    { nome: 'Informática Básica', ch: 60, segmento: 'Tecnologia da Informação' },
    { nome: 'Excel Básico', ch: 30, segmento: 'Tecnologia da Informação' },
    { nome: 'Excel Avançado', ch: 30, segmento: 'Tecnologia da Informação' },
    { nome: 'Penteados', ch: 40, segmento: 'Beleza' },
    { nome: 'Colorimetria para Cabeleireiros', ch: 60, segmento: 'Beleza' },
    { nome: 'Alongamento de Cílios', ch: 20, segmento: 'Beleza' },
    { nome: 'Design de Barba', ch: 20, segmento: 'Beleza' },
    { nome: 'Power BI', ch: 40, segmento: 'Tecnologia da Informação' },
    { nome: 'Inteligência Artificial para Negócios', ch: 20, segmento: 'Tecnologia da Informação' },
    { nome: 'Assistente de Recursos Humanos', ch: 160, segmento: 'Gestão' },
    { nome: 'Operador de Computador', ch: 196, segmento: 'Tecnologia da Informação' },
  ];

  for (const c of cursosTurmasConhecidas) {
    await prisma.curso.upsert({
      where: { nome_curso: c.nome },
      update: { carga_horaria: c.ch },
      create: {
        nome_curso: c.nome,
        carga_horaria: c.ch,
        segmento: c.segmento,
        modalidade: 'Presencial',
        valor: 0
      }
    });
  }

  console.log('--- Dados de Referência Carregados com Sucesso! ---');
}

// Se executado diretamente
if (process.argv[1]?.includes('seedReferenceData')) {
  seedReferenceData()
    .catch((e) => {
      console.error('Erro ao carregar dados de referência:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
