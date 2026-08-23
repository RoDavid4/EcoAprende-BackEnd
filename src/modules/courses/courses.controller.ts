import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createCourseDto: CreateCourseDto, @Request() req: any) {
    return this.coursesService.create(createCourseDto, req.user.id);
  }

  @Get('progress/me')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getMyProgress(@Request() req: any) {
    return this.coursesService.getStudentProgress(req.user.id);
  }

  @Get('progress/:studentId')
  @Roles('TEACHER', 'ADMIN')
  getStudentProgress(@Param('studentId') studentId: string) {
    return this.coursesService.getStudentProgress(studentId);
  }

  @Get()
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findAll(@Request() req: any) {
    return this.coursesService.findAll(req.user);
  }

  @Get(':id')
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findOne(@Param('id') id: string, @Request() req: any, @Query('includeInactive') includeInactive?: string) {
    const isInactiveRequested = includeInactive === 'true';
    return this.coursesService.findOne(id, req.user, isInactiveRequested);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Request() req: any) {
    return this.coursesService.update(id, updateCourseDto, req.user);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.remove(id, req.user);
  }
}
