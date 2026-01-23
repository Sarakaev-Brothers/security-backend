import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 1. Регистрация через email/password
  async register(dto: RegisterDto) {
    // Проверить, существует ли пользователь
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User already exists');
    }

    // Хэшировать пароль
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Создать пользователя
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
    });

    // Сгенерировать токен
    const accessToken = this.generateToken(user.id);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  // 2. Логин через email/password
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user.id);

    return {
      accessToken,
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

  // 4. Генерация JWT токена
  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
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
