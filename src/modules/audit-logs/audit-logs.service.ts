import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from './audit-log.entity';
import { User } from '../users/user.entity';
import { createPaginatedResponse } from '../../common/pagination/pagination.helper';

export interface CreateAuditLogDto {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  payload?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(@InjectModel(AuditLog) private auditLogModel: typeof AuditLog) {}

  async logAction(dto: CreateAuditLogDto) {
    return this.auditLogModel.create({ ...dto });
  }

  async findAll(page = 1, limit = 10, filters: any = {}) {
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.action) whereClause.action = filters.action;
    if (filters.resource) whereClause.resource = filters.resource;

    const { rows, count } = await this.auditLogModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: {
            exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
          },
        },
      ],
    });

    return createPaginatedResponse(rows, count, page, limit);
  }
}
