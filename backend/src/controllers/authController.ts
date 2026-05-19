import express from 'express';
import { z } from 'zod';

import { AuthService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.parse(req.body);

    const { token, user } = await AuthService.login(parsed.email, parsed.password);

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  })
);

