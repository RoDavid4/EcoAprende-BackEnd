import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { AssignModuleDto } from './dto/assign-module.dto';
import { UpdateClassroomModuleDto } from './dto/update-classroom-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createClassroomDto: CreateClassroomDto, @Request() req: any) {
    return this.classroomsService.create(createClassroomDto, req.user.id);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @Roles('STUDENT', 'ADMIN')
  join(@Body() joinDto: JoinClassroomDto, @Request() req: any) {
    return this.classroomsService.joinClassroom(joinDto, req.user.id);
  }

  @Get()
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findAll(@Request() req: any, @Query('includeInactive') includeInactive?: string) {
    return this.classroomsService.findAll(req.user, includeInactive);
  }

  @Get(':id')
  @Roles('TEACHER', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateClassroomDto: UpdateClassroomDto, @Request() req: any) {
    return this.classroomsService.update(id, updateClassroomDto, req.user);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.classroomsService.remove(id, req.user);
  }

  @Get(':id/students')
  @Roles('TEACHER', 'ADMIN')
  getStudents(@Param('id') id: string, @Request() req: any) {
    return this.classroomsService.getStudents(id, req.user);
  }

  @Delete(':id/students/:studentId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN')
  removeStudent(
    @Param('id') id: string, 
    @Param('studentId') studentId: string, 
    @Request() req: any
  ) {
    return this.classroomsService.removeStudent(id, studentId, req.user);
  }

  @Post(':id/modules')
  @Roles('TEACHER', 'ADMIN')
  assignModule(@Param('id') id: string, @Body() assignDto: AssignModuleDto, @Request() req: any) {
    return this.classroomsService.assignModule(id, assignDto, req.user);
  }

  @Get(':id/modules')
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  getAssignedModules(@Param('id') id: string, @Request() req: any) {
    return this.classroomsService.getAssignedModules(id, req.user);
  }

  @Patch(':id/modules/:moduleId')
  @Roles('TEACHER', 'ADMIN')
  updateModuleVisibility(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() updateDto: UpdateClassroomModuleDto,
    @Request() req: any
  ) {
    return this.classroomsService.updateModuleVisibility(id, moduleId, updateDto, req.user);
  }

  @Delete(':id/modules/:moduleId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN')
  removeModule(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Request() req: any
  ) {
    return this.classroomsService.removeModule(id, moduleId, req.user);
  }
}
