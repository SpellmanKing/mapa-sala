export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ValidationError extends HttpError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, message, details);
  }
}

