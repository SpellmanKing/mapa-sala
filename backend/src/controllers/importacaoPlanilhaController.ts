import { Router, raw, type Request, type Response } from 'express';
import { PERMISSIONS } from '../auth/permissions.js';
import { authorize } from '../middlewares/authMiddleware.js';
import { ImportacaoPlanilhaService } from '../services/importacaoPlanilhaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';

export const importacaoPlanilhaRouter = Router();
const service = new ImportacaoPlanilhaService();
const arquivo = raw({ type: 'application/octet-stream', limit: '5mb' });

function receber(confirmar: boolean) {
  return asyncHandler(async (req: Request, res: Response) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw new HttpError(400, 'Envie um arquivo CSV ou XLSX.');
    res.json(await service.processar(req.body, confirmar));
  });
}

importacaoPlanilhaRouter.post('/simular', authorize(PERMISSIONS.manage), arquivo, receber(false));
importacaoPlanilhaRouter.post('/confirmar', authorize(PERMISSIONS.manage), arquivo, receber(true));
