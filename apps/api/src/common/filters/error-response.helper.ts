import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

const CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;
const logger = new Logger('ErrorResponse');

function statusToDefaultCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'INVALID_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHENTICATED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMIT_EXCEEDED';
    default:
      return 'INTERNAL_ERROR';
  }
}

function extractField(raw: unknown, key: 'message' | 'details' | 'code'): unknown {
  if (raw && typeof raw === 'object' && key in raw) {
    return (raw as Record<string, unknown>)[key];
  }
  return undefined;
}

function pickCode(raw: unknown, status: number): string {
  const message = extractField(raw, 'message');
  if (typeof message === 'string' && CODE_PATTERN.test(message)) {
    return message;
  }
  const code = extractField(raw, 'code');
  if (typeof code === 'string' && CODE_PATTERN.test(code)) {
    return code;
  }
  return statusToDefaultCode(status);
}

function pickMessage(raw: unknown, status: number): string {
  const message = extractField(raw, 'message');
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof raw === 'string') return raw;
  return statusToDefaultCode(status);
}

export function sendErrorResponse(
  host: ArgumentsHost,
  status: number,
  raw: unknown,
  stack?: string,
): void {
  const ctx = host.switchToHttp();
  const request = ctx.getRequest<Request>();
  const response = ctx.getResponse<Response>();
  const requestId = randomUUID();

  const code = pickCode(raw, status);
  const message = pickMessage(raw, status);
  const details = extractField(raw, 'details');

  if (status >= 500) {
    logger.error(
      `[${requestId}] ${request.method} ${request.originalUrl} -> ${status} ${code}: ${message}`,
      stack,
    );
  } else if (status >= 400) {
    logger.warn(`[${requestId}] ${request.method} ${request.originalUrl} -> ${status} ${code}`);
  }

  response.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
