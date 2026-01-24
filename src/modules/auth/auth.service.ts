import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from 'src/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'generated/prisma/client';
import { BCRYPT_SALT_ROUNDS } from 'src/config/auth.constants';
import {
  hashRefreshToken,
  generateRandomToken,
} from 'src/common/utils/crypto.utils';
import { EnvConfig } from 'src/config/env.config';
import { formatMs } from 'src/common/utils/format.utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private env: EnvConfig,
  ) {}

  // 1. Регистрация через email/password
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

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

    await this.revokeAllTokensForUser(user.id);

    const tokens = await this.generateTokens(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.env.JWT_REFRESH_SECRET,
    );

    return await this.prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.refreshToken.findFirst({
        where: { token: tokenHash },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!tokenRecord.isActive || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      if (tokenRecord.isConsumed && !tokenRecord.isActive) {
        await tx.refreshToken.updateMany({
          where: { userId: tokenRecord.userId },
          data: { isActive: false },
        });
        throw new UnauthorizedException(
          'Token reuse detected. All sessions revoked.',
        );
      }

      const expiresAt = new Date();
      expiresAt.setDate(
        expiresAt.getDate() + this.env.JWT_REFRESH_EXPIRES_IN_DAYS,
      );

      const newRefreshToken = generateRandomToken();
      const newHash = hashRefreshToken(
        newRefreshToken,
        this.env.JWT_REFRESH_SECRET,
      );

      await tx.refreshToken.create({
        data: {
          token: newHash,
          userId: tokenRecord.userId,
          parentId: tokenRecord.id,
          isActive: true,
          isConsumed: false,
          expiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isConsumed: true },
      });

      if (tokenRecord.parentId) {
        const grandparent = await tx.refreshToken.findUnique({
          where: { id: tokenRecord.parentId },
        });

        if (grandparent?.isActive) {
          await tx.refreshToken.update({
            where: { id: grandparent.id },
            data: { isActive: false },
          });
        }
      }

      const accessToken = this.generateAccessToken(tokenRecord.userId);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  private async generateTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(userId: string): string {
    return this.jwtService.sign({
      sub: userId,
      type: 'access',
      expiresIn: formatMs(this.env.JWT_ACCESS_EXPIRES_IN, 'm'),
    });
  }

  // 7. Генерация и сохранение refresh token (долгоживущий)
  private async generateRefreshToken(userId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.env.JWT_REFRESH_EXPIRES_IN_DAYS,
    );

    const randomToken = generateRandomToken();
    const tokenHash = hashRefreshToken(
      randomToken,
      this.env.JWT_REFRESH_SECRET,
    );

    await this.prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId,
        isActive: true,
        isConsumed: false,
        expiresAt,
      },
    });

    await this.cleanupExpiredTokens(userId);

    return randomToken;
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

  // 9. Отзыв всех токенов пользователя (при обнаружении reuse)
  private async revokeAllTokensForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isActive: false },
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
