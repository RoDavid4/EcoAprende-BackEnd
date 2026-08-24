import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';
import {
  AUDIT_LOG_KEY,
  AuditLogEntryOptions,
} from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<AuditLogEntryOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        // Run asynchronously without blocking the response
        setTimeout(() => {
          void (async () => {
            try {
              const userId = request.user?.id;
              const ipAddress =
                (request.headers['x-forwarded-for'] as string)
                  ?.split(',')[0]
                  ?.trim() ||
                request.ip ||
                request.socket?.remoteAddress ||
                null;
              const userAgent = request.headers['user-agent'] || null;
              const resourceId = request.params?.id || null;

              // Sanitize payload
              const payload = { ...request.body };
              if (payload.password) delete payload.password;
              if (payload.newPassword) delete payload.newPassword;
              if (payload.currentPassword) delete payload.currentPassword;

              await this.auditLogsService.logAction({
                userId,
                action: options.action,
                resource: options.resource,
                resourceId,
                payload: Object.keys(payload).length > 0 ? payload : undefined,
                ipAddress,
                userAgent,
              });
            } catch (error) {
              console.error('Failed to write audit log', error);
            }
          })();
        }, 0);
      }),
    );
  }
}
