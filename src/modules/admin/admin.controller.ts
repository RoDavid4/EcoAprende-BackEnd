import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AuditLogEntry } from '../../common/decorators/audit-log.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get('audit-logs')
  getAuditLogs(
    @Query() pagination: PaginationDto,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
  ) {
    return this.auditLogsService.findAll(pagination.page, pagination.limit, {
      userId,
      action,
      resource,
    });
  }

  @Get('users')
  getUsers(@Query() filterDto: GetUsersFilterDto) {
    const filters: any = {};
    if (filterDto.role) filters.role = filterDto.role;
    if (filterDto.isActive !== undefined) filters.isActive = filterDto.isActive;
    if (filterDto.search) filters.search = filterDto.search;

    return this.adminService.getUsers(filterDto.page, filterDto.limit, filters);
  }

  @Patch('users/:id/status')
  @UseInterceptors(AuditLogInterceptor)
  @AuditLogEntry({ action: 'USER_STATUS_UPDATED', resource: 'users' })
  updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Request() req: any,
  ) {
    return this.adminService.updateUserStatus(req.user.id, id, isActive);
  }

  @Patch('users/:id/role')
  @UseInterceptors(AuditLogInterceptor)
  @AuditLogEntry({ action: 'USER_ROLE_UPDATED', resource: 'users' })
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.adminService.updateUserRole(req.user.id, id, dto);
  }

  @Get('stats/overview')
  getGlobalStats() {
    return this.adminService.getGlobalStats();
  }
}
