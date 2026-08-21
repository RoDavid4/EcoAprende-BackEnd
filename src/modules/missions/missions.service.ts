import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Mission } from './mission.entity';
import { MissionSubmission } from './mission-submission.entity';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { SubmitMissionDto } from './dto/submit-mission.dto';
import { ReviewMissionDto } from './dto/review-mission.dto';
import { User } from '../users/user.entity';
import { Op } from 'sequelize';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class MissionsService {
  constructor(
    @InjectModel(Mission) private missionModel: typeof Mission,
    @InjectModel(MissionSubmission) private missionSubmissionModel: typeof MissionSubmission,
    private readonly gamificationService: GamificationService,
  ) {}

  async create(createMissionDto: CreateMissionDto, userId: string) {
    return this.missionModel.create({
      ...createMissionDto,
      createdById: userId,
    });
  }

  async findAll() {
    return this.missionModel.findAll({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const mission = await this.missionModel.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      ],
    });
    if (!mission) {
      throw new NotFoundException(`Misión con ID ${id} no encontrada`);
    }
    return mission;
  }

  async update(id: string, updateMissionDto: UpdateMissionDto) {
    const mission = await this.findOne(id);
    return mission.update(updateMissionDto);
  }

  async remove(id: string) {
    const mission = await this.findOne(id);
    return mission.update({ isActive: false });
  }

  // --- Submissions ---

  async submitMission(missionId: string, userId: string, dto: SubmitMissionDto) {
    const mission = await this.findOne(missionId);
    if (!mission.isActive) {
      throw new BadRequestException('La misión no está activa');
    }

    // Check existing submissions
    const existingSubmission = await this.missionSubmissionModel.findOne({
      where: {
        missionId,
        userId,
        status: {
          [Op.in]: ['PENDING', 'APPROVED']
        }
      }
    });

    if (existingSubmission) {
      throw new ConflictException(`Ya tienes una entrega en estado ${existingSubmission.status} para esta misión.`);
    }

    return this.missionSubmissionModel.create({
      missionId,
      userId,
      evidenceText: dto.evidenceText,
      evidenceUrl: dto.evidenceUrl,
      status: 'PENDING',
    });
  }

  async getMySubmissions(userId: string) {
    return this.missionSubmissionModel.findAll({
      where: { userId },
      include: [{ model: Mission, as: 'mission' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async getSubmissionsForMission(missionId: string) {
    // Validate mission exists
    await this.findOne(missionId);

    return this.missionSubmissionModel.findAll({
      where: { missionId },
      include: [{ model: User, as: 'student', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async reviewSubmission(submissionId: string, reviewerId: string, dto: ReviewMissionDto) {
    const submission = await this.missionSubmissionModel.findByPk(submissionId, {
      include: [{ model: Mission, as: 'mission' }],
    });
    if (!submission) {
      throw new NotFoundException(`Entrega con ID ${submissionId} no encontrada`);
    }

    const updatedSubmission = await submission.update({
      status: dto.status,
      feedback: dto.feedback,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    });

    if (dto.status === 'APPROVED') {
      await this.gamificationService.processActivity(submission.userId, 'APPROVE_MISSION', {
        pointsReward: submission.mission.pointsReward,
      });
    }

    return updatedSubmission;
  }
}
