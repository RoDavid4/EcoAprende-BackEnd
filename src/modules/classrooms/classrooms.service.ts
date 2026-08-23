import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Classroom } from './classroom.entity';
import { ClassroomStudent } from './classroom-student.entity';
import { User } from '../users/user.entity';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { ClassroomModule as ClassroomModuleEntity } from './classroom-module.entity';
import { Module as CourseModuleEntity } from '../courses/module.entity';
import { AssignModuleDto } from './dto/assign-module.dto';
import { UpdateClassroomModuleDto } from './dto/update-classroom-module.dto';

import { StudentProgress } from '../courses/student-progress.entity';

@Injectable()
export class ClassroomsService {
  constructor(
    @InjectModel(Classroom) private classroomModel: typeof Classroom,
    @InjectModel(ClassroomStudent)
    private classroomStudentModel: typeof ClassroomStudent,
    @InjectModel(ClassroomModuleEntity)
    private classroomModuleModel: typeof ClassroomModuleEntity,
    @InjectModel(CourseModuleEntity)
    private courseModuleModel: typeof CourseModuleEntity,
    @InjectModel(StudentProgress)
    private studentProgressModel: typeof StudentProgress,
  ) {}

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await this.classroomModel.findOne({ where: { code } });
      if (!existing) {
        isUnique = true;
      }
    }
    return code;
  }

  async create(createClassroomDto: CreateClassroomDto, teacherId: string) {
    const code = await this.generateUniqueCode();

    return this.classroomModel.create({
      ...createClassroomDto,
      code,
      teacherId,
    });
  }

  async joinClassroom(joinDto: JoinClassroomDto, studentId: string) {
    const code = joinDto.code.toUpperCase();

    const classroom = await this.classroomModel.findOne({
      where: { code, isActive: true },
    });

    if (!classroom) {
      throw new NotFoundException(
        'El código de aula ingresado no es válido o el aula está inactiva',
      );
    }

    const existingEnrollment = await this.classroomStudentModel.findOne({
      where: { classroomId: classroom.id, studentId },
    });

    if (existingEnrollment) {
      throw new ConflictException('Ya estás inscrito en esta aula');
    }

    await this.classroomStudentModel.create({
      classroomId: classroom.id,
      studentId,
    });

    return classroom;
  }

  async findAll(user: any, includeInactive?: string) {
    const whereClause: any = {};

    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    if (user.role === 'TEACHER') {
      whereClause.teacherId = user.id;
    }

    const includeOptions: any[] = [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'fullName', 'email'],
      },
    ];

    if (user.role === 'STUDENT') {
      includeOptions.push({
        model: User,
        as: 'students',
        where: { id: user.id },
        attributes: [],
        through: { attributes: [] },
      });
    }

    return this.classroomModel.findAll({
      where: whereClause,
      include: includeOptions,
    });
  }

  async findOne(id: string) {
    const classroom = await this.classroomModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: User,
          as: 'students',
          attributes: ['id', 'fullName', 'email'],
          through: { attributes: ['joinedAt'] },
        },
      ],
    });

    if (!classroom) {
      throw new NotFoundException('Aula no encontrada');
    }

    return classroom;
  }

  async update(id: string, updateClassroomDto: UpdateClassroomDto, user: any) {
    const classroom = await this.findOne(id);

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException('No tienes permisos para editar esta aula');
    }

    return classroom.update(updateClassroomDto);
  }

  async remove(id: string, user: any) {
    const classroom = await this.findOne(id);

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta aula',
      );
    }

    return classroom.update({ isActive: false });
  }

  async getStudents(classroomId: string, user: any) {
    const classroom = await this.findOne(classroomId);

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para ver los estudiantes de esta aula',
      );
    }

    return classroom.students;
  }

  async removeStudent(classroomId: string, studentId: string, user: any) {
    const classroom = await this.findOne(classroomId);

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para remover estudiantes de esta aula',
      );
    }

    const enrollment = await this.classroomStudentModel.findOne({
      where: { classroomId, studentId },
    });

    if (!enrollment) {
      throw new NotFoundException('El estudiante no pertenece a esta aula');
    }

    await enrollment.destroy();
    return { message: 'Estudiante removido del aula correctamente' };
  }

  async assignModule(
    classroomId: string,
    assignDto: AssignModuleDto,
    user: any,
  ) {
    const classroom = await this.findOne(classroomId);

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para asignar módulos a esta aula',
      );
    }

    const moduleRecord = await this.courseModuleModel.findOne({
      where: { id: assignDto.moduleId, isActive: true },
    });
    if (!moduleRecord) {
      throw new NotFoundException('Módulo no encontrado');
    }

    const existing = await this.classroomModuleModel.findOne({
      where: { classroomId, moduleId: assignDto.moduleId },
    });

    if (existing) {
      throw new ConflictException('El módulo ya está asignado a esta aula');
    }

    await this.classroomModuleModel.create({
      classroomId,
      moduleId: assignDto.moduleId,
    });

    return { message: 'Módulo asignado correctamente' };
  }

  async getAssignedModules(classroomId: string, user: any) {
    const classroom = await this.classroomModel.findByPk(classroomId, {
      include: [
        {
          model: CourseModuleEntity,
          as: 'modules',
          through: { attributes: ['assignedAt', 'isVisible'] },
        },
        {
          model: User,
          as: 'students',
          attributes: ['id'],
        },
      ],
    });

    if (!classroom) {
      throw new NotFoundException('Aula no encontrada');
    }

    if (user.role === 'STUDENT') {
      const isStudent = classroom.students.some((s) => s.id === user.id);
      if (!isStudent) {
        throw new ForbiddenException('No perteneces a esta aula');
      }

      return classroom.modules.filter(
        (m) => m.isActive && (m as any).ClassroomModule.isVisible,
      );
    }

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para ver los módulos de esta aula',
      );
    }

    return classroom.modules;
  }

  async getClassroomMetrics(classroomId: string, user: any) {
    const classroom = await this.classroomModel.findByPk(classroomId, {
      include: [
        {
          model: User,
          as: 'students',
          attributes: [
            'id',
            'fullName',
            'totalXp',
            'level',
            'currentStreak',
            'lastActivityDate',
          ],
        },
      ],
    });

    if (!classroom) {
      throw new NotFoundException('Aula no encontrada');
    }

    if (user.role === 'TEACHER' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para auditar las métricas de esta aula.',
      );
    }

    const students = classroom.students || [];
    const studentIds = students.map((s) => s.id);

    const courseId = classroom.courseId;

    let progressRecords = [];
    if (studentIds.length > 0) {
      const whereClause: any = { userId: studentIds };
      if (courseId) {
        whereClause.courseId = courseId;
      }
      progressRecords = await this.studentProgressModel.findAll({
        where: whereClause,
      });
    }

    const progressMap = new Map<string, any[]>();
    for (const p of progressRecords) {
      if (!progressMap.has(p.userId)) {
        progressMap.set(p.userId, []);
      }
      progressMap.get(p.userId).push(p);
    }

    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - 7);

    let activeStudentsCount = 0;
    let totalProgressSum = 0;
    let totalXpSum = 0;
    let totalLevelSum = 0;
    let completedStudentsCount = 0;

    const studentMetrics = students.map((student) => {
      const pRecords = progressMap.get(student.id) || [];

      let studentProgress = 0;
      let completedLessons = 0;
      let completedQuizzes = 0;
      let isCompleted = false;

      if (pRecords.length > 0) {
        if (courseId) {
          studentProgress = pRecords[0].percentage;
          completedLessons = pRecords[0].completedLessonsCount;
          completedQuizzes = pRecords[0].completedQuizzesCount;
          isCompleted = pRecords[0].isCompleted;
        } else {
          const sumPercentage = pRecords.reduce(
            (acc, p) => acc + p.percentage,
            0,
          );
          studentProgress = sumPercentage / pRecords.length;
          completedLessons = pRecords.reduce(
            (acc, p) => acc + p.completedLessonsCount,
            0,
          );
          completedQuizzes = pRecords.reduce(
            (acc, p) => acc + p.completedQuizzesCount,
            0,
          );
          isCompleted = pRecords.every((p) => p.isCompleted);
        }
      }

      if (isCompleted && pRecords.length > 0) {
        completedStudentsCount++;
      }

      const isActive =
        student.lastActivityDate &&
        new Date(student.lastActivityDate) >= activeThreshold;
      if (isActive) activeStudentsCount++;

      totalProgressSum += studentProgress;
      totalXpSum += student.totalXp;
      totalLevelSum += student.level;

      return {
        id: student.id,
        firstName: student.fullName.split(' ')[0],
        lastName: student.fullName.split(' ').slice(1).join(' ') || '',
        avatarUrl: null,
        progressPercentage: parseFloat(studentProgress.toFixed(2)),
        isCompleted,
        totalXp: student.totalXp,
        level: student.level,
        currentStreak: student.currentStreak,
        completedLessonsCount: completedLessons,
        completedQuizzesCount: completedQuizzes,
        lastAccessedAt: student.lastActivityDate,
      };
    });

    studentMetrics.sort(
      (a, b) =>
        b.progressPercentage - a.progressPercentage || b.totalXp - a.totalXp,
    );

    const totalStudents = students.length;

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        courseId: classroom.courseId,
      },
      summary: {
        totalStudents,
        activeStudentsCount,
        averageProgress:
          totalStudents > 0
            ? parseFloat((totalProgressSum / totalStudents).toFixed(2))
            : 0,
        averageXp:
          totalStudents > 0 ? Math.round(totalXpSum / totalStudents) : 0,
        averageLevel:
          totalStudents > 0 ? Math.round(totalLevelSum / totalStudents) : 0,
        completedStudentsCount,
      },
      students: studentMetrics,
    };
  }

  async updateModuleVisibility(
    classroomId: string,
    moduleId: string,
    updateDto: UpdateClassroomModuleDto,
    user: any,
  ) {
    const classroom = await this.findOne(classroomId);

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para editar módulos en esta aula',
      );
    }

    const assignment = await this.classroomModuleModel.findOne({
      where: { classroomId, moduleId },
    });

    if (!assignment) {
      throw new NotFoundException('El módulo no está asignado a esta aula');
    }

    if (updateDto.isVisible !== undefined) {
      assignment.isVisible = updateDto.isVisible;
      await assignment.save();
    }

    return assignment;
  }

  async removeModule(classroomId: string, moduleId: string, user: any) {
    const classroom = await this.findOne(classroomId);

    if (user.role !== 'ADMIN' && classroom.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para remover módulos de esta aula',
      );
    }

    const assignment = await this.classroomModuleModel.findOne({
      where: { classroomId, moduleId },
    });

    if (!assignment) {
      throw new NotFoundException('El módulo no está asignado a esta aula');
    }

    await assignment.destroy();
    return { message: 'Módulo desvinculado correctamente' };
  }
}
