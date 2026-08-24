import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { Module as CourseModule } from '../courses/module.entity';
import { Lesson } from '../courses/lesson.entity';
import { Quiz } from '../quizzes/quiz.entity';
import { Classroom } from '../classrooms/classroom.entity';
import { StudentProgress } from '../courses/student-progress.entity';
import { Role } from '../roles/role.entity';
import { Badge } from '../gamification/badge.entity';
import { UserBadge } from '../gamification/user-badge.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Op } from 'sequelize';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Course) private courseModel: typeof Course,
    @InjectModel(CourseModule) private moduleModel: typeof CourseModule,
    @InjectModel(Lesson) private lessonModel: typeof Lesson,
    @InjectModel(Quiz) private quizModel: typeof Quiz,
    @InjectModel(Classroom) private classroomModel: typeof Classroom,
    @InjectModel(StudentProgress)
    private studentProgressModel: typeof StudentProgress,
    @InjectModel(Badge) private badgeModel: typeof Badge,
    @InjectModel(UserBadge) private userBadgeModel: typeof UserBadge,
    @InjectModel(Role) private roleModel: typeof Role,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getUsers(page = 1, limit = 10, filters: any = {}) {
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;

    const includeRoleClause: any = { model: Role };
    if (filters.role) includeRoleClause.where = { name: filters.role };

    if (filters.search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const { rows, count } = await this.userModel.findAndCountAll({
      where: whereClause,
      include: [includeRoleClause],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
      },
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async updateUserStatus(
    adminId: string,
    userId: string,
    isActive: boolean,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (adminId === userId) {
      throw new BadRequestException(
        'Un administrador no puede cambiar su propio estado.',
      );
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = isActive;
    await user.save();

    await this.auditLogsService.logAction({
      userId: adminId,
      action: 'USER_STATUS_UPDATED',
      resource: 'users',
      resourceId: userId,
      payload: { isActive },
      ipAddress,
      userAgent,
    });

    return user;
  }

  async updateUserRole(
    adminId: string,
    userId: string,
    dto: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let role: Role | null = null;

    if (dto.roleId) {
      role = await this.roleModel.findByPk(dto.roleId);
    } else {
      const targetRoleName = (
        dto.role ||
        dto.name ||
        dto.roleName ||
        ''
      ).toUpperCase();
      if (!targetRoleName) {
        throw new BadRequestException(
          'Debe proporcionar un rol válido (STUDENT, TEACHER, ADMIN)',
        );
      }
      role = await this.roleModel.findOne({ where: { name: targetRoleName } });
    }

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    user.roleId = role.id;
    await user.save();

    await this.auditLogsService.logAction({
      userId: adminId,
      action: 'USER_ROLE_UPDATED',
      resource: 'users',
      resourceId: userId,
      payload: { role: role.name, roleId: role.id },
      ipAddress,
      userAgent,
    });

    return user;
  }

  async getGlobalStats() {
    // Users
    const totalUsers = await this.userModel.count();
    const activeUsers = await this.userModel.count({
      where: { isActive: true },
    });
    const inactiveUsers = totalUsers - activeUsers;

    // Roles breakdown
    const roles = await this.roleModel.findAll();
    const usersByRole = await Promise.all(
      roles.map(async (role) => {
        const count = await this.userModel.count({
          where: { roleId: role.id },
        });
        return { role: role.name, count };
      }),
    );

    // Courses
    const totalCourses = await this.courseModel.count();
    const activeCourses = await this.courseModel.count({
      where: { isActive: true },
    });
    const publishedCourses = await this.courseModel.count({
      where: { status: 'PUBLISHED' },
    });
    const totalModules = await this.moduleModel.count();
    const totalLessons = await this.lessonModel.count();
    const totalQuizzes = (await this.quizModel?.count()) || 0;

    // Classrooms
    const totalClassrooms = await this.classroomModel.count();
    const avgStudentsPerClassroom =
      totalClassrooms > 0
        ? Number((totalUsers / totalClassrooms).toFixed(2))
        : 0;

    // Gamification & Engagement
    const totalXp = await this.userModel.sum('totalXp');
    const totalBadgesGranted = (await this.userBadgeModel?.count()) || 0;
    const totalLessonsCompleted = await this.studentProgressModel.sum(
      'completedLessonsCount',
    );
    const totalQuizzesPassed = await this.userModel.sum('quizzesPassed');

    return {
      users: {
        total: totalUsers ?? 0,
        active: activeUsers ?? 0,
        inactive: inactiveUsers ?? 0,
        byRole: usersByRole,
      },
      courses: {
        total: totalCourses ?? 0,
        active: activeCourses ?? 0,
        published: publishedCourses ?? 0,
        modules: totalModules ?? 0,
        lessons: totalLessons ?? 0,
        quizzes: totalQuizzes ?? 0,
      },
      classrooms: {
        total: totalClassrooms ?? 0,
        avgStudentsPerClassroom,
      },
      gamification: {
        totalXp: totalXp ?? 0,
        totalBadgesGranted: totalBadgesGranted ?? 0,
      },
      engagement: {
        totalLessonsCompleted: totalLessonsCompleted ?? 0,
        totalQuizzesPassed: totalQuizzesPassed ?? 0,
      },
    };
  }
}
