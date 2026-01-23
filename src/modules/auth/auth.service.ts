import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // 1. Регистрация через email/password
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // 2. Логин через email/password
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // 3. Валидация пользователя (для LocalStrategy)
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // 4. Обновление токенов через refresh token
  async refresh(refreshToken: string) {
    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({
      where: { id: tokenData.id },
    });

    const tokens = await this.generateTokens(tokenData.userId);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // 5. Генерация пары токенов (access + refresh)
  private async generateTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  // 6. Генерация access token (короткоживущий)
  private generateAccessToken(userId: string): string {
    const expiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );

    return this.jwtService.sign({
      sub: userId,
      type: 'access',
      expiresIn: expiresIn,
    });
  }

  // 7. Генерация и сохранение refresh token (долгоживущий)
  private async generateRefreshToken(userId: string): Promise<string> {
    const expiresInDays = parseInt(
      this.configService.get('JWT_REFRESH_EXPIRES_IN_DAYS', '30'),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const token = this.jwtService.sign({
      sub: userId,
      type: 'refresh',
      expiresIn: `${expiresInDays}d`,
    });

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    await this.cleanupExpiredTokens(userId);

    return token;
  }

  // 8. Очистка истекших токенов пользователя
  private async cleanupExpiredTokens(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // 5. Удаление sensitive данных
  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  // ========== ПОЗЖЕ ДОБАВИМ ==========

  // 6. Apple Sign-In (будет добавлено позже)
  // async signInWithApple(identityToken: string) {
  //   // 1. Верифицировать токен через Apple
  //   const appleUser = await this.verifyAppleToken(identityToken);
  //
  //   // 2. Найти или создать пользователя
  //   let user = await this.usersService.findByAppleId(appleUser.sub);
  //   if (!user) {
  //     user = await this.usersService.create({
  //       email: appleUser.email,
  //       appleId: appleUser.sub,
  //       // password = null для Apple users
  //     });
  //   }
  //
  //   // 3. Сгенерировать JWT
  //   const accessToken = this.generateToken(user.id);
  //
  //   return {
  //     accessToken,
  //     user: this.sanitizeUser(user),
  //   };
  // }
}
