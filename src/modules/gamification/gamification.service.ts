import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { Transaction, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectModel(Badge) private badgeModel: typeof Badge,
    @InjectModel(UserBadge) private userBadgeModel: typeof UserBadge,
    @InjectModel(User) private userModel: typeof User,
    private sequelize: Sequelize,
  ) {}

  // Nivel = Math.floor(Math.sqrt(totalXp / 100)) + 1
  calculateLevel(totalXp: number): number {
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }

  async awardXp(userId: string, xpPoints: number, transaction?: Transaction) {
    const user = await this.userModel.findByPk(userId, { transaction });
    if (!user) throw new NotFoundException('User not found');

    const newTotalXp = user.totalXp + xpPoints;
    const newLevel = this.calculateLevel(newTotalXp);

    await user.update(
      { totalXp: newTotalXp, level: newLevel },
      { transaction }
    );

    return { totalXp: newTotalXp, level: newLevel, leveledUp: newLevel > user.level };
  }

  async updateStreak(userId: string, transaction?: Transaction) {
    const user = await this.userModel.findByPk(userId, { transaction });
    if (!user) throw new NotFoundException('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
    let newStreak = user.currentStreak;

    if (!lastActivity) {
      newStreak = 1;
    } else {
      const last = new Date(lastActivity);
      last.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // If diffDays === 0, it means same day, keep streak
    }

    await user.update(
      { currentStreak: newStreak, lastActivityDate: today },
      { transaction }
    );

    return newStreak;
  }

  async awardBadge(userId: string, badgeCode: string, transaction?: Transaction) {
    const badge = await this.badgeModel.findOne({ where: { code: badgeCode }, transaction });
    if (!badge) {
      this.logger.warn(`Badge code ${badgeCode} not found.`);
      return null;
    }

    const existingUserBadge = await this.userBadgeModel.findOne({
      where: { userId, badgeId: badge.id },
      transaction,
    });

    if (existingUserBadge) {
      return null; // Already has badge
    }

    const userBadge = await this.userBadgeModel.create(
      { userId, badgeId: badge.id },
      { transaction }
    );

    await this.awardXp(userId, badge.xpValue, transaction);

    return userBadge;
  }

  async checkAutomaticBadges(userId: string, eventType: string, currentValue: number, t?: Transaction) {
    const badgesAwarded: string[] = [];
    const eligibleBadges = await this.badgeModel.findAll({
      where: {
        triggerEvent: eventType,
        triggerValue: { [Op.lte]: currentValue },
        isActive: true,
      },
      transaction: t,
    });

    for (const badge of eligibleBadges) {
      const awarded = await this.awardBadge(userId, badge.code, t);
      if (awarded) {
        badgesAwarded.push(badge.code);
      }
    }

    return badgesAwarded;
  }

  async processActivity(userId: string, actionType: string, metadata?: any) {
    return this.sequelize.transaction(async (t) => {
      const user = await this.userModel.findByPk(userId, { transaction: t });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const streak = await this.updateStreak(userId, t);
      let xpAwarded = 0;
      let badgesAwarded: string[] = [];

      // Award XP and increment counters
      switch (actionType) {
        case 'LOGIN':
          xpAwarded = 10;
          break;
        case 'COMPLETE_LESSON':
          xpAwarded = 25;
          user.lessonsCompleted += 1;
          break;
        case 'PASS_QUIZ':
          xpAwarded = 50;
          user.quizzesPassed += 1;
          break;
        case 'APPROVE_MISSION':
          xpAwarded = metadata?.pointsReward || 100;
          user.missionsApproved += 1;
          break;
      }

      await user.save({ transaction: t });
      if (xpAwarded > 0) {
        await this.awardXp(userId, xpAwarded, t);
      }

      // Check rules engine for newly unlocked badges
      const streakBadges = await this.checkAutomaticBadges(userId, 'STREAK', streak, t);
      badgesAwarded.push(...streakBadges);

      // Re-fetch user to get the updated totalXp after awardXp
      const updatedUser = await this.userModel.findByPk(userId, { transaction: t });
      if (updatedUser) {
        const xpBadges = await this.checkAutomaticBadges(userId, 'TOTAL_XP', updatedUser.totalXp, t);
        badgesAwarded.push(...xpBadges);

        if (actionType === 'COMPLETE_LESSON') {
          const lessonBadges = await this.checkAutomaticBadges(userId, 'LESSONS_COMPLETED', updatedUser.lessonsCompleted, t);
          badgesAwarded.push(...lessonBadges);
        } else if (actionType === 'PASS_QUIZ') {
          const quizBadges = await this.checkAutomaticBadges(userId, 'QUIZZES_PASSED', updatedUser.quizzesPassed, t);
          badgesAwarded.push(...quizBadges);
        } else if (actionType === 'APPROVE_MISSION') {
          const missionBadges = await this.checkAutomaticBadges(userId, 'MISSIONS_APPROVED', updatedUser.missionsApproved, t);
          badgesAwarded.push(...missionBadges);
        }
      }

      return { streak, xpAwarded, badgesAwarded };
    });
  }

  // Controller methods
  async getProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'totalXp', 'level', 'currentStreak', 'lastActivityDate'],
      include: [{
        model: Badge,
        as: 'badges',
        through: { attributes: ['awardedAt'] }
      }]
    });
    return user;
  }

  async getBadges(userId: string) {
    const allBadges = await this.badgeModel.findAll({ where: { isActive: true } });
    const userBadges = await this.userBadgeModel.findAll({ where: { userId } });
    const userBadgeIds = userBadges.map(ub => ub.badgeId);

    return allBadges.map(badge => {
      const plainBadge = badge.get({ plain: true });
      return {
        ...plainBadge,
        isUnlocked: userBadgeIds.includes(badge.id),
      };
    });
  }

  async getLeaderboard() {
    return this.userModel.findAll({
      where: { isActive: true },
      attributes: ['id', 'fullName', 'level', 'totalXp'],
      include: [
        {
          model: Role,
          as: 'role',
          where: { name: 'STUDENT' },
          attributes: [],
        }
      ],
      order: [['totalXp', 'DESC']],
      limit: 20,
    });
  }

  async createBadge(dto: CreateBadgeDto) {
    const existing = await this.badgeModel.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Badge con código ${dto.code} ya existe.`);
    }
    return this.badgeModel.create({ ...dto });
  }
}
