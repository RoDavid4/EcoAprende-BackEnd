import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createQuizDto: CreateQuizDto, @Request() req: any) {
    return this.quizzesService.create(createQuizDto, req.user);
  }

  @Get()
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findAll(@Request() req: any) {
    return this.quizzesService.findAll(req.user);
  }

  @Get(':id')
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto, @Request() req: any) {
    return this.quizzesService.update(id, updateQuizDto, req.user);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.remove(id, req.user);
  }

  @Post(':id/submit')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  submitQuiz(@Param('id') id: string, @Body() submitQuizDto: SubmitQuizDto, @Request() req: any) {
    return this.quizzesService.submitQuiz(id, req.user.id, submitQuizDto);
  }

  @Get(':id/my-attempts')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getMyAttempts(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.getMyAttempts(id, req.user.id);
  }
}
