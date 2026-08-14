import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_key',
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.getProfile(payload.id);
      if (!user.isActive) {
        throw new UnauthorizedException('Usuario no válido o inexistente');
      }
      return { id: payload.id, email: payload.email, role: payload.role };
    } catch (error) {
      throw new UnauthorizedException('Usuario no válido o inexistente');
    }
  }
}
