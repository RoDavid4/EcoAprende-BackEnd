import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createLessonDto: CreateLessonDto, @Request() req: any) {
    return this.lessonsService.create(createLessonDto, req.user);
  }

  @Get()
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findAll(@Request() req: any) {
    return this.lessonsService.findAll(req.user);
  }

  @Get(':id')
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.lessonsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Request() req: any,
  ) {
    return this.lessonsService.update(id, updateLessonDto, req.user);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.lessonsService.remove(id, req.user);
  }

  @Post(':id/complete')
  @Roles('STUDENT')
  complete(@Param('id') id: string, @Request() req: any) {
    return this.lessonsService.complete(id, req.user);
  }
}
