import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
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

export interface FeriadoReferenciaItem {
  data: string;
  descricao: string;
  tipo: 'Nacional' | 'Distrital' | 'Recesso Escolar';
}

export const FERIADOS_REFERENCIA: readonly FeriadoReferenciaItem[] = [
  // 2025
  { data: '2025-01-01', descricao: 'Confraternização Universal', tipo: 'Nacional' },
  { data: '2025-03-04', descricao: 'Carnaval', tipo: 'Nacional' },
  { data: '2025-04-18', descricao: 'Paixão de Cristo', tipo: 'Nacional' },
  { data: '2025-04-21', descricao: 'Tiradentes / Fundação de Brasília', tipo: 'Nacional' },
  { data: '2025-05-01', descricao: 'Dia do Trabalho', tipo: 'Nacional' },
  { data: '2025-06-19', descricao: 'Corpus Christi', tipo: 'Nacional' },
  { data: '2025-09-07', descricao: 'Independência do Brasil', tipo: 'Nacional' },
  { data: '2025-10-12', descricao: 'Nossa Senhora Aparecida', tipo: 'Nacional' },
  { data: '2025-11-02', descricao: 'Finados', tipo: 'Nacional' },
  { data: '2025-11-15', descricao: 'Proclamação da República', tipo: 'Nacional' },
  { data: '2025-11-20', descricao: 'Dia Nacional de Zumbi e da Consciência Negra', tipo: 'Nacional' },
  { data: '2025-11-30', descricao: 'Dia do Evangélico (DF)', tipo: 'Distrital' },
  { data: '2025-12-25', descricao: 'Natal', tipo: 'Nacional' },

  // 2026
  { data: '2026-01-01', descricao: 'Confraternização Universal', tipo: 'Nacional' },
  { data: '2026-02-17', descricao: 'Carnaval', tipo: 'Nacional' },
  { data: '2026-04-03', descricao: 'Paixão de Cristo', tipo: 'Nacional' },
  { data: '2026-04-21', descricao: 'Tiradentes / Fundação de Brasília', tipo: 'Nacional' },
  { data: '2026-05-01', descricao: 'Dia do Trabalho', tipo: 'Nacional' },
  { data: '2026-06-04', descricao: 'Corpus Christi', tipo: 'Nacional' },
  { data: '2026-09-07', descricao: 'Independência do Brasil', tipo: 'Nacional' },
  { data: '2026-10-12', descricao: 'Nossa Senhora Aparecida', tipo: 'Nacional' },
  { data: '2026-11-02', descricao: 'Finados', tipo: 'Nacional' },
  { data: '2026-11-15', descricao: 'Proclamação da República', tipo: 'Nacional' },
  { data: '2026-11-20', descricao: 'Dia Nacional de Zumbi e da Consciência Negra', tipo: 'Nacional' },
  { data: '2026-11-30', descricao: 'Dia do Evangélico (DF)', tipo: 'Distrital' },
  { data: '2026-12-25', descricao: 'Natal', tipo: 'Nacional' },

  // 2027
  { data: '2027-01-01', descricao: 'Confraternização Universal', tipo: 'Nacional' },
  { data: '2027-02-09', descricao: 'Carnaval', tipo: 'Nacional' },
  { data: '2027-03-26', descricao: 'Paixão de Cristo', tipo: 'Nacional' },
  { data: '2027-04-21', descricao: 'Tiradentes / Fundação de Brasília', tipo: 'Nacional' },
  { data: '2027-05-01', descricao: 'Dia do Trabalho', tipo: 'Nacional' },
  { data: '2027-05-27', descricao: 'Corpus Christi', tipo: 'Nacional' },
  { data: '2027-09-07', descricao: 'Independência do Brasil', tipo: 'Nacional' },
  { data: '2027-10-12', descricao: 'Nossa Senhora Aparecida', tipo: 'Nacional' },
  { data: '2027-11-02', descricao: 'Finados', tipo: 'Nacional' },
  { data: '2027-11-15', descricao: 'Proclamação da República', tipo: 'Nacional' },
  { data: '2027-11-20', descricao: 'Dia Nacional de Zumbi e da Consciência Negra', tipo: 'Nacional' },
  { data: '2027-11-30', descricao: 'Dia do Evangélico (DF)', tipo: 'Distrital' },
  { data: '2027-12-25', descricao: 'Natal', tipo: 'Nacional' }
];

export const INSTRUTORES_COMPLEMENTARES: ReadonlyArray<{ nome: string; segmento: string }> = [
  { nome: 'Wellerson Pereira do Couto', segmento: 'Tecnologia da Informação' },
  { nome: 'Lucas Augusto Esmeraldo de Oliveira', segmento: 'Gestão' },
  { nome: 'André Luiz Soares Alonso', segmento: 'Gestão' },
  { nome: 'Leandro das Chagas Ferreira', segmento: 'Gestão' },
  { nome: 'Ricardo Pereira Gomes De Araujo', segmento: 'Gestão' },
  { nome: 'Analice Barbosa Santos De Oliveira', segmento: 'Gestão' },
  { nome: 'Carlos Eduardo Alves Munis', segmento: 'Gestão' },
  { nome: 'Ricardo De Souza Serra', segmento: 'Tecnologia da Informação' },
  { nome: 'Vitor Gonçalves', segmento: 'Tecnologia da Informação' },
  { nome: 'Nicole Cândido de Oliveira Andrade', segmento: 'Tecnologia da Informação' },
  { nome: 'Marileia De Jesus Amorim', segmento: 'Gestão' },
  { nome: 'Jose De Assis Custodio', segmento: 'Gestão' },
  { nome: 'Dionisio Francisco Pereira', segmento: 'Gestão' },
  { nome: 'Shirliany Andrade Do Nascimento', segmento: 'Gestão' },
  { nome: 'Flavia Renata Martins', segmento: 'Gestão' },
  { nome: 'Ricardo Da Silva Pierre', segmento: 'Gestão' },
  { nome: 'Guilherme Lima Silva', segmento: 'Tecnologia da Informação' },
  { nome: 'Lucas Dionísio Gomes Lima', segmento: 'Tecnologia da Informação' },
];

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

  for (const f of FERIADOS_REFERENCIA) {
    const d = new Date(`${f.data}T00:00:00.000Z`);
    const fkIdTipo = dbTiposFeriado.get(f.tipo) ?? dbTiposFeriado.get('Nacional')!;
    await prisma.feriadosRecessos.upsert({
      where: { data_feriado: d },
      update: { descricao: f.descricao, fk_id_tipo_feriado: fkIdTipo },
      create: { data_feriado: d, descricao: f.descricao, fk_id_tipo_feriado: fkIdTipo }
    });
  }
  console.log(`✓ ${FERIADOS_REFERENCIA.length} feriados nacionais e distritais garantidos.`);

  // 4. Tipos de Sala
  const tiposSala = [
    'Sala de aula Inovadora',
    'Laboratório de TI',
    'Laboratório Multiuso',
    'Laboratório de Imagem Pessoal',
    'Laboratório de Moda',
    'Auditório',
    'Unidade Escolar Parceira (SEE)',
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

  // 5. Salas (Ceilândia, Recanto das Emas e Unidades Parceiras SEE-DF Exclusivas)
  const salasDefinicoes = [
    // Cep Talal Abu Allan (14 ambientes internos)
    { nome: 'Sala 1', capacidade: 30, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '1º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Sala 2', capacidade: 20, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, mesas móveis em formato trapézio, TV ou projetor, climatização' },
    { nome: 'Sala 3', capacidade: 35, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Sala 4', capacidade: 33, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Sala 5', capacidade: 20, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, mesas móveis em formato trapézio, TV ou projetor, climatização' },
    { nome: 'Sala 6', capacidade: 32, local: 'Cep Talal Abu Allan', tipo: 'Sala de aula Inovadora', recursos: '2º Andar, carteiras universitárias, TV ou projetor, climatização' },
    { nome: 'Laboratório de TI 1', capacidade: 28, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de TI', recursos: 'rack de rede com patch panels, 30 computadores, projetor multimídia' },
    { nome: 'Laboratório de TI 2', capacidade: 32, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de TI', recursos: 'rack de rede com patch panels, 32 lugares, computadores, projetor multimídia' },
    { nome: 'Laboratório de Informática 3', capacidade: 30, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de TI', recursos: '30 computadores, servidor local para testes e virtualização' },
    { nome: 'Produção de Moda', capacidade: 20, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Moda', recursos: 'máquinas de costura domésticas e industriais, mesa de corte grande' },
    { nome: 'Imagem - Cabelos', capacidade: 18, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Imagem Pessoal', recursos: 'cadeiras de cabeleireiro, lavatórios, espelhos grandes' },
    { nome: 'Imagem - Estética e Unhas', capacidade: 16, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Imagem Pessoal', recursos: 'macas reclináveis, cirandinhas e mesas de manicure' },
    { nome: 'Imagem - Maquiagem e Produção', capacidade: 14, local: 'Cep Talal Abu Allan', tipo: 'Laboratório de Imagem Pessoal', recursos: 'cadeiras de maquiagem, espelhos com iluminação camarim' },
    { nome: 'Auditório', capacidade: 70, local: 'Cep Talal Abu Allan', tipo: 'Auditório', recursos: 'Projetor, sistema de som, 70 cadeiras, climatização' },

    // Polo Recanto das Emas (3 ambientes internos)
    { nome: 'Laboratório 1 (Recanto)', capacidade: 30, local: 'Polo Recanto das Emas', tipo: 'Laboratório de TI', recursos: 'computadores, servidor local, projetor multimídia, climatização' },
    { nome: 'Laboratório 2 (Recanto)', capacidade: 30, local: 'Polo Recanto das Emas', tipo: 'Laboratório de TI', recursos: 'computadores, servidor local, projetor multimídia, climatização' },
    { nome: 'Sala Multiuso (Recanto)', capacidade: 16, local: 'Polo Recanto das Emas', tipo: 'Laboratório Multiuso', recursos: 'bancadas para estética, cadeiras de cabeleireiro, lavatório, cirandinha' },

    // Escolas Parceiras SEE-DF Exclusivas (11 ambientes externos dedicados)
    { nome: 'SEE CEM 111 - Sala 1', capacidade: 40, local: 'SEE CEM 111 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 111)' },
    { nome: 'SEE CEM 111 - Sala 2', capacidade: 40, local: 'SEE CEM 111 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 111)' },
    { nome: 'SEE CEM 111 - Sala 3', capacidade: 40, local: 'SEE CEM 111 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 111)' },
    { nome: 'SEE CEM 111 - Sala 4', capacidade: 40, local: 'SEE CEM 111 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 111)' },
    { nome: 'SEE CEM 111 - Sala 5', capacidade: 40, local: 'SEE CEM 111 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 111)' },
    { nome: 'SEE CEM 12 - Sala Exclusiva', capacidade: 40, local: 'SEE CEM 12 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 12)' },
    { nome: 'SEE CED 11 - Sala 1', capacidade: 45, local: 'SEE CED 11 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CED 11)' },
    { nome: 'SEE CED 11 - Sala 2', capacidade: 45, local: 'SEE CED 11 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CED 11)' },
    { nome: 'SEE CED 07 - Sala Exclusiva', capacidade: 40, local: 'SEE CED 07 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CED 07)' },
    { nome: 'SEE CEM 308 - Sala 1', capacidade: 45, local: 'SEE CEM 308 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 308)' },
    { nome: 'SEE CEM 308 - Sala 2', capacidade: 45, local: 'SEE CEM 308 - EXCLUSIVA', tipo: 'Unidade Escolar Parceira (SEE)', recursos: 'Ambiente escolar parceiro SEE-DF (CEM 308)' }
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

  // 6. Instrutores (docs/instrutores_tabela.xlsx + instrutores complementares das turmas ativas)
  const instrutoresFilePath = findDocsFile('instrutores_tabela.xlsx');
  let totalInstrutores = 0;
  if (instrutoresFilePath) {
    try {
      const buf = fs.readFileSync(instrutoresFilePath);
      const wb = xlsx.read(buf, { type: 'buffer' });
      for (const sheetName of wb.SheetNames) {
        const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]!) as any[];
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
      }
      console.log(`✓ Instrutores da planilha instrutores_tabela.xlsx sincronizados (${totalInstrutores} linhas processadas).`);
    } catch (err) {
      console.warn('Aviso: erro ao ler instrutores_tabela.xlsx', err);
    }
  }

  for (const inst of INSTRUTORES_COMPLEMENTARES) {
    await prisma.instrutor.upsert({
      where: { nome_instrutor: inst.nome },
      update: { segmento_principal: inst.segmento },
      create: { nome_instrutor: inst.nome, segmento_principal: inst.segmento }
    });
  }
  console.log(`✓ ${INSTRUTORES_COMPLEMENTARES.length} instrutores titulares garantidos.`);

  // 7. Cursos (docs/portfolio.xlsx)
  const portfolioFilePath = findDocsFile('portfolio.xlsx');
  let totalCursos = 0;
  if (portfolioFilePath) {
    try {
      const buf = fs.readFileSync(portfolioFilePath);
      const wb = xlsx.read(buf, { type: 'buffer' });
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]!]!) as any[];
      for (const row of rows) {
        const nome = String(row['Nome do Curso'] || row.nome_curso || '').trim();
        if (nome) {
          const chParsed = parseInt(String(row['Carga Horaria'] ?? ''), 10);
          const ch = Number.isFinite(chParsed) && chParsed > 0 ? chParsed : 160;
          const valorNum = typeof row.Valor === 'number' ? row.Valor : 0;
          await prisma.curso.upsert({
            where: { nome_curso: nome },
            update: {
              carga_horaria: ch,
              segmento: String(row.Segmento || 'Geral').trim(),
              modalidade: 'Presencial',
            },
            create: {
              nome_curso: nome,
              carga_horaria: ch,
              segmento: String(row.Segmento || 'Geral').trim(),
              modalidade: 'Presencial',
              valor: valorNum,
              bolsa_compativel: String(row['Compativel com Bolsa'] ?? '').toUpperCase().includes('SIM')
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

  // Cursos técnicos e FIC conhecidos do projeto
  const cursosTurmasConhecidas = [
    { nome: 'Técnico em Desenvolvimento de Sistemas (CLDF)', ch: 1200, segmento: 'Tecnologia da Informação', tem: true },
    { nome: 'Técnico em Desenvolvimento de Sistemas', ch: 1200, segmento: 'Tecnologia da Informação', tem: true },
    { nome: 'Técnico em Marketing (CLDF)', ch: 800, segmento: 'Gestão', tem: true },
    { nome: 'Técnico em Marketing', ch: 800, segmento: 'Gestão', tem: true },
    { nome: 'Técnico em Programação de Jogos Digitais (CLDF)', ch: 1000, segmento: 'Tecnologia da Informação', tem: true },
    { nome: 'Técnico em Programação de Jogos Digitais', ch: 1000, segmento: 'Tecnologia da Informação', tem: true },
    { nome: 'Técnico em Administração', ch: 800, segmento: 'Gestão', tem: true },
    { nome: 'Técnico em Secretariado', ch: 800, segmento: 'Gestão', tem: true },
    { nome: 'Técnico em Informática para Internet', ch: 1000, segmento: 'Tecnologia da Informação', tem: true },
    { nome: 'Técnico em Contabilidade', ch: 800, segmento: 'Gestão', tem: false },
    { nome: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos', ch: 1020, segmento: 'Gestão', tem: false },
    { nome: 'Assistente Administrativo', ch: 160, segmento: 'Gestão', tem: false },
    { nome: 'Cabeleireiro', ch: 400, segmento: 'Beleza', tem: false },
    { nome: 'Maquiador', ch: 160, segmento: 'Beleza', tem: false },
    { nome: 'Manicure e Pedicure', ch: 160, segmento: 'Beleza', tem: false },
    { nome: 'Costureiro', ch: 212, segmento: 'Moda', tem: false },
    { nome: 'Modelista', ch: 210, segmento: 'Moda', tem: false },
    { nome: 'Design de Sobrancelhas', ch: 20, segmento: 'Beleza', tem: false },
    { nome: 'Barbeiro', ch: 160, segmento: 'Beleza', tem: false },
    { nome: 'Informática Básica', ch: 60, segmento: 'Tecnologia da Informação', tem: false },
    { nome: 'Excel Básico', ch: 30, segmento: 'Tecnologia da Informação', tem: false },
    { nome: 'Excel Avançado', ch: 30, segmento: 'Tecnologia da Informação', tem: false },
    { nome: 'Penteados', ch: 40, segmento: 'Beleza', tem: false },
    { nome: 'Colorimetria para Cabeleireiros', ch: 60, segmento: 'Beleza', tem: false },
    { nome: 'Alongamento de Cílios', ch: 20, segmento: 'Beleza', tem: false },
    { nome: 'Design de Barba', ch: 20, segmento: 'Beleza', tem: false },
    { nome: 'Power BI', ch: 40, segmento: 'Tecnologia da Informação', tem: false },
    { nome: 'Inteligência Artificial para Negócios', ch: 20, segmento: 'Tecnologia da Informação', tem: false },
    { nome: 'Assistente de Recursos Humanos', ch: 160, segmento: 'Gestão', tem: false },
    { nome: 'Operador de Computador', ch: 196, segmento: 'Tecnologia da Informação', tem: false },
  ];

  for (const c of cursosTurmasConhecidas) {
    await prisma.curso.upsert({
      where: { nome_curso: c.nome },
      update: { carga_horaria: c.ch, segmento: c.segmento, curso_tem: c.tem, modalidade: 'Presencial' },
      create: {
        nome_curso: c.nome,
        carga_horaria: c.ch,
        segmento: c.segmento,
        modalidade: 'Presencial',
        curso_tem: c.tem,
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
