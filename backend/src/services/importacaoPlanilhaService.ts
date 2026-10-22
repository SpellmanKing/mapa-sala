import { Prisma, type Agendamento, type Curso, type Instrutor, type Sala, type Turma, type Turno } from '@prisma/client';
import { DATA_CORTE_IMPORTACAO } from '../config/importacaoPlanilha.js';
import { prisma } from '../infrastructure/prismaClient.js';
import { lerPlanilha, type ErroLinha, type LinhaImportacao } from '../schemas/importacaoPlanilhaSchema.js';
import { HttpError } from '../utils/errors.js';
import { horasPorTurno } from '../utils/horasPorTurno.js';
import { CalculadoraService } from './calculadoraService.js';

type Banco = Prisma.TransactionClient;
type TurmaCompleta = Turma & { curso: Curso; turno: Turno; agendamentos: Agendamento[] };
type Ocupacao = Agendamento & { turma: Turma };
type ResultadoLinha = { linha: number; codigo_turma: string; operacao: '1' | '2' | '3' | 'AVISO' | 'ERRO'; mensagem: string; criados: number; alterados: number; mantidos: number };
type Plano = {
  entrada: LinhaImportacao;
  operacao: '1' | '2' | '3';
  turma?: TurmaCompleta;
  curso?: Curso;
  sala: Sala;
  turno: Turno;
  instrutorId: number | null;
  datas: Date[];
  resultado: ResultadoLinha;
};

const texto = (valor: string) => valor.trim().toLocaleLowerCase('pt-BR');
const iso = (data: Date) => data.toISOString().slice(0, 10);
const dataUtc = (valor: string) => new Date(`${valor}T00:00:00.000Z`);
const chave = (data: Date, turnoId: number) => `${iso(data)}:${turnoId}`;

export function dataEfetiva(agora = new Date()): string {
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(DATA_CORTE_IMPORTACAO) || Number.isNaN(Date.parse(`${DATA_CORTE_IMPORTACAO}T00:00:00Z`))) throw new Error('DATA_CORTE_IMPORTACAO inválida');
  return hoje > DATA_CORTE_IMPORTACAO ? hoje : DATA_CORTE_IMPORTACAO;
}

function erro(entrada: LinhaImportacao, mensagem: string): ErroLinha {
  return { linha: entrada.linha, codigo_turma: entrada.codigo_turma, operacao: 'ERRO', mensagem, criados: 0, alterados: 0, mantidos: 0 };
}

export class ImportacaoPlanilhaService {
  private calculadora = new CalculadoraService();

  async processar(arquivo: Buffer, confirmar: boolean) {
    const { linhas, erros } = lerPlanilha(arquivo);
    const hoje = dataEfetiva();
    return prisma.$transaction(async tx => {
      const { planos, resultados } = await this.planejar(tx, linhas, erros, hoje, confirmar);
      const resposta = {
        data_corte_efetiva: hoje,
        linhas: resultados.sort((a, b) => a.linha - b.linha),
        totais: {
          criados: resultados.reduce((n, r) => n + r.criados, 0),
          alterados: resultados.reduce((n, r) => n + r.alterados, 0),
          mantidos: resultados.reduce((n, r) => n + r.mantidos, 0)
        }
      };
      if (!confirmar) return resposta;
      if (resultados.some(r => r.operacao === 'ERRO')) {
        throw new HttpError(409, 'A planilha contém erros; nenhuma linha foi aplicada.', resposta);
      }
      await this.aplicar(tx, planos, hoje);
      return resposta;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  }

  private async planejar(db: Banco, linhas: LinhaImportacao[], erros: ErroLinha[], hoje: string, bloquear: boolean) {
    const [cursos, salas, instrutores, turnos] = await Promise.all([
      db.curso.findMany(), db.sala.findMany(), db.instrutor.findMany(), db.turno.findMany()
    ]);
    if (bloquear) {
      const turmasParaLocks = await db.turma.findMany({ select: { id_turmas: true, codigo_turma: true, id_instrutores: true } });
      const chaves = new Set<string>();
      for (const entrada of linhas) {
        const sala = salas.find(s => texto(s.nome_sala) === texto(entrada.sala) && texto(s.local ?? '') === texto(entrada.local_sala));
        const turno = turnos.find(t => t.nome_turno === entrada.turno);
        const instrutor = instrutores.find(i => texto(i.nome_instrutor) === texto(entrada.instrutor));
        const turma = entrada.id_turma != null
          ? turmasParaLocks.find(t => t.id_turmas === entrada.id_turma)
          : turmasParaLocks.find(t => t.codigo_turma === entrada.codigo_turma);
        const instrutorId = instrutor?.id_instrutores ?? turma?.id_instrutores;
        if (sala && turno) chaves.add(`sala:${sala.id_salas}:turno:${turno.id_turno}`);
        if (instrutorId != null && turno) chaves.add(`instrutor:${instrutorId}:turno:${turno.id_turno}`);
      }
      for (const recurso of [...chaves].sort()) {
        await db.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${recurso}, 0))::text`;
      }
    }
    const [turmas, ocupacoes] = await Promise.all([
      db.turma.findMany({ include: { curso: true, turno: true, agendamentos: true } }),
      db.agendamento.findMany({ where: { data_aula: { gte: dataUtc(hoje) } }, include: { turma: true } })
    ]) as [TurmaCompleta[], Ocupacao[]];
    const resultados: ResultadoLinha[] = [...erros];
    const planos: Plano[] = [];
    const usados = new Set<number>();
    const codigosNovos = new Set<string>();
    const cargasCursosNovos = new Map<string, number>();
    for (const entrada of linhas) {
      try {
        const candidatos = turmas.filter(t => t.codigo_turma === entrada.codigo_turma);
        const turma = entrada.id_turma != null
          ? turmas.find(t => t.id_turmas === entrada.id_turma)
          : candidatos.length === 1 ? candidatos[0] : undefined;
        if (entrada.id_turma != null && !turma) throw new Error(`ID de turma ${entrada.id_turma} não encontrado.`);
        if (entrada.id_turma == null && candidatos.length > 1) throw new Error(`Código ambíguo; informe id_turma. IDs: ${candidatos.map(t => t.id_turmas).join(', ')}.`);
        if (turma && turma.codigo_turma !== entrada.codigo_turma) throw new Error('Código da turma não corresponde ao id_turma informado.');
        if (turma && usados.has(turma.id_turmas)) throw new Error('Turma repetida na planilha.');
        if (!turma && codigosNovos.has(entrada.codigo_turma)) throw new Error('Código de turma nova repetido na planilha.');
        const salasEncontradas = salas.filter(s => texto(s.nome_sala) === texto(entrada.sala) && texto(s.local ?? '') === texto(entrada.local_sala));
        if (salasEncontradas.length !== 1) throw new Error(salasEncontradas.length ? 'Sala e local ambíguos.' : 'Sala/local inexistentes.');
        const sala = salasEncontradas[0]!;
        const turno = turnos.find(t => t.nome_turno === entrada.turno);
        if (!turno) throw new Error('Turno inexistente.');
        const curso = cursos.find(c => texto(c.nome_curso) === texto(entrada.curso));
        if (turma && (!curso || curso.id_cursos !== turma.id_cursos)) throw new Error('Curso informado não corresponde ao curso da turma.');
        if (!turma && !curso && !entrada.carga_horaria) throw new Error('Curso inexistente; informe carga_horaria para criá-lo.');
        if (!turma && !curso) {
          const cargaAnterior = cargasCursosNovos.get(texto(entrada.curso));
          if (cargaAnterior != null && cargaAnterior !== entrada.carga_horaria) throw new Error('Curso novo repetido com cargas horárias diferentes.');
        }
        const instrutor = entrada.instrutor ? instrutores.find(i => texto(i.nome_instrutor) === texto(entrada.instrutor)) : undefined;
        if (entrada.instrutor && !instrutor) throw new Error('Instrutor inexistente.');
        const instrutorId = instrutor?.id_instrutores ?? turma?.id_instrutores ?? null;
        const alunos = entrada.alunos ?? turma?.total_alunos ?? 30;
        if (alunos > sala.capacidade_maxima) throw new Error(`Sala comporta ${sala.capacidade_maxima} alunos; solicitado: ${alunos}.`);
        if (turma && entrada.data_inicio && entrada.data_inicio !== iso(turma.data_inicio)) throw new Error('Turma existente não muda de data de início.');
        if (!turma && !entrada.data_inicio) throw new Error('Data de início obrigatória para turma nova.');
        let operacao: Plano['operacao'];
        let datas: Date[];
        let mantidos = turma?.agendamentos.filter(a => iso(a.data_aula) < hoje).length ?? 0;
        let alterados = 0;
        if (!turma) {
          if (entrada.data_inicio! < hoje) throw new Error(`Data de início anterior a ${hoje}; não é permitido criar aulas no passado.`);
          const dias = curso?.dias_letivos_padrao?.split(',').filter(Boolean);
          const diasLetivos = dias?.length ? dias : ['1', '2', '3', '4', '5'];
          datas = (await this.calculadora.calcularCronograma(curso?.carga_horaria ?? entrada.carga_horaria!, entrada.data_inicio!, diasLetivos, undefined, turno.nome_turno)).datasAulas.map(dataUtc);
          operacao = '1';
          codigosNovos.add(entrada.codigo_turma);
          if (!curso) cargasCursosNovos.set(texto(entrada.curso), entrada.carga_horaria!);
        } else {
          const futuras = turma.agendamentos.filter(a => iso(a.data_aula) >= hoje);
          if (futuras.length) {
            if (turma.fk_id_turno !== turno.id_turno) throw new Error('Turma com aulas futuras não muda de turno.');
            datas = futuras.map(a => a.data_aula);
            alterados = futuras.filter(a => a.id_salas !== sala.id_salas).length;
            mantidos += futuras.length - alterados;
            operacao = '2';
          } else {
            const anteriores = turma.agendamentos.filter(a => iso(a.data_aula) < hoje).length;
            const restantes = Math.ceil(turma.curso.carga_horaria / horasPorTurno(turno.nome_turno)) - anteriores;
            if (restantes <= 0) {
              resultados.push({ linha: entrada.linha, codigo_turma: entrada.codigo_turma, operacao: 'AVISO', mensagem: 'Turma já concluída; nenhuma aula restante.', criados: 0, alterados: 0, mantidos: anteriores });
              usados.add(turma.id_turmas);
              continue;
            }
            const dias = turma.dias_semana.split(',').filter(Boolean);
            datas = (await this.calculadora.calcularCronograma(restantes * horasPorTurno(turno.nome_turno), hoje, dias, undefined, turno.nome_turno)).datasAulas.map(dataUtc);
            operacao = '3';
          }
          usados.add(turma.id_turmas);
        }
        const resultado: ResultadoLinha = { linha: entrada.linha, codigo_turma: entrada.codigo_turma, operacao, mensagem: `Operação ${operacao} pronta.`, criados: operacao === '2' ? 0 : datas.length, alterados, mantidos };
        planos.push({ entrada, operacao, turma, curso, sala, turno, instrutorId, datas, resultado });
        resultados.push(resultado);
      } catch (causa) {
        resultados.push(erro(entrada, causa instanceof Error ? causa.message : 'Erro ao validar linha.'));
      }
    }
    // shortcut: trocas simultâneas de sala/instrutor entre turmas são rejeitadas; suportar quando houver necessidade operacional.
    for (const plano of planos) {
      const conflito = plano.datas.find(data => {
        const mesmaData = (a: Ocupacao) => chave(a.data_aula, a.turma.fk_id_turno) === chave(data, plano.turno.id_turno);
        return ocupacoes.some(a => a.id_turmas !== plano.turma?.id_turmas && mesmaData(a) && (a.id_salas === plano.sala.id_salas || (plano.instrutorId != null && a.turma.id_instrutores === plano.instrutorId))) ||
          planos.some(outro => outro !== plano && outro.datas.some(d => chave(d, outro.turno.id_turno) === chave(data, plano.turno.id_turno)) && (outro.sala.id_salas === plano.sala.id_salas || (plano.instrutorId != null && outro.instrutorId === plano.instrutorId)));
      });
      if (conflito) {
        Object.assign(plano.resultado, erro(plano.entrada, `Conflito de sala ou instrutor em ${iso(conflito)} no turno ${plano.turno.nome_turno}.`));
      }
    }
    return { planos, resultados };
  }

  private async aplicar(db: Banco, planos: Plano[], hoje: string) {
    const cursosCriados = new Map<string, number>();
    for (const plano of planos) {
      const { entrada, operacao, turma, curso, sala, turno, instrutorId, datas } = plano;
      if (operacao === '1') {
        let cursoId = curso?.id_cursos ?? cursosCriados.get(texto(entrada.curso));
        if (!cursoId) {
          const novo = await db.curso.create({ data: { nome_curso: entrada.curso, carga_horaria: entrada.carga_horaria!, segmento: 'Geral', modalidade: 'Presencial', valor: 0 } });
          cursoId = novo.id_cursos;
          cursosCriados.set(texto(entrada.curso), cursoId);
        }
        const status = await db.statusTurma.findFirst({ where: { nome_status: 'Planejada' } });
        if (!status) throw new HttpError(500, 'Status Planejada não configurado.');
        const nova = await db.turma.create({ data: {
          id_cursos: cursoId, codigo_turma: entrada.codigo_turma, id_instrutores: instrutorId,
          fk_id_turno: turno.id_turno, fk_id_status: status.id_status,
          data_inicio: dataUtc(entrada.data_inicio!), data_termino: datas[datas.length - 1]!,
          total_alunos: entrada.alunos ?? 30,
          dias_semana: curso?.dias_letivos_padrao || '1,2,3,4,5'
        } });
        await db.agendamento.createMany({ data: datas.map(data_aula => ({ id_turmas: nova.id_turmas, id_salas: sala.id_salas, fk_id_turno: turno.id_turno, data_aula })) });
      } else if (turma) {
        await db.turma.update({ where: { id_turmas: turma.id_turmas }, data: {
          id_instrutores: instrutorId, total_alunos: entrada.alunos ?? turma.total_alunos,
          ...(operacao === '3' ? { fk_id_turno: turno.id_turno, data_termino: datas[datas.length - 1]! } : {})
        } });
        if (operacao === '2') {
          await db.agendamento.updateMany({ where: { id_turmas: turma.id_turmas, data_aula: { gte: dataUtc(hoje) } }, data: { id_salas: sala.id_salas } });
        } else {
          await db.agendamento.createMany({ data: datas.map(data_aula => ({ id_turmas: turma.id_turmas, id_salas: sala.id_salas, fk_id_turno: turno.id_turno, data_aula })) });
        }
      }
    }
  }
}
