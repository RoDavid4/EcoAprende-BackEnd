import { SetMetadata } from '@nestjs/common';

export interface AuditLogEntryOptions {
  action: string;
  resource: string;
}

export const AUDIT_LOG_KEY = 'auditLogOptions';
export const AuditLogEntry = (options: AuditLogEntryOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);
