import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    private jwtService: JwtService,
    private readonly gamificationService: GamificationService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new ConflictException('El email ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const defaultRole = await this.roleModel.findOne({ where: { name: 'STUDENT' } });

    const user = await this.userModel.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      password: hashedPassword,
      roleId: defaultRole?.id,
    });

    if (defaultRole && defaultRole.name === 'STUDENT') {
      await this.gamificationService.awardBadge(user.id, 'WELCOME');
    }

    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ 
      where: { email: loginDto.email },
      include: [Role]
    });
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = { id: user.id, email: user.email, role: user.role?.name };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role?.name,
      }
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ where: { email: forgotPasswordDto.email } });
    
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Expira en 1 hora

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();

      console.log(`[DEV] Token de recuperacion para ${user.email}: ${resetToken}`);
      return { 
        message: 'Si el correo electronico existe en nuestra base de datos, recibiras un enlace de recuperacion pronto.',
        devToken: resetToken 
      };
    }

    return { message: 'Si el correo electronico existe en nuestra base de datos, recibiras un enlace de recuperacion pronto.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    
    const user = await this.userModel.findOne({ where: { resetPasswordToken: token } });
    
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('El token es invalido o ha expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
