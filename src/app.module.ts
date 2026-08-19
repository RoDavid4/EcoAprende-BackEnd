import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { RolesModule } from './modules/roles';
import { SeederModule } from './modules/seeder';
import { ClassroomsModule } from './modules/classrooms';
import { CoursesModule } from './modules/courses/courses.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { MissionsModule } from './modules/missions/missions.module';
import { GamificationModule } from './modules/gamification/gamification.module';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'database',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'ecoaprende_db',
      autoLoadModels: true,
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    SeederModule,
    ClassroomsModule,
    CoursesModule,
    QuizzesModule,
    MissionsModule,
    GamificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
