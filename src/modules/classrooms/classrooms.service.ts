import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Classroom } from './classroom.entity';
import { ClassroomStudent } from './classroom-student.entity';
import { User } from '../users/user.entity';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(
    @InjectModel(Classroom) private classroomModel: typeof Classroom,
    @InjectModel(ClassroomStudent) private classroomStudentModel: typeof ClassroomStudent,
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
      throw new NotFoundException('El código de aula ingresado no es válido o el aula está inactiva');
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
      }
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
        }
      ]
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
      throw new ForbiddenException('No tienes permisos para eliminar esta aula');
    }

    return classroom.update({ isActive: false });
  }
}
