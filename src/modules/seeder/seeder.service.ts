import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../roles/role.entity';
import { Permission } from '../roles/permission.entity';
import { User } from '../users/user.entity';
import { Badge } from '../gamification/badge.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permissionModel: typeof Permission,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Badge) private badgeModel: typeof Badge,
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
    const adminRole = await this.roleModel.findOne({
      where: { name: 'ADMIN' },
    });
    const teacherRole = await this.roleModel.findOne({
      where: { name: 'TEACHER' },
    });

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

    // Seed Badges
    const defaultBadges = [
      {
        code: 'WELCOME',
        name: 'Semilla Curiosa',
        description: 'Otorgada por unirte a EcoAprende.',
        iconUrl: 'sparkles',
        xpValue: 20,
        category: 'SPECIAL',
        triggerEvent: 'TOTAL_XP',
        triggerValue: 0,
      },
      {
        code: 'FIRST_LESSON',
        name: 'Primeros Brotes',
        description: 'Otorgada por completar tu primera lección.',
        iconUrl: 'book-open',
        xpValue: 50,
        category: 'ACADEMIC',
        triggerEvent: 'LESSONS_COMPLETED',
        triggerValue: 1,
      },
      {
        code: 'STREAK_3',
        name: 'Constancia Verde',
        description: 'Otorgada por ingresar 3 días seguidos.',
        iconUrl: 'flame',
        xpValue: 100,
        category: 'STREAK',
        triggerEvent: 'STREAK',
        triggerValue: 3,
      },
      {
        code: 'ECO_HERO',
        name: 'Héroe Ambiental',
        description: 'Otorgada por completar tu primera misión práctica.',
        iconUrl: 'recycle',
        xpValue: 150,
        category: 'COMMUNITY',
        triggerEvent: 'MISSIONS_APPROVED',
        triggerValue: 1,
      },
    ];

    for (const badge of defaultBadges) {
      await this.badgeModel.findOrCreate({
        where: { code: badge.code },
        defaults: badge,
      });
    }

    console.log('Seeder finished.');
  }
}
