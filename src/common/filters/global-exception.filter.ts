import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from 'generated/prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      return response.status(status).json({
        ok: false,
        error: res,
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return response.status(HttpStatus.CONFLICT).json({
            ok: false,
            error: 'RESOURCE_ALREADY_EXISTS',
          });
        case 'P2025':
        case 'P2001':
          return response.status(HttpStatus.NOT_FOUND).json({
            ok: false,
            error: 'RESOURCE_NOT_FOUND',
          });
        case 'P2003':
          return response.status(HttpStatus.BAD_REQUEST).json({
            ok: false,
            error: 'FOREIGN_KEY_CONSTRAINT_FAILED',
          });
        case 'P2000':
          return response.status(HttpStatus.BAD_REQUEST).json({
            ok: false,
            error: 'VALUE_TOO_LONG',
          });
        case 'P2011':
          return response.status(HttpStatus.BAD_REQUEST).json({
            ok: false,
            error: 'NULL_CONSTRAINT_VIOLATION',
          });
        case 'P2012':
          return response.status(HttpStatus.BAD_REQUEST).json({
            ok: false,
            error: 'MISSING_REQUIRED_VALUE',
          });
        default:
          return response.status(HttpStatus.BAD_REQUEST).json({
            ok: false,
            error: `DATABASE_ERROR_${exception.code}`,
          });
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        ok: false,
        error: 'VALIDATION_ERROR',
      });
    }

    console.error(exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ok: false,
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}
