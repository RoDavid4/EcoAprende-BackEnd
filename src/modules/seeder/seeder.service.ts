import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../roles/role.entity';
import { Permission } from '../roles/permission.entity';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permissionModel: typeof Permission,
    @InjectModel(User) private userModel: typeof User,
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

    // Seed default users
    const adminRole = await this.roleModel.findOne({ where: { name: 'ADMIN' } });
    const teacherRole = await this.roleModel.findOne({ where: { name: 'TEACHER' } });

    if (adminRole) {
      const adminPassword = await bcrypt.hash('Admin123!', 10);
      await this.userModel.findOrCreate({
        where: { email: 'admin@ecoaprende.com' },
        defaults: {
          fullName: 'Administrador General',
          email: 'admin@ecoaprende.com',
          password: adminPassword,
          roleId: adminRole.id,
        },
      });
    }

    if (teacherRole) {
      const teacherPassword = await bcrypt.hash('Profe123!', 10);
      await this.userModel.findOrCreate({
        where: { email: 'profe@ecoaprende.com' },
        defaults: {
          fullName: 'Profesor EcoAprende',
          email: 'profe@ecoaprende.com',
          password: teacherPassword,
          roleId: teacherRole.id,
        },
      });
    }

    console.log('Seeder finished.');
  }
}
