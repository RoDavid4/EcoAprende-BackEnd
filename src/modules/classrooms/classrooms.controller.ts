import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
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

  @Get()
  @Roles('TEACHER', 'ADMIN')
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
}
