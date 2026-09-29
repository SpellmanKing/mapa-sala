import express from 'express';
import { z } from 'zod';

import { AuthService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, type AuthRequest } from '../middlewares/authMiddleware.js';

export const authRouter = express.Router();

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.parse(req.body);

    const { token, user, permissions } = await AuthService.login(parsed.email, parsed.password);

    res.status(200).json({
      success: true,
      token,
      user,
      permissions
    });
  })
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const authRequest = req as AuthRequest;
    const session = await AuthService.getSession(authRequest.user!.id);
    res.status(200).json({ success: true, ...session });
  })
);
