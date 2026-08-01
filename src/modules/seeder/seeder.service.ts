import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../roles/role.entity';
import { Permission } from '../roles/permission.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permissionModel: typeof Permission,
  ) {}

  async onModuleInit() {
    console.log('Running automatic seeder...');
    
    const roles = [
      { name: 'ADMIN', description: 'Administrator with full access' },
      { name: 'TEACHER', description: 'Teacher role' },
      { name: 'STUDENT', description: 'Student role' },
    ];

    for (const roleData of roles) {
      await this.roleModel.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData,
      });
    }

    console.log('Seeder finished.');
  }
}
