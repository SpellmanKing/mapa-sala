import type { NextFunction, Request, Response } from 'express';

type ApiErrorPayload = {
  success: false;
  error: string;
  details?: unknown;
  path?: string;
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error(err);

  const status =
    typeof err === 'object' && err !== null && 'statusCode' in err
      ? // @ts-expect-error - runtime check
        Number(err.statusCode)
      : 500;

  const message =
    typeof err === 'object' && err !== null && 'message' in err
      ? // @ts-expect-error - runtime check
        String(err.message)
      : 'Internal Server Error';

  const payload: ApiErrorPayload = {
    success: false,
    error: message,
    details: typeof err === 'object' && err !== null && 'details' in err ? (err as any).details : undefined,
    path: req.originalUrl
  };

  res.status(status).json(payload);
}

