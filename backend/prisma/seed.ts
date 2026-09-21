import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

// Lista das 61 turmas das imagens
const turmasFinais = [
  // --- CEILÂNDIA ---
  {
    codigo_turma: '2025.09.57',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2025-03-17',
    carga_horaria: 1300,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Shirleny Andrade do Nascimento',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.114',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2025-06-16',
    carga_horaria: 1300,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Shirleny Andrade do Nascimento',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.123',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2025-09-16',
    carga_horaria: 1020,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Ricardo da Silva Pierre',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.126',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2025-10-27',
    carga_horaria: 1020,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Dionísio Francisco Pereira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.129',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2025-10-27',
    carga_horaria: 1020,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'ROSIVANE MACHADO CAVALCANTE MONTEIRO',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.130',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2025-10-14',
    carga_horaria: 1020,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'KEDNA MEDEIROS LORRANCE DOMENICIO',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.73',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2026-02-23',
    carga_horaria: 1020,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Lucas Augusto Esmeraldo de Oliveira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.78',
    nome_curso: 'Aprendizagem Profissional de Qualificação em Serviços Administrativos',
    data_inicio: '2026-02-23',
    carga_horaria: 1020,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'RICARDO PEREIRA GOMES DE ARAÚJO',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.4',
    nome_curso: 'Assistente Administrativo',
    data_inicio: '2026-06-01',
    carga_horaria: 160,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Adailton Rodrigues Duarte',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.108',
    nome_curso: 'Assistente de Tecnologias da Informação',
    data_inicio: '2026-08-03',
    carga_horaria: 200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Rildo Goncalves',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.88',
    nome_curso: 'Barbeiro',
    data_inicio: '2026-08-10',
    carga_horaria: 172,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Thiago de Sousa Costa',
    estado: 'Liberado Para Matrícula',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.10',
    nome_curso: 'Cabeleireiro',
    data_inicio: '2026-05-18',
    carga_horaria: 400,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Rubia Martins de Melo',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.37',
    nome_curso: 'Colorimetria para Maquiadores',
    data_inicio: '2026-09-08',
    carga_horaria: 40,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Raquel Angel dos Santos Costa',
    estado: 'Liberado Para Matrícula',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.13',
    nome_curso: 'Costureiro',
    data_inicio: '2026-06-15',
    carga_horaria: 212,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Bianca Mendes da Silva',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.38',
    nome_curso: 'Costureiro',
    data_inicio: '2026-09-08',
    carga_horaria: 212,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Suely de Fátima Pereira',
    estado: 'Liberado Para Matrícula',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.117',
    nome_curso: 'Extensão de Cílios Fio a Fio',
    data_inicio: '2026-08-10',
    carga_horaria: 20,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '13:00 às 17:00',
    instrutor: '',
    estado: 'Em Elaboração',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.82',
    nome_curso: 'Informática Windows e Office Fundamental',
    data_inicio: '2026-06-01',
    carga_horaria: 100,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Rildo Goncalves',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.52',
    nome_curso: 'Manicure e Pedicure',
    data_inicio: '2026-05-11',
    carga_horaria: 160,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'LUZIA PEREIRA DE ANDRADE',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.85',
    nome_curso: 'Manicure e Pedicure',
    data_inicio: '2026-10-05',
    carga_horaria: 160,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'LUZIA PEREIRA DE ANDRADE',
    estado: 'Liberado Para Matrícula',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.30',
    nome_curso: 'Maquiador',
    data_inicio: '2026-08-03',
    carga_horaria: 160,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Raquel Angel dos Santos Costa',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.112',
    nome_curso: 'Maquiagem Profissional Avançada',
    data_inicio: '2026-08-03',
    carga_horaria: 60,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Raquel Angel dos Santos Costa',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.102',
    nome_curso: 'Microsoft Power BI - Básico',
    data_inicio: '2026-06-03',
    carga_horaria: 20,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Alessandro Alves de Vasconcelos',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.25',
    nome_curso: 'Modelista',
    data_inicio: '2026-06-01',
    carga_horaria: 210,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Bianca Mendes da Silva',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.103',
    nome_curso: 'Office 365 com Inteligência Artificial',
    data_inicio: '2026-08-03',
    carga_horaria: 60,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Rildo Goncalves',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.105',
    nome_curso: 'Técnicas Básicas de Maquiagem',
    data_inicio: '2026-08-03',
    carga_horaria: 80,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: '',
    estado: 'Liberado Para Matrícula',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.53',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2025-03-10',
    carga_horaria: 800,
    dias_semana: ['2', '3', '4'],
    horario: '13:15 às 17:15',
    instrutor: 'Andre Luiz Soares Alonso',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.54',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2025-03-10',
    carga_horaria: 800,
    dias_semana: ['2', '4', '6'],
    horario: '13:15 às 17:15',
    instrutor: 'Leandro das Chagas Ferreira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.55',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2025-03-11',
    carga_horaria: 800,
    dias_semana: ['2', '4', '6'],
    horario: '14:00 às 18:00',
    instrutor: 'Analice Barbosa Santos de Oliveira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.34',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-02',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'José Chaves dos Santos',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.69',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-02-25',
    carga_horaria: 800,
    dias_semana: ['1', '3', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Mariléia de Jesus Amorim',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.71',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-02-26',
    carga_horaria: 800,
    dias_semana: ['2', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'José de Assis Custódio',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.77',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-02-25',
    carga_horaria: 800,
    dias_semana: ['1', '3', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Dionísio Francisco Pereira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.78',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-10',
    carga_horaria: 800,
    dias_semana: ['2', '4', '6'],
    horario: '14:00 às 18:00',
    instrutor: 'Shirleny Andrade do Nascimento',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.80',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-11',
    carga_horaria: 800,
    dias_semana: ['1', '3', '6'],
    horario: '14:00 às 18:00',
    instrutor: 'José de Assis Custódio',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.83',
    nome_curso: 'Técnico em Contabilidade',
    data_inicio: '2025-07-14',
    carga_horaria: 800,
    dias_semana: ['1', '3', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'José de Assis Custódio',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.119',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2025-03-10',
    carga_horaria: 1200,
    dias_semana: ['1', '2', '3', '4'],
    horario: '14:00 às 18:00',
    instrutor: 'Wellerson Pereira do Couto',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.55',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2026-03-02',
    carga_horaria: 1200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Lucas Dionísio Gomes Lima',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.58',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2026-02-25',
    carga_horaria: 1200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Ricardo de Souza Serra',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.59',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2026-03-03',
    carga_horaria: 1200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Diego Lohan da Motta Silva',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.79',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2026-03-09',
    carga_horaria: 1200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Wellerson Pereira do Couto',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.75',
    nome_curso: 'Técnico em Informática para Internet',
    data_inicio: '2026-02-25',
    carga_horaria: 1000,
    dias_semana: ['1', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Ricardo de Souza Serra',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.121',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2025-03-10',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Lucas Augusto Esmeraldo de Oliveira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.56',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2026-02-25',
    carga_horaria: 800,
    dias_semana: ['1', '3', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Carlos Eduardo Alves Munis',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.65',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2026-02-26',
    carga_horaria: 800,
    dias_semana: ['2', '4', '6'],
    horario: '08:00 às 12:00',
    instrutor: 'Lucas Augusto Esmeraldo de Oliveira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.67',
    nome_curso: 'Técnico em Programação de Jogos Digitais',
    data_inicio: '2026-02-25',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4'],
    horario: '08:00 às 12:00',
    instrutor: 'Nicole Cândido de Oliveira Andrade',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.106',
    nome_curso: 'Técnico em Secretaria Escolar',
    data_inicio: '2026-06-03',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: '',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.55',
    nome_curso: 'Técnico em Secretariado',
    data_inicio: '2025-03-10',
    carga_horaria: 800,
    dias_semana: ['2', '4', '5'],
    horario: '13:15 às 17:15',
    instrutor: 'RICARDO PEREIRA GOMES DE ARAÚJO',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.107',
    nome_curso: 'Técnico em Secretariado',
    data_inicio: '2026-08-03',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: '',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },

  // --- RECANTO ---
  {
    codigo_turma: '2026.29.18',
    nome_curso: 'Assistente Administrativo',
    data_inicio: '2026-10-05',
    carga_horaria: 160,
    dias_semana: ['1', '3', '5'],
    horario: '14:00 às 18:00',
    instrutor: '',
    estado: 'Liberado Para Matrícula',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.15',
    nome_curso: 'Assistente de Tecnologias da Informação',
    data_inicio: '2026-10-05',
    carga_horaria: 200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Cleiton Pereira Sousa',
    estado: 'Liberado Para Matrícula',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.1',
    nome_curso: 'Cabeleireiro',
    data_inicio: '2026-03-16',
    carga_horaria: 400,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Maria Edinalda Pinheiro da Silva',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.17',
    nome_curso: 'Informática Windows e Office Fundamental',
    data_inicio: '2026-07-06',
    carga_horaria: 100,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Cleiton Pereira Sousa',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.16',
    nome_curso: 'Office 365 com Inteligência Artificial',
    data_inicio: '2026-09-01',
    carga_horaria: 60,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Cleiton Pereira Sousa',
    estado: 'Liberado Para Matrícula',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.7',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-02-25',
    carga_horaria: 800,
    dias_semana: ['1', '3', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Flavia Renata Martins',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.10',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-02-25',
    carga_horaria: 800,
    dias_semana: ['1', '3', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Flavia Renata Martins',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.11',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-02-25',
    carga_horaria: 800,
    dias_semana: ['2', '3', '4'],
    horario: '14:00 às 18:00',
    instrutor: 'Ricardo da Silva Pierre',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.14',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-10',
    carga_horaria: 800,
    dias_semana: ['2', '4', '6'],
    horario: '14:00 às 18:00',
    instrutor: 'José Chaves dos Santos',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.5',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2026-02-25',
    carga_horaria: 1200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Guilherme Lima Silva',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.12',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2026-02-26',
    carga_horaria: 800,
    dias_semana: ['2', '4', '6'],
    horario: '14:00 às 18:00',
    instrutor: 'Flavia Renata Martins',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.13',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2026-02-26',
    carga_horaria: 800,
    dias_semana: ['2', '4', '6'],
    horario: '14:00 às 18:00',
    instrutor: 'Carlos Eduardo Alves Munis',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.9',
    nome_curso: 'Técnico em Programação de Jogos Digitais',
    data_inicio: '2026-02-25',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4'],
    horario: '14:00 às 18:00',
    instrutor: 'Nicole Cândido de Oliveira Andrade',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  }
];

// Helper para calcular o cronograma de aulas de forma limpa
async function calcularCronograma(cargaHoraria: number, dataInicio: Date, diasSemana: string[], feriados: string[]) {
  const horasPorDia = 4;
  const classesNeeded = Math.ceil(cargaHoraria / horasPorDia);

  let currentDate = new Date(dataInicio);
  let classesScheduled = 0;
  const datasAulas: string[] = [];

  while (classesScheduled < classesNeeded) {
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getUTCDay().toString(); // Domingo=0, Segunda=1, etc.

    const isFeriado = feriados.includes(currentDateStr);
    const isDiaDeAula = diasSemana.includes(dayOfWeek);

    if (isDiaDeAula && !isFeriado) {
      classesScheduled++;
      datasAulas.push(currentDateStr);
    }

    if (classesScheduled < classesNeeded) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  }

  return {
    dataTermino: currentDate,
    datasAulas
  };
}

// Helper para classificar salas candidatas adequadas para cada turma
function obterSalasCandidatas(salas: any[], nomeCurso: string, local: string) {
  const localFilter = local.toLowerCase().includes('recanto') ? 'Polo Recanto das Emas' : 'Cep Talal Abu Allan';
  const salasUnidade = salas.filter(s => s.local === localFilter);
  const nc = nomeCurso.toLowerCase();

  if (localFilter === 'Polo Recanto das Emas') {
    // Recanto has: Laboratório 1 (Recanto), Laboratório 2 (Recanto), Sala Multiuso (Recanto)
    if (nc.includes('desenvolvimento') || nc.includes('jogos') || nc.includes('tecnologia') || nc.includes('informática') || nc.includes('windows') || nc.includes('office') || nc.includes('ia')) {
      return salasUnidade.filter(s => s.nome_sala.toLowerCase().includes('laboratório') || s.nome_sala.toLowerCase().includes('lab'));
    }
    return salasUnidade.filter(s => s.nome_sala.toLowerCase().includes('multiuso') || s.nome_sala.toLowerCase().includes('sala'));
  }

  // Ceilândia
  if (nc.includes('estética') || nc.includes('unhas') || nc.includes('maquiagem') || nc.includes('cabelo') || nc.includes('cabeleireiro') || nc.includes('maquiador') || nc.includes('barbeiro') || nc.includes('colorimetria') || nc.includes('cílios')) {
    return salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Laboratório de Imagem Pessoal');
  }
  if (nc.includes('costureiro') || nc.includes('modelista') || nc.includes('moda')) {
    return salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Laboratório de Moda');
  }
  if (nc.includes('desenvolvimento') || nc.includes('jogos') || nc.includes('tecnologia') || nc.includes('informática') || nc.includes('windows') || nc.includes('office') || nc.includes('power bi') || nc.includes('ia')) {
    return salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Laboratório de TI');
  }

  // Common classrooms
  return salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Sala de aula Inovadora' || s.tipoSala?.nome_tipo === 'Auditório');
}

async function main() {
  console.log('=== Iniciando Seed do Banco de Dados com Turmas Finais ===');

  console.log('Limpando tabelas existentes em ordem...');
  await prisma.agendamento.deleteMany({});
  await prisma.turma.deleteMany({});
  await prisma.instrutoresCurso.deleteMany({});
  await prisma.sala.deleteMany({});
  await prisma.curso.deleteMany({});
  await prisma.instrutor.deleteMany({});
  await prisma.statusTurma.deleteMany({});
  await prisma.turno.deleteMany({});
  await prisma.feriadosRecessos.deleteMany({});
  await prisma.tipoFeriado.deleteMany({});
  await prisma.tipoSala.deleteMany({});
  console.log('Tabelas limpas com sucesso!');

  // 1. StatusTurma
  await prisma.statusTurma.createMany({
    data: [
      { nome_status: 'Planejada' },
      { nome_status: 'Em Andamento' },
      { nome_status: 'Concluída' },
      { nome_status: 'Cancelada' },
      { nome_status: 'Liberado Para Matrícula' },
      { nome_status: 'Em Elaboração' }
    ],
    skipDuplicates: true,
  });

  // 2. Turnos
  await prisma.turno.createMany({
    data: [
      { nome_turno: 'Manhã' },
      { nome_turno: 'Tarde' },
      { nome_turno: 'Noite' }
    ],
    skipDuplicates: true,
  });

  // 3. Feriados
  let tipoNacional = await prisma.tipoFeriado.upsert({
    where: { nome_tipo: 'Nacional' },
    update: {},
    create: { nome_tipo: 'Nacional' }
  });

  const feriadosList = [
    { data_feriado: new Date('2025-01-01T00:00:00.000Z'), descricao: 'Confraternização Universal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-03-04T00:00:00.000Z'), descricao: 'Carnaval', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-04-18T00:00:00.000Z'), descricao: 'Paixão de Cristo', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-04-21T00:00:00.000Z'), descricao: 'Tiradentes', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-05-01T00:00:00.000Z'), descricao: 'Dia do Trabalho', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-09-07T00:00:00.000Z'), descricao: 'Independência do Brasil', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-10-12T00:00:00.000Z'), descricao: 'Nossa Sr.a Aparecida', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-11-02T00:00:00.000Z'), descricao: 'Finados', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-11-15T00:00:00.000Z'), descricao: 'Proclamação da República', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2025-12-25T00:00:00.000Z'), descricao: 'Natal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    
    { data_feriado: new Date('2026-01-01T00:00:00.000Z'), descricao: 'Confraternização Universal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-02-17T00:00:00.000Z'), descricao: 'Carnaval', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-04-03T00:00:00.000Z'), descricao: 'Paixão de Cristo', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-04-21T00:00:00.000Z'), descricao: 'Tiradentes', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-05-01T00:00:00.000Z'), descricao: 'Dia do Trabalho', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-09-07T00:00:00.000Z'), descricao: 'Independência do Brasil', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-10-12T00:00:00.000Z'), descricao: 'Nossa Sr.a Aparecida', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-11-02T00:00:00.000Z'), descricao: 'Finados', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-11-15T00:00:00.000Z'), descricao: 'Proclamação da República', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2026-12-25T00:00:00.000Z'), descricao: 'Natal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },

    { data_feriado: new Date('2027-01-01T00:00:00.000Z'), descricao: 'Confraternização Universal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-02-09T00:00:00.000Z'), descricao: 'Carnaval', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-03-26T00:00:00.000Z'), descricao: 'Paixão de Cristo', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-04-21T00:00:00.000Z'), descricao: 'Tiradentes', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-05-01T00:00:00.000Z'), descricao: 'Dia do Trabalho', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-09-07T00:00:00.000Z'), descricao: 'Independência do Brasil', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-10-12T00:00:00.000Z'), descricao: 'Nossa Sr.a Aparecida', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-11-02T00:00:00.000Z'), descricao: 'Finados', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-11-15T00:00:00.000Z'), descricao: 'Proclamação da República', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
    { data_feriado: new Date('2027-12-25T00:00:00.000Z'), descricao: 'Natal', fk_id_tipo_feriado: tipoNacional.id_tipo_feriado },
  ];

  await prisma.feriadosRecessos.createMany({
    data: feriadosList,
    skipDuplicates: true
  });
  console.log(`Injetados ${feriadosList.length} feriados com sucesso!`);

  // Lista dos feriados em string para a calculadora
  const feriadosStrings = feriadosList.map(f => f.data_feriado.toISOString().split('T')[0]);

  // 4. Instrutores (docs/instrutores_tabela.xlsx)
  try {
    const instrutoresPath = path.join(process.cwd(), '../docs/instrutores_tabela.xlsx');
    const workbookInstrutores = xlsx.readFile(instrutoresPath);
    const sheetNameInstrutores = workbookInstrutores.SheetNames[0];
    const dataInstrutores = xlsx.utils.sheet_to_json(workbookInstrutores.Sheets[sheetNameInstrutores]) as any[];

    const instrutoresData = dataInstrutores.map((row) => ({
      nome_instrutor: String(row.Nome).trim(),
    }));

    await prisma.instrutor.createMany({
      data: instrutoresData,
      skipDuplicates: true,
    });
    console.log(`Injetados ${instrutoresData.length} instrutores com sucesso!`);
  } catch (error) {
    console.warn('Não foi possível ler/injetar instrutores_tabela.xlsx', error);
  }

  // Garantir instrutores adicionais do nosso formulário
  const instrutoresExtra = Array.from(new Set(turmasFinais.map(t => t.instrutor).filter(i => i !== '')));
  for (const nome of instrutoresExtra) {
    await prisma.instrutor.upsert({
      where: { nome_instrutor: nome },
      update: {},
      create: { nome_instrutor: nome }
    });
  }

  // 5. Salas (docs/descricao_das_salas_talal.xlsx + Recanto)
  try {
    const salasPath = path.join(process.cwd(), '../docs/descricao_das_salas_talal.xlsx');
    const workbookSalas = xlsx.readFile(salasPath);
    const sheetNameSalas = workbookSalas.SheetNames[0];
    const dataSalas = xlsx.utils.sheet_to_json(workbookSalas.Sheets[sheetNameSalas]) as any[];

    for (const row of dataSalas) {
      const tipo = row.Tipo_de_sala || 'Comum';
      let tipoDb = await prisma.tipoSala.findFirst({ where: { nome_tipo: tipo } });
      if (!tipoDb) {
        tipoDb = await prisma.tipoSala.create({ data: { nome_tipo: tipo } });
      }

      let nomeSala = String(row.Nome_da_sala).trim();
      if (!nomeSala.toLowerCase().startsWith('sala') && !isNaN(Number(nomeSala))) {
        nomeSala = `Sala ${nomeSala}`;
      }

      // Padronização do nome da sala para bater com o layout solicitado
      if (nomeSala.toLowerCase().startsWith('sala ') && !nomeSala.toLowerCase().startsWith('sala inovadora')) {
        nomeSala = nomeSala.replace(/sala\s+/i, 'Sala ');
      } else if (nomeSala.toLowerCase().startsWith('laboratório de informática ')) {
        nomeSala = nomeSala.replace(/laboratório de informática/i, 'Laboratório de TI');
      } else if (nomeSala.toLowerCase().startsWith('laboratório de imagem pessoal ')) {
        const parts = nomeSala.split(' ');
        const num = parts[5]; // Posição do número
        nomeSala = `Laboratório de Imagem ${num}`;
      }

      await prisma.sala.create({
        data: {
          nome_sala: nomeSala,
          capacidade_maxima: Number(row.Capacidade_maxima) || 30,
          local: 'Cep Talal Abu Allan',
          recursos_especiais: row.Recursos_especiais || '',
          idTipo_sala: tipoDb.idTipo_sala,
        }
      });
    }
  } catch (error) {
    console.warn('Não foi possível ler/injetar descricao_das_salas_talal.xlsx', error);
  }

  // Inserir as salas do Recanto
  let tipoTI = await prisma.tipoSala.upsert({
    where: { nome_tipo: 'Laboratório de TI' },
    update: {},
    create: { nome_tipo: 'Laboratório de TI' }
  });
  let tipoMultiuso = await prisma.tipoSala.upsert({
    where: { nome_tipo: 'Laboratório Multiuso' },
    update: {},
    create: { nome_tipo: 'Laboratório Multiuso' }
  });

  const salasRecanto = [
    { nome: 'Laboratório 1 (Recanto)', tipoId: tipoTI.idTipo_sala },
    { nome: 'Laboratório 2 (Recanto)', tipoId: tipoTI.idTipo_sala },
    { nome: 'Sala Multiuso (Recanto)', tipoId: tipoMultiuso.idTipo_sala }
  ];

  for (const s of salasRecanto) {
    await prisma.sala.create({
      data: {
        nome_sala: s.nome,
        capacidade_maxima: 30,
        local: 'Polo Recanto das Emas',
        recursos_especiais: 'Climatização, projetor, quadro branco',
        idTipo_sala: s.tipoId
      }
    });
  }
  console.log('Salas de Ceilândia e Recanto inicializadas.');


  // Garantir cursos das turmas finais se não estiverem no portfólio
  const cursosExtra = Array.from(new Set(turmasFinais.map(t => t.nome_curso)));
  for (const nome of cursosExtra) {
    await prisma.curso.upsert({
      where: { nome_curso: nome },
      update: {},
      create: {
        nome_curso: nome,
        segmento: 'Geral',
        modalidade: 'Presencial',
        carga_horaria: turmasFinais.find(t => t.nome_curso === nome)?.carga_horaria || 160,
        valor: 0
      }
    });
  }

  // 7. Alocação inteligente de salas para as 61 turmas
  const dbSalas = await prisma.sala.findMany({ include: { tipoSala: true } });
  const dbTurnos = await prisma.turno.findMany();
  const dbStatus = await prisma.statusTurma.findMany();
  const dbCursos = await prisma.curso.findMany();
  const dbInstrutores = await prisma.instrutor.findMany();

  console.log('Iniciando alocação automática de salas sem conflitos...');

  let totalAlocadas = 0;

  for (const tFinal of turmasFinais) {
    const curso = dbCursos.find(c => c.nome_curso.trim().toLowerCase() === tFinal.nome_curso.trim().toLowerCase());
    if (!curso) {
      console.error(`Curso não encontrado para a turma ${tFinal.codigo_turma}: "${tFinal.nome_curso}"`);
      console.log('Cursos disponíveis no banco:', dbCursos.map(c => c.nome_curso));
      throw new Error(`Curso não encontrado no banco: "${tFinal.nome_curso}"`);
    }
    const instrutor = dbInstrutores.find(i => i.nome_instrutor.trim().toLowerCase() === tFinal.instrutor.trim().toLowerCase()) || null;

    // Mapear turno ID
    let turnoNome = 'Manhã';
    if (tFinal.horario.includes('14:00') || tFinal.horario.includes('13:00') || tFinal.horario.includes('13:15')) {
      turnoNome = 'Tarde';
    } else if (tFinal.horario.includes('19:00')) {
      turnoNome = 'Noite';
    }
    const turno = dbTurnos.find(tu => tu.nome_turno === turnoNome)!;

    // Mapear status ID
    let statusNome = 'Em Andamento';
    if (tFinal.estado.includes('Liberado')) {
      statusNome = 'Liberado Para Matrícula';
    } else if (tFinal.estado.includes('Elaboração')) {
      statusNome = 'Em Elaboração';
    }
    const status = dbStatus.find(s => s.nome_status === statusNome)!;

    // Calcular cronograma de datas de aula
    const cronograma = await calcularCronograma(
      tFinal.carga_horaria,
      new Date(tFinal.data_inicio),
      tFinal.dias_semana,
      feriadosStrings
    );
    const datasDate = cronograma.datasAulas.map(d => new Date(d));

    // Achar sala candidata livre de conflitos
    let salaEscolhida = null;
    const salasCandidatas = obterSalasCandidatas(dbSalas, tFinal.nome_curso, tFinal.local);

    for (const sala of salasCandidatas) {
      // Verificar se essa sala tem agendamentos conflitantes no mesmo turno nessas datas
      const conflito = await prisma.agendamento.findFirst({
        where: {
          id_salas: sala.id_salas,
          data_aula: { in: datasDate },
          turma: { fk_id_turno: turno.id_turno }
        }
      });

      if (!conflito) {
        salaEscolhida = sala;
        break;
      }
    }

    // Se houver conflito em todas as salas sugeridas, buscar qualquer sala vaga no local
    if (!salaEscolhida) {
      const todasLocal = dbSalas.filter(s => s.local === (tFinal.local.includes('Recanto') ? 'Polo Recanto das Emas' : 'Cep Talal Abu Allan'));
      for (const sala of todasLocal) {
        const conflito = await prisma.agendamento.findFirst({
          where: {
            id_salas: sala.id_salas,
            data_aula: { in: datasDate },
            turma: { fk_id_turno: turno.id_turno }
          }
        });
        if (!conflito) {
          salaEscolhida = sala;
          break;
        }
      }
    }

    // Se ainda assim der conflito (fallback extremo), usar a primeira candidata
    if (!salaEscolhida) {
      console.warn(`[WARN] Conflito inevitável detectado para a turma ${tFinal.codigo_turma}. Forçando alocação.`);
      salaEscolhida = salasCandidatas[0] || dbSalas[0];
    }

    // Criar a turma no banco de dados
    const turmaCriada = await prisma.turma.create({
      data: {
        id_cursos: curso.id_cursos,
        id_instrutores: instrutor ? instrutor.id_instrutores : null,
        codigo_turma: tFinal.codigo_turma,
        fk_id_status: status.id_status,
        fk_id_turno: turno.id_turno,
        data_inicio: new Date(tFinal.data_inicio),
        data_termino: cronograma.dataTermino,
        total_alunos: 30, // Padrão
        alunos_pagantes: tFinal.estado.includes('Comercial') ? 15 : 0,
        alunos_bolsistas: tFinal.estado.includes('PSG') ? 15 : 0,
        dias_semana: tFinal.dias_semana.join(','),
      }
    });

    // Criar os agendamentos das datas letivas
    const agendamentos = cronograma.datasAulas.map(d => ({
      id_turmas: turmaCriada.id_turmas,
      id_salas: salaEscolhida.id_salas,
      data_aula: new Date(d)
    }));

    await prisma.agendamento.createMany({
      data: agendamentos
    });

    totalAlocadas++;
  }

  console.log(`=== Seed finalizado! ${totalAlocadas} turmas alocadas com sucesso sem conflitos ===`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
