import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  DatabaseError,
} from 'sequelize';

@Catch(DatabaseError, ForeignKeyConstraintError, UniqueConstraintError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (
      exception instanceof ForeignKeyConstraintError ||
      exception.name === 'SequelizeForeignKeyConstraintError'
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Operación inválida: registro referenciado no encontrado';
    } else if (
      exception instanceof UniqueConstraintError ||
      exception.name === 'SequelizeUniqueConstraintError'
    ) {
      status = HttpStatus.CONFLICT;
      message =
        'Conflicto: ya existe un registro con esos datos (violación de índice único)';
    }

    // Si aún es 500 pero es un error de BD, devolvemos 500 pero logeamos
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Unhandled Database Error:', exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
