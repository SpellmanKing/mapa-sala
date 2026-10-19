import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { horasPorTurno } from '../src/utils/horasPorTurno.js';
import { seedReferenceData } from './seedReferenceData.js';

const prisma = new PrismaClient();

// Lista das 61 turmas candidatas do projeto
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
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
    carga_horaria: 160,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Thiago de Sousa Costa',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.10',
    nome_curso: 'Cabeleireiro',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-04-20',
    carga_horaria: 40,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Raquel Angel dos Santos Costa',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.13',
    nome_curso: 'Costureiro',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
    carga_horaria: 212,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Suely de Fátima Pereira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.117',
    nome_curso: 'Extensão de Cílios Fio a Fio',
    data_inicio: '2026-04-06',
    carga_horaria: 40,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '13:00 às 17:00',
    instrutor: '',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.82',
    nome_curso: 'Informática Windows e Office Fundamental',
    data_inicio: '2026-03-09',
    carga_horaria: 80,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Rildo Goncalves',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.52',
    nome_curso: 'Manicure e Pedicure',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
    carga_horaria: 160,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'LUZIA PEREIRA DE ANDRADE',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.30',
    nome_curso: 'Maquiador',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
    carga_horaria: 40,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Alessandro Alves de Vasconcelos',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.25',
    nome_curso: 'Modelista',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-04-06',
    carga_horaria: 40,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'Rildo Goncalves',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.105',
    nome_curso: 'Técnicas Básicas de Maquiagem',
    data_inicio: '2026-05-04',
    carga_horaria: 20,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: '',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.53',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2025-05-19',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '13:15 às 17:15',
    instrutor: 'Andre Luiz Soares Alonso',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.54',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2025-05-19',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '13:15 às 17:15',
    instrutor: 'Leandro das Chagas Ferreira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.55',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2025-05-19',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Analice Barbosa Santos de Oliveira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.34',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'José Chaves dos Santos',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.69',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Mariléia de Jesus Amorim',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.71',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'José de Assis Custódio',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.77',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Dionísio Francisco Pereira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.78',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Shirleny Andrade do Nascimento',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.80',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'José de Assis Custódio',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.83',
    nome_curso: 'Técnico em Contabilidade',
    data_inicio: '2025-08-25',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: 'José de Assis Custódio',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.119',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2025-10-06',
    carga_horaria: 1200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Wellerson Pereira do Couto',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.55',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Ricardo de Souza Serra',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2025.09.121',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2025-10-27',
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
    data_inicio: '2026-03-09',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Carlos Eduardo Alves Munis',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.65',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2026-03-09',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Lucas Augusto Esmeraldo de Oliveira',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.67',
    nome_curso: 'Técnico em Programação de Jogos Digitais',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Nicole Cândido de Oliveira Andrade',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.106',
    nome_curso: 'Técnico em Secretaria Escolar',
    data_inicio: '2026-03-09',
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
    data_inicio: '2025-05-19',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '13:15 às 17:15',
    instrutor: 'RICARDO PEREIRA GOMES DE ARAÚJO',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },
  {
    codigo_turma: '2026.09.107',
    nome_curso: 'Técnico em Secretariado',
    data_inicio: '2026-03-09',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '19:00 às 22:00',
    instrutor: '',
    estado: 'Em Andamento',
    local: 'Cep Talal Abu Allan'
  },

  // --- RECANTO DAS EMAS ---
  {
    codigo_turma: '2026.29.18',
    nome_curso: 'Assistente Administrativo',
    data_inicio: '2026-03-09',
    carga_horaria: 160,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: '',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.15',
    nome_curso: 'Assistente de Tecnologias da Informação',
    data_inicio: '2026-03-09',
    carga_horaria: 200,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Cleiton Pereira Sousa',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.1',
    nome_curso: 'Cabeleireiro',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
    carga_horaria: 80,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Cleiton Pereira Sousa',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.16',
    nome_curso: 'Office 365 com Inteligência Artificial',
    data_inicio: '2026-04-06',
    carga_horaria: 40,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Cleiton Pereira Sousa',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.7',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '08:00 às 12:00',
    instrutor: 'Flavia Renata Martins',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.10',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Flavia Renata Martins',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.11',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Ricardo da Silva Pierre',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.14',
    nome_curso: 'Técnico em Administração',
    data_inicio: '2026-03-09',
    carga_horaria: 1000,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'José Chaves dos Santos',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.5',
    nome_curso: 'Técnico em Desenvolvimento de Sistemas',
    data_inicio: '2026-03-09',
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
    data_inicio: '2026-03-09',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
    horario: '14:00 às 18:00',
    instrutor: 'Flavia Renata Martins',
    estado: 'Em Andamento',
    local: 'Polo Recanto das Emas'
  },
  {
    codigo_turma: '2026.29.13',
    nome_curso: 'Técnico em Marketing',
    data_inicio: '2026-03-09',
    carga_horaria: 800,
    dias_semana: ['1', '2', '3', '4', '5'],
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

function calcularCronograma(cargaHoraria: number, dataInicio: Date, diasSemana: string[], feriados: string[], turnoNome: string) {
  const horasPorDia = horasPorTurno(turnoNome);
  const classesNeeded = Math.ceil(cargaHoraria / horasPorDia);

  let currentDate = new Date(dataInicio);
  let classesScheduled = 0;
  const datasAulas: string[] = [];

  while (classesScheduled < classesNeeded) {
    const currentDateStr = currentDate.toISOString().split('T')[0]!;
    const dayOfWeek = currentDate.getUTCDay().toString();

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

function obterSalasCandidatas(salas: any[], nomeCurso: string, local: string) {
  const isRecanto = local.toLowerCase().includes('recanto');
  const localFilter = isRecanto ? 'Polo Recanto das Emas' : 'Cep Talal Abu Allan';
  const salasUnidade = salas.filter(s => s.local === localFilter);
  const nc = nomeCurso.toLowerCase();
  const isEstetica = nc.includes('estética') || nc.includes('unhas') || nc.includes('maquiag') ||
    nc.includes('cabelo') || nc.includes('cabeleireiro') || nc.includes('maquiador') ||
    nc.includes('barbeiro') || nc.includes('colorimetria') || nc.includes('cílios') || nc.includes('manicure');

  if (isRecanto) {
    // Regra: "Recanto das Emas tem apenas Laboratório 1, Laboratório 2 e Sala Multiuso;
    // a Multiuso é só para cursos de estética (manicure, cabeleireiro, maquiagem)."
    if (isEstetica) {
      return salasUnidade.filter(s => s.nome_sala.toLowerCase().includes('multiuso'));
    }
    // Cursos não-estética só podem usar Laboratório 1 e Laboratório 2
    return salasUnidade.filter(s => s.nome_sala.toLowerCase().includes('laboratório') || s.nome_sala.toLowerCase().includes('lab'));
  }

  // Ceilândia (Cep Talal Abu Allan)
  if (isEstetica) {
    return salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Laboratório de Imagem Pessoal');
  }
  if (nc.includes('costureiro') || nc.includes('modelista') || nc.includes('moda')) {
    return salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Laboratório de Moda');
  }
  if (nc.includes('desenvolvimento') || nc.includes('jogos') || nc.includes('tecnologia') || nc.includes('informática') || nc.includes('windows') || nc.includes('office') || nc.includes('power bi') || nc.includes('ia')) {
    return salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Laboratório de TI');
  }

  // Cursos gerais/gestão (administração, secretariado, marketing, etc.)
  const inovadoras = salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Sala de aula Inovadora' || s.tipoSala?.nome_tipo === 'Auditório');
  const labsTi = salasUnidade.filter(s => s.tipoSala?.nome_tipo === 'Laboratório de TI');
  return [...inovadoras, ...labsTi];
}

function salvarRelatorioTurmasPendentes(pendentes: any[]) {
  const cabecalho = 'id_turma,codigo_turma,curso,carga_horaria,instrutor,sala,local_sala,turno,data_inicio,alunos,motivo';
  const linhas = pendentes.map(p => {
    const esc = (v: any) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    return [
      '',
      esc(p.codigo_turma),
      esc(p.nome_curso),
      p.carga_horaria,
      esc(p.instrutor),
      esc(p.sala_pretendida || ''),
      esc(p.local),
      esc(p.turno),
      esc(p.data_inicio),
      p.total_alunos || 30,
      esc(p.motivo)
    ].join(',');
  });

  const csvContent = [cabecalho, ...linhas].join('\n') + '\n';

  const arquivo = path.resolve(process.cwd(), 'relatorios/turmas_pendentes.csv');
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, csvContent, 'utf8');
  console.log(`✓ CSV de turmas pendentes gravado em: ${arquivo}`);
}

export async function seedDemo() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Seed demo destrutivo bloqueado: defina ALLOW_DESTRUCTIVE_SEED=true para executá-lo.');
  }

  console.log('=== Iniciando Seed Demo com Validação de Regras de Negócio ===');

  // Garante dados de referência
  await seedReferenceData();

  const dbSalas = await prisma.sala.findMany({ include: { tipoSala: true } });
  const dbTurnos = await prisma.turno.findMany();
  const dbStatus = await prisma.statusTurma.findMany();
  const dbCursos = await prisma.curso.findMany();
  const dbInstrutores = await prisma.instrutor.findMany();
  const feriados = await prisma.feriadosRecessos.findMany();
  const feriadosStrings = feriados.map(f => f.data_feriado.toISOString().split('T')[0]!);

  const statusEmAndamento = dbStatus.find(s => s.nome_status === 'Em Andamento') ?? dbStatus[0]!;

  const turmasCriadas: any[] = [];
  const turmasPendentes: any[] = [];

  const codigosVistos = new Set<string>();
  // Map para checar conflitos em memória durante a transação
  const ocupacaoSalas = new Map<string, string>(); // `${salaId}:${data}:${turnoId}` -> codigoTurma
  const ocupacaoInstrutores = new Map<string, string>(); // `${instrutorId}:${data}:${turnoId}` -> codigoTurma

  await prisma.$transaction(async (tx) => {
    console.log('Limpando agendamentos e turmas anteriores...');
    await tx.agendamento.deleteMany({});
    await tx.turma.deleteMany({});

    for (const tFinal of turmasFinais) {
      const totalAlunos = 30; // Capacidade padrão requerida

      // Determinar turno
      let turnoNome = 'Manhã';
      if (tFinal.horario.includes('14:00') || tFinal.horario.includes('13:00') || tFinal.horario.includes('13:15')) {
        turnoNome = 'Tarde';
      } else if (tFinal.horario.includes('19:00')) {
        turnoNome = 'Noite';
      }
      const turno = dbTurnos.find(tu => tu.nome_turno === turnoNome)!;

      // 1. Checagem de código duplicado
      if (codigosVistos.has(tFinal.codigo_turma)) {
        turmasPendentes.push({
          ...tFinal,
          turno: turnoNome,
          total_alunos: totalAlunos,
          motivo: 'Código de turma duplicado (mantida a primeira ocorrência)'
        });
        console.warn(`[PENDENTE] ${tFinal.codigo_turma}: Código de turma duplicado.`);
        continue;
      }
      codigosVistos.add(tFinal.codigo_turma);

      // Curso
      const curso = dbCursos.find(c => c.nome_curso.trim().toLowerCase() === tFinal.nome_curso.trim().toLowerCase());
      if (!curso) {
        turmasPendentes.push({
          ...tFinal,
          turno: turnoNome,
          total_alunos: totalAlunos,
          motivo: `Curso não encontrado no catálogo: ${tFinal.nome_curso}`
        });
        console.warn(`[PENDENTE] ${tFinal.codigo_turma}: Curso não encontrado.`);
        continue;
      }

      // Instrutor
      const instrutor = tFinal.instrutor.trim()
        ? dbInstrutores.find(i => i.nome_instrutor.trim().toLowerCase() === tFinal.instrutor.trim().toLowerCase()) ?? null
        : null;
      if (tFinal.instrutor.trim() && !instrutor) {
        turmasPendentes.push({ ...tFinal, turno: turnoNome, total_alunos: totalAlunos, motivo: `Instrutor não cadastrado: ${tFinal.instrutor}` });
        continue;
      }

      // Cronograma
      const cronograma = calcularCronograma(
        tFinal.carga_horaria,
        new Date(tFinal.data_inicio),
        tFinal.dias_semana,
        feriadosStrings,
        turnoNome
      );
      const datasAulas = cronograma.datasAulas;

      // 2. Checagem de Conflito de Instrutor
      let conflitoInstrutorMsg: string | null = null;
      if (instrutor) {
        for (const d of datasAulas) {
          const keyInst = `${instrutor.id_instrutores}:${d}:${turno.id_turno}`;
          if (ocupacaoInstrutores.has(keyInst)) {
            const outraTurma = ocupacaoInstrutores.get(keyInst);
            conflitoInstrutorMsg = `Instrutor ${instrutor.nome_instrutor} já alocado na turma ${outraTurma} neste dia e turno (${d})`;
            break;
          }
        }
      }

      if (conflitoInstrutorMsg) {
        turmasPendentes.push({
          ...tFinal,
          turno: turnoNome,
          total_alunos: totalAlunos,
          motivo: conflitoInstrutorMsg
        });
        console.warn(`[PENDENTE] ${tFinal.codigo_turma}: ${conflitoInstrutorMsg}`);
        continue;
      }

      // 3. Busca de sala candidata sem conflitos e com capacidade suficiente
      const candidatas = obterSalasCandidatas(dbSalas, tFinal.nome_curso, tFinal.local);
      let salaEscolhida: any = null;

      for (const sala of candidatas) {
        // Validação de capacidade
        if (sala.capacidade_maxima < totalAlunos) {
          continue;
        }

        // Validação de disponibilidade na sala durante todo o cronograma no mesmo turno
        let salaOcupada = false;
        for (const d of datasAulas) {
          const keySala = `${sala.id_salas}:${d}:${turno.id_turno}`;
          if (ocupacaoSalas.has(keySala)) {
            salaOcupada = true;
            break;
          }
        }

        if (!salaOcupada) {
          salaEscolhida = sala;
          break;
        }
      }

      // Se não achou sala compatível e livre
      if (!salaEscolhida) {
        const motivo = candidatas.length === 0
          ? `Nenhuma sala compatível com a especialidade do curso na unidade ${tFinal.local}`
          : candidatas.every(s => s.capacidade_maxima < totalAlunos)
            ? `Capacidade física insuficiente nas salas disponíveis da unidade (exigido: ${totalAlunos})`
            : `Sem sala disponível livre de conflitos no turno ${turnoNome} em ${tFinal.local}`;

        turmasPendentes.push({
          ...tFinal,
          turno: turnoNome,
          total_alunos: totalAlunos,
          sala_pretendida: candidatas[0]?.nome_sala,
          motivo
        });
        console.warn(`[PENDENTE] ${tFinal.codigo_turma}: ${motivo}`);
        continue;
      }

      // Alocação com sucesso!
      // Registra ocupações
      for (const d of datasAulas) {
        ocupacaoSalas.set(`${salaEscolhida.id_salas}:${d}:${turno.id_turno}`, tFinal.codigo_turma);
        if (instrutor) {
          ocupacaoInstrutores.set(`${instrutor.id_instrutores}:${d}:${turno.id_turno}`, tFinal.codigo_turma);
        }
      }

      // Cria a turma
      const turmaCriada = await tx.turma.create({
        data: {
          id_cursos: curso.id_cursos,
          id_instrutores: instrutor ? instrutor.id_instrutores : null,
          codigo_turma: tFinal.codigo_turma,
          fk_id_status: statusEmAndamento.id_status,
          fk_id_turno: turno.id_turno,
          data_inicio: new Date(tFinal.data_inicio),
          data_termino: cronograma.dataTermino,
          total_alunos: totalAlunos,
          alunos_pagantes: tFinal.estado.includes('Comercial') ? 15 : 0,
          alunos_bolsistas: tFinal.estado.includes('PSG') ? 15 : 0,
          dias_semana: tFinal.dias_semana.join(','),
        }
      });

      // Cria os agendamentos com fk_id_turno
      const agendamentos = datasAulas.map(d => ({
        id_turmas: turmaCriada.id_turmas,
        id_salas: salaEscolhida.id_salas,
        fk_id_turno: turno.id_turno,
        data_aula: new Date(d)
      }));

      await tx.agendamento.createMany({
        data: agendamentos
      });

      turmasCriadas.push({
        codigo: tFinal.codigo_turma,
        curso: curso.nome_curso,
        sala: salaEscolhida.nome_sala,
        local: tFinal.local,
        turno: turnoNome,
        aulas: datasAulas.length
      });
    }
  }, {
    timeout: 60000
  });

  // Salva o CSV de turmas pendentes
  salvarRelatorioTurmasPendentes(turmasPendentes);

  console.log('\n================ RESUMO DO SEED DEMO ================');
  console.log(`Total de turmas candidatas avaliadas: ${turmasFinais.length}`);
  console.log(`Turmas alocadas com sucesso: ${turmasCriadas.length}`);
  console.log(`Turmas pendentes (não alocadas): ${turmasPendentes.length}`);
  console.log('=====================================================\n');

  return {
    totalAvaliadas: turmasFinais.length,
    totalCriadas: turmasCriadas.length,
    totalPendentes: turmasPendentes.length,
    turmasCriadas,
    turmasPendentes
  };
}

if (process.argv[1]?.includes('seedDemo')) {
  seedDemo()
    .then((res) => {
      console.log(`Seed demo concluído com ${res.totalCriadas} turmas criadas e ${res.totalPendentes} pendentes.`);
    })
    .catch((e) => {
      console.error('Erro no seed demo:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
