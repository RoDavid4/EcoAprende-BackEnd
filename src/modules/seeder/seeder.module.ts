import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [RolesModule, UsersModule, GamificationModule],
  providers: [SeederService],
})
export class SeederModule {}
