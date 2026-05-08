import { router as salasRouter } from './salas.js';
import { router as calculadoraRouter } from './calculadora_inteligente.js';
import { router as alocacaoRouter } from './alocar_turma.js';
import { router as calculadoraCronogramaRouter } from './calcular_cronograma.js';
import { router as instrutoresRouter } from './gerenciar_instrutores.js';
import { router as cursosRouter } from './gerenciar_cursos.js';
import { router as feriadosRouter } from './gerenciar_feriado.js';
import { router as turmasRouter } from './gerenciar_turma.js';

export function registerRoutes(app) {
  // Mantém o mesmo “contrato de nomes de arquivos” do frontend (controllers/*.php)
  app.use('/controllers/gerenciar_sala.php', salasRouter);
  app.use('/controllers/calculadora_inteligente.php', calculadoraRouter);
  app.use('/controllers/alocar_turma.php', alocacaoRouter);
  app.use('/controllers/calcular_cronograma.php', calculadoraCronogramaRouter);
  app.use('/controllers/gerenciar_instrutores.php', instrutoresRouter);
  app.use('/controllers/gerenciar_cursos.php', cursosRouter);
  app.use('/controllers/gerenciar_feriado.php', feriadosRouter);
  app.use('/controllers/gerenciar_turma.php', turmasRouter);
}

