import { Router, raw, type Request, type Response } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '../auth/permissions.js';
import { COLUNAS_IMPORTACAO, type CampoImportacao } from '../config/importacaoPlanilha.js';
import { authorize } from '../middlewares/authMiddleware.js';
import type { MapeamentoColunas, OpcoesLeituraPlanilha } from '../schemas/importacaoPlanilhaSchema.js';
import { ImportacaoPlanilhaService } from '../services/importacaoPlanilhaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';

export const importacaoPlanilhaRouter = Router();
const service = new ImportacaoPlanilhaService();
const arquivo = raw({ type: 'application/octet-stream', limit: '5mb' });

const camposValidos = new Set(Object.keys(COLUNAS_IMPORTACAO));
const mapeamentoSchema = z.record(z.string(), z.number().int().nonnegative().nullable());

export function extrairOpcoesImportacao(req: Request): OpcoesLeituraPlanilha {
  const opcoes: OpcoesLeituraPlanilha = {};

  if (typeof req.query.aba === 'string' && req.query.aba.trim()) {
    opcoes.aba = req.query.aba.trim();
  }

  if (typeof req.query.linha_cabecalho === 'string' && req.query.linha_cabecalho.trim()) {
    const val = req.query.linha_cabecalho.trim().toLowerCase();
    if (val === 'null' || val === 'none' || val === 'sem_cabecalho' || val === '0') {
      opcoes.linha_cabecalho = null;
    } else {
      const num = Number(val);
      if (!Number.isInteger(num) || num < 1 || num > 100) {
        throw new HttpError(400, 'Parâmetro linha_cabecalho inválido.');
      }
      opcoes.linha_cabecalho = num;
    }
  }

  const rawMapeamento =
    typeof req.query.mapeamento === 'string'
      ? req.query.mapeamento
      : req.header('x-importacao-mapeamento') ?? undefined;

  if (rawMapeamento) {
    try {
      const parsed = mapeamentoSchema.parse(JSON.parse(rawMapeamento));
      const mapeamento: MapeamentoColunas = {};
      for (const [campo, colIdx] of Object.entries(parsed)) {
        if (camposValidos.has(campo)) {
          mapeamento[campo as CampoImportacao] = colIdx;
        }
      }
      opcoes.mapeamento = mapeamento;
    } catch {
      throw new HttpError(400, 'Parâmetro mapeamento inválido.');
    }
  }

  return opcoes;
}

function validarBuffer(req: Request): Buffer {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'Envie um arquivo CSV ou XLSX.');
  }
  return req.body;
}

function receber(confirmar: boolean) {
  return asyncHandler(async (req: Request, res: Response) => {
    const body = validarBuffer(req);
    const opcoes = extrairOpcoesImportacao(req);
    res.json(await service.processar(body, confirmar, opcoes));
  });
}

importacaoPlanilhaRouter.post(
  '/analisar',
  authorize(PERMISSIONS.manage),
  arquivo,
  asyncHandler(async (req: Request, res: Response) => {
    const body = validarBuffer(req);
    const opcoes = extrairOpcoesImportacao(req);
    res.json(await service.analisar(body, opcoes));
  })
);

importacaoPlanilhaRouter.post('/simular', authorize(PERMISSIONS.manage), arquivo, receber(false));
importacaoPlanilhaRouter.post('/confirmar', authorize(PERMISSIONS.manage), arquivo, receber(true));
