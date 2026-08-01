import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';

@Module({
  imports: [SequelizeModule.forFeature([Role, Permission, RolePermission])],
  exports: [SequelizeModule],
})
export class RolesModule {}
