import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/user.entity';
import { Role } from '../../modules/roles/role.entity';
import { Course } from '../../modules/courses/course.entity';
import { Module } from '../../modules/courses/module.entity';
import { Lesson } from '../../modules/courses/lesson.entity';
import { Quiz } from '../../modules/quizzes/quiz.entity';
import { Question } from '../../modules/quizzes/question.entity';
import { Option } from '../../modules/quizzes/option.entity';
import { Classroom } from '../../modules/classrooms/classroom.entity';
import { ClassroomStudent } from '../../modules/classrooms/classroom-student.entity';
import { ClassroomModule } from '../../modules/classrooms/classroom-module.entity';
import { Badge } from '../../modules/gamification/badge.entity';
import { UserBadge } from '../../modules/gamification/user-badge.entity';
import { LessonProgress } from '../../modules/courses/lesson-progress.entity';
import { QuizAttempt } from '../../modules/quizzes/quiz-attempt.entity';
import { AuditLog } from '../../modules/audit-logs/audit-log.entity';
import { Mission } from '../../modules/missions/mission.entity';
import { MissionSubmission } from '../../modules/missions/mission-submission.entity';

async function bootstrap() {
  console.log('🌱 Iniciando script de Seed...');

  // Inicializamos el contexto de NestJS para asegurar que Sequelize y todos los modelos estén cargados
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log(' Limpiando base de datos...');

    // Eliminamos datos en cascada o de forma directa
    await AuditLog.destroy({ where: {} });
    await MissionSubmission.destroy({ where: {} });
    await Mission.destroy({ where: {} });
    await LessonProgress.destroy({ where: {} });
    await QuizAttempt.destroy({ where: {} });
    await UserBadge.destroy({ where: {} });
    await ClassroomStudent.destroy({ where: {} });
    await ClassroomModule.destroy({ where: {} });
    await Classroom.destroy({ where: {} });
    await Option.destroy({ where: {} });
    await Question.destroy({ where: {} });
    await Quiz.destroy({ where: {} });
    await Lesson.destroy({ where: {} });
    await Module.destroy({ where: {} });
    await Course.destroy({ where: {} });
    await User.destroy({ where: {} });

    // En EcoAprende, Role y Badge son inicializados por SeederService (roles y badges fundacionales).
    // Nos aseguramos que existan.
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    const teacherRole = await Role.findOne({ where: { name: 'TEACHER' } });
    const studentRole = await Role.findOne({ where: { name: 'STUDENT' } });

    if (!adminRole || !teacherRole || !studentRole) {
      throw new Error(
        ' Roles no encontrados. Ejecuta el backend al menos una vez para que SeederService los cree.',
      );
    }

    const firstLessonBadge = await Badge.findOne({
      where: { code: 'FIRST_LESSON' },
    });

    console.log(' Creando usuarios...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const teacherPassword = await bcrypt.hash('Teacher123!', 10);
    const studentPassword = await bcrypt.hash('Student123!', 10);

    const admin = await User.create({
      fullName: 'Admin General',
      email: 'admin@ecoaprende.com',
      password: adminPassword,
      roleId: adminRole.id,
      isActive: true,
    });

    const teacher1 = await User.create({
      fullName: 'Profesor Martinez',
      email: 'profesor.martinez@ecoaprende.com',
      password: teacherPassword,
      roleId: teacherRole.id,
      isActive: true,
    });

    const teacher2 = await User.create({
      fullName: 'Profesora Garcia',
      email: 'profesora.garcia@ecoaprende.com',
      password: teacherPassword,
      roleId: teacherRole.id,
      isActive: true,
    });

    const students = await User.bulkCreate(
      [
        {
          fullName: 'Juan Perez',
          email: 'juan.perez@student.com',
          password: studentPassword,
          roleId: studentRole.id,
          totalXp: 150,
          level: 2,
          currentStreak: 3,
          quizzesPassed: 1,
          lessonsCompleted: 5,
        },
        {
          fullName: 'Ana Gomez',
          email: 'ana.gomez@student.com',
          password: studentPassword,
          roleId: studentRole.id,
          totalXp: 320,
          level: 4,
          currentStreak: 5,
          quizzesPassed: 2,
          lessonsCompleted: 10,
        },
        {
          fullName: 'Carlos Lopez',
          email: 'carlos.lopez@student.com',
          password: studentPassword,
          roleId: studentRole.id,
          totalXp: 500,
          level: 5,
          currentStreak: 7,
          quizzesPassed: 3,
          lessonsCompleted: 15,
        },
        {
          fullName: 'Lucia Fernandez',
          email: 'lucia.fernandez@student.com',
          password: studentPassword,
          roleId: studentRole.id,
          totalXp: 50,
          level: 1,
          currentStreak: 1,
          quizzesPassed: 0,
          lessonsCompleted: 2,
        },
        {
          fullName: 'Matias Silva',
          email: 'matias.silva@student.com',
          password: studentPassword,
          roleId: studentRole.id,
          totalXp: 200,
          level: 3,
          currentStreak: 2,
          quizzesPassed: 1,
          lessonsCompleted: 7,
        },
        {
          fullName: 'Sofia Castro',
          email: 'sofia.castro@student.com',
          password: studentPassword,
          roleId: studentRole.id,
          totalXp: 0,
          level: 1,
          currentStreak: 0,
          quizzesPassed: 0,
          lessonsCompleted: 0,
        },
      ],
      { returning: true },
    );

    console.log(' Creando cursos, módulos y lecciones...');
    const course1 = await Course.create({
      title: 'Introducción a la Ecología',
      description:
        'Aprende los conceptos básicos de la ecología y el medio ambiente.',
      status: 'PUBLISHED',
      createdById: teacher1.id,
    });

    const course2 = await Course.create({
      title: 'Reciclaje Avanzado',
      description:
        'Técnicas modernas para la separación y reciclaje de residuos.',
      status: 'PUBLISHED',
      createdById: teacher2.id,
    });

    await Course.create({
      title: 'Energías Renovables',
      description: 'Explorando la energía solar, eólica y más.',
      status: 'DRAFT',
      createdById: teacher1.id,
    });

    const module1 = await Module.create({
      title: 'Conceptos Básicos',
      description: 'Fundamentos',
      order: 1,
      courseId: course1.id,
      isActive: true,
      status: 'PUBLISHED',
    });
    const module2 = await Module.create({
      title: 'Ecosistemas',
      description: 'Tipos de ecosistemas',
      order: 2,
      courseId: course1.id,
      isActive: true,
      status: 'PUBLISHED',
    });
    const module3 = await Module.create({
      title: 'Residuos Sólidos',
      description: 'Gestión de residuos',
      order: 1,
      courseId: course2.id,
      isActive: true,
      status: 'PUBLISHED',
    });
    await Module.create({
      title: 'Compostaje',
      description: 'Hacer abono en casa',
      order: 2,
      courseId: course2.id,
      isActive: true,
      status: 'PUBLISHED',
    });

    await Lesson.bulkCreate([
      {
        title: '¿Qué es la Ecología?',
        content: 'La ecología es la rama de la biología...',
        contentType: 'TEXT',
        order: 1,
        xpReward: 20,
        moduleId: module1.id,
        isActive: true,
      },
      {
        title: 'Historia Ambiental',
        content: 'Breve historia del ambientalismo...',
        contentType: 'TEXT',
        order: 2,
        xpReward: 20,
        moduleId: module1.id,
        isActive: true,
      },
      {
        title: 'Flora y Fauna',
        content: 'Interacciones biológicas...',
        contentType: 'TEXT',
        order: 1,
        xpReward: 30,
        moduleId: module2.id,
        isActive: true,
      },
      {
        title: 'Tipos de Contaminación',
        content: 'Aire, agua, suelo...',
        contentType: 'TEXT',
        order: 2,
        xpReward: 30,
        moduleId: module2.id,
        isActive: true,
      },
      {
        title: 'Regla de las 3R',
        content: 'Reducir, Reutilizar, Reciclar.',
        contentType: 'TEXT',
        order: 1,
        xpReward: 40,
        moduleId: module3.id,
        isActive: true,
      },
      {
        title: 'Microplásticos',
        content: 'El problema invisible...',
        contentType: 'TEXT',
        order: 2,
        xpReward: 40,
        moduleId: module3.id,
        isActive: true,
      },
    ]);

    console.log(' Creando Quizzes...');
    const quiz1 = await Quiz.create({
      title: 'Evaluación de Conceptos Básicos',
      description: 'Demuestra lo que aprendiste.',
      passingScore: 60,
      maxAttempts: 3,
      moduleId: module1.id,
      isActive: true,
    });

    const q1 = await Question.create({
      statement: '¿Qué significa la R de Reducir?',
      order: 1,
      points: 50,
      quizId: quiz1.id,
    });
    const q1Options = await Option.bulkCreate(
      [
        {
          text: 'Comprar menos cosas innecesarias',
          isCorrect: true,
          questionId: q1.id,
        },
        { text: 'Quemar basura', isCorrect: false, questionId: q1.id },
        { text: 'Tirar cosas al río', isCorrect: false, questionId: q1.id },
      ],
      { returning: true },
    );

    const q2 = await Question.create({
      statement: 'La ecología estudia...',
      order: 2,
      points: 50,
      quizId: quiz1.id,
    });
    const q2Options = await Option.bulkCreate(
      [
        { text: 'Los planetas', isCorrect: false, questionId: q2.id },
        {
          text: 'La relación entre los seres vivos y su entorno',
          isCorrect: true,
          questionId: q2.id,
        },
      ],
      { returning: true },
    );

    console.log(' Creando Aulas (Classrooms)...');
    const classroom1 = await Classroom.create({
      name: 'ECO-6TO-A',
      description: 'Clase de ecología 6to grado',
      code: 'ECO6TA',
      teacherId: teacher1.id,
    });
    const classroom2 = await Classroom.create({
      name: 'ECO-ROBOTICA',
      description: 'Club de Robótica y Reciclaje',
      code: 'ECOROB',
      teacherId: teacher2.id,
    });

    await ClassroomModule.bulkCreate([
      { classroomId: classroom1.id, moduleId: module1.id },
      { classroomId: classroom1.id, moduleId: module2.id },
      { classroomId: classroom2.id, moduleId: module3.id },
    ]);

    await ClassroomStudent.bulkCreate([
      { classroomId: classroom1.id, studentId: students[0].id },
      { classroomId: classroom1.id, studentId: students[1].id },
      { classroomId: classroom1.id, studentId: students[2].id },
      { classroomId: classroom1.id, studentId: students[3].id },
      { classroomId: classroom2.id, studentId: students[4].id },
      { classroomId: classroom2.id, studentId: students[5].id },
      { classroomId: classroom2.id, studentId: students[0].id }, // Juan Perez está en ambas
    ]);

    console.log(' Asignando progreso simulado...');
    await QuizAttempt.create({
      userId: students[2].id,
      quizId: quiz1.id,
      score: 100,
      pointsObtained: 100,
      totalPoints: 100,
      isPassed: true,
      attemptNumber: 1,
      answers: [
        {
          questionId: q1.id,
          selectedOptionId: q1Options[0].id,
          isCorrect: true,
        },
        {
          questionId: q2.id,
          selectedOptionId: q2Options[1].id,
          isCorrect: true,
        },
      ],
    });

    await QuizAttempt.create({
      userId: students[1].id,
      quizId: quiz1.id,
      score: 50,
      pointsObtained: 50,
      totalPoints: 100,
      isPassed: false,
      attemptNumber: 1,
      answers: [
        {
          questionId: q1.id,
          selectedOptionId: q1Options[1].id,
          isCorrect: false,
        },
        {
          questionId: q2.id,
          selectedOptionId: q2Options[1].id,
          isCorrect: true,
        },
      ],
    });

    if (firstLessonBadge) {
      await UserBadge.create({
        userId: students[2].id,
        badgeId: firstLessonBadge.id,
      });
      await UserBadge.create({
        userId: students[1].id,
        badgeId: firstLessonBadge.id,
      });
    }

    console.log(' Creando Misiones (Missions)...');
    const mission1 = await Mission.create({
      title: 'Compostaje Domiciliario en Acción',
      description: 'Crea tu propia compostera y documenta el primer mes.',
      type: 'PRACTICAL',
      pointsReward: 80,
      createdById: teacher1.id,
      moduleId: module1.id,
    });
    const mission2 = await Mission.create({
      title: 'Eco-Botellas / Punto Limpio',
      description: 'Llena 3 eco-botellas y llévalas a un punto de acopio.',
      type: 'PRACTICAL',
      pointsReward: 50,
      createdById: teacher1.id,
      moduleId: module2.id,
    });
    const mission3 = await Mission.create({
      title: 'Auditoría de Consumo Eléctrico Familiar',
      description: 'Analiza tu consumo eléctrico y propón mejoras.',
      type: 'DIGITAL',
      pointsReward: 60,
      createdById: teacher2.id,
      moduleId: module3.id,
    });
    await Mission.create({
      title: 'Plantación de Especie Nativa o Huerta Urbana',
      description:
        'Planta al menos una especie nativa en tu hogar o comunidad.',
      type: 'PRACTICAL',
      pointsReward: 100,
      createdById: teacher2.id,
    });

    console.log(' Creando Entregas de Misiones (Submissions)...');
    // Carlos Lopez (student 2, idx 2) - APPROVED
    await MissionSubmission.create({
      missionId: mission1.id,
      userId: students[2].id,
      status: 'APPROVED',
      evidenceText: 'Aquí adjunto fotos de mi nueva compostera.',
      evidenceUrl: 'https://example.com/compostera.jpg',
      feedback: '¡Excelente trabajo, Carlos! Sigue así.',
      reviewedById: teacher1.id,
      reviewedAt: new Date(),
    });

    // Juan Perez (student 0, idx 0) - PENDING
    await MissionSubmission.create({
      missionId: mission2.id,
      userId: students[0].id,
      status: 'PENDING',
      evidenceText: 'Ya dejé las botellas en el punto limpio de mi plaza.',
      evidenceUrl: 'https://example.com/botellas.jpg',
    });

    // Ana Gomez (student 1, idx 1) - REJECTED
    await MissionSubmission.create({
      missionId: mission3.id,
      userId: students[1].id,
      status: 'REJECTED',
      evidenceText: 'Creo que consumimos mucho.',
      evidenceUrl: '',
      feedback:
        'Hola Ana, falta el detalle del consumo eléctrico mes a mes como se pidió en las instrucciones.',
      reviewedById: teacher2.id,
      reviewedAt: new Date(),
    });

    console.log(' Creando Logs de Auditoría...');
    await AuditLog.bulkCreate([
      {
        userId: admin.id,
        action: 'COURSE_PUBLISHED',
        resource: 'courses',
        resourceId: course1.id,
        payload: {},
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0',
      },
      {
        userId: admin.id,
        action: 'COURSE_PUBLISHED',
        resource: 'courses',
        resourceId: course2.id,
        payload: {},
        ipAddress: '192.168.1.11',
        userAgent: 'Chrome/91',
      },
      {
        userId: admin.id,
        action: 'USER_STATUS_UPDATED',
        resource: 'users',
        resourceId: students[0].id,
        payload: { isActive: true },
        ipAddress: '192.168.1.12',
        userAgent: 'Safari/14',
      },
      {
        userId: teacher1.id,
        action: 'CLASSROOM_CREATED',
        resource: 'classrooms',
        resourceId: classroom1.id,
        payload: {},
        ipAddress: '127.0.0.1',
        userAgent: 'PostmanRuntime/7.28.0',
      },
      {
        userId: teacher2.id,
        action: 'QUIZ_CREATED',
        resource: 'quizzes',
        resourceId: quiz1.id,
        payload: {},
        ipAddress: '10.0.0.2',
        userAgent: 'curl/7.68.0',
      },
    ]);

    console.log(' Base de datos poblada exitosamente.');
  } catch (error) {
    console.error(' Error ejecutando seed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

void bootstrap();
