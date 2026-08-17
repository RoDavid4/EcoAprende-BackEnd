import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { SubmitMissionDto } from './dto/submit-mission.dto';
import { ReviewMissionDto } from './dto/review-mission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('missions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createMissionDto: CreateMissionDto, @Request() req: any) {
    return this.missionsService.create(createMissionDto, req.user.id);
  }

  @Get()
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  findAll() {
    return this.missionsService.findAll();
  }

  // --- Entregas y Revisiones ---
  
  @Get('submissions/my-submissions')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getMySubmissions(@Request() req: any) {
    return this.missionsService.getMySubmissions(req.user.id);
  }

  @Patch('submissions/:submissionId/review')
  @Roles('TEACHER', 'ADMIN')
  reviewSubmission(
    @Param('submissionId') submissionId: string,
    @Body() reviewMissionDto: ReviewMissionDto,
    @Request() req: any,
  ) {
    return this.missionsService.reviewSubmission(submissionId, req.user.id, reviewMissionDto);
  }

  // --- /Entregas y Revisiones ---

  @Get(':id')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.missionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateMissionDto: UpdateMissionDto) {
    return this.missionsService.update(id, updateMissionDto);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.missionsService.remove(id);
  }

  @Post(':id/submit')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  submitMission(@Param('id') id: string, @Body() submitMissionDto: SubmitMissionDto, @Request() req: any) {
    return this.missionsService.submitMission(id, req.user.id, submitMissionDto);
  }

  @Get(':id/submissions')
  @Roles('TEACHER', 'ADMIN')
  getSubmissionsForMission(@Param('id') id: string) {
    return this.missionsService.getSubmissionsForMission(id);
  }
}
