# 🔐 Архитектура авторизации (масштабируемая)

## Концепция: **Multi-Provider Auth**

```
User
├── email (unique)
├── password? (nullable) ← для email/password
└── appleId? (nullable)  ← для Apple Sign-In
```

**Идея:** Один пользователь может иметь несколько способов входа.

---

## 📐 Структура Auth Module

```typescript
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts           // Для валидации JWT токена
│   ├── local.strategy.ts         // Для email/password (сейчас)
│   └── apple.strategy.ts         // Для Apple Sign-In (позже)
├── guards/
│   ├── jwt-auth.guard.ts         // Защита endpoints
│   ├── local-auth.guard.ts       // Для login endpoint
│   └── public.guard.ts           // Для публичных endpoints
└── dto/
    ├── register.dto.ts           // { email, password }
    ├── login.dto.ts              // { email, password }
    ├── apple-signin.dto.ts       // { identityToken } (позже)
    └── auth-response.dto.ts      // { accessToken, user }
```

---

## 🎯 План реализации

### Phase 1: Email/Password Auth (сейчас)

#### 1.1 Обновить Prisma Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  
  // Auth providers
  password  String?  // bcrypt hash, nullable для Apple
  appleId   String?  @unique  // для будущей интеграции
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  ownedGroup      Group?       @relation("GroupOwner")
  groupMembership GroupMember?

  @@map("users")
}
```

**Миграция:**
```bash
pnpm prisma migrate dev --name add_auth_providers
```

---

#### 1.2 Auth Service (универсальный)

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';

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
  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }

  // ========== ПОЗЖЕ ДОБАВИМ ==========
  
  // 6. Apple Sign-In (будет добавлено позже)
  async signInWithApple(identityToken: string) {
    // 1. Верифицировать токен через Apple
    const appleUser = await this.verifyAppleToken(identityToken);
    
    // 2. Найти или создать пользователя
    let user = await this.usersService.findByAppleId(appleUser.sub);
    if (!user) {
      user = await this.usersService.create({
        email: appleUser.email,
        appleId: appleUser.sub,
        // password = null для Apple users
      });
    }
    
    // 3. Сгенерировать JWT
    const accessToken = this.generateToken(user.id);
    
    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }
}
```

---

#### 1.3 JWT Strategy (общая для всех провайдеров)

```typescript
// auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user; // Попадёт в request.user
  }
}
```

---

#### 1.4 Auth Controller

```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Публичные endpoints
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Защищённый endpoint (пример)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return req.user;
  }

  // ========== ПОЗЖЕ ДОБАВИМ ==========
  
  @Public()
  @Post('apple')
  async signInWithApple(@Body() dto: AppleSignInDto) {
    return this.authService.signInWithApple(dto.identityToken);
  }
}
```

---

#### 1.5 DTOs с валидацией

```typescript
// auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// auth/dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// auth/dto/auth-response.dto.ts
export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
}
```

---

#### 1.6 Guards

```typescript
// auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

---

#### 1.7 Auth Module

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 🔄 Как добавить Apple Sign-In позже

### Шаг 1: Добавить зависимости

```bash
pnpm add apple-signin-auth
```

### Шаг 2: Добавить Apple Strategy

```typescript
// auth/strategies/apple.strategy.ts
import { Injectable } from '@nestjs/common';
import appleSignIn from 'apple-signin-auth';

@Injectable()
export class AppleAuthService {
  async verifyToken(identityToken: string) {
    const appleUser = await appleSignIn.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID,
      // дополнительные настройки
    });
    
    return {
      sub: appleUser.sub,
      email: appleUser.email,
    };
  }
}
```

### Шаг 3: Обновить AuthService

Просто раскомментировать метод `signInWithApple()` — он уже готов! ✅

---

## 🔐 Глобальная защита с исключениями

```typescript
// app.module.ts
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Все endpoints защищены по умолчанию
    },
  ],
})
export class AppModule {}

// Публичные endpoints помечаются @Public()
@Public()
@Post('auth/login')
async login() { ... }
```

---

## 📦 Dependencies для установки

```bash
pnpm add @nestjs/jwt @nestjs/passport @nestjs/config passport passport-jwt bcrypt class-validator class-transformer
pnpm add -D @types/passport-jwt @types/bcrypt
```

---

## 🧪 Тестирование через Postman

### 1. Register
```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxxx...",
    "email": "test@example.com",
    "createdAt": "2026-01-23T..."
  }
}
```

### 2. Login
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. Get Profile (защищённый endpoint)
```http
GET http://localhost:3000/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Преимущества такой архитектуры

1. **Масштабируемость** — легко добавить новые провайдеры (Google, Facebook)
2. **Единый JWT токен** — работает для всех методов auth
3. **Nullable поля** — `password?` и `appleId?` позволяют иметь разные способы входа
4. **Чистый код** — отделение strategies от бизнес-логики
5. **Безопасность** — bcrypt + JWT best practices

---

## 🚀 Порядок действий

1. Обновить Prisma schema (добавить `password`)
2. Создать DatabaseModule + PrismaService
3. Создать UsersModule (repository, service, controller)
4. Создать AuthModule (service, controller, JWT strategy, guards, DTOs)
5. Установить все зависимости
6. Настроить ConfigModule для JWT
