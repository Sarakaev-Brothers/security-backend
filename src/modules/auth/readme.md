# 🔐 Authorization Architecture (Scalable)

## Concept: **Multi-Provider Auth**

    User
    ├── email (unique)
    ├── password? (nullable) ← for email/password
    └── appleId? (nullable)  ← for Apple Sign‑In

**Idea:** One user can have multiple login methods.

------------------------------------------------------------------------

## 📐 Auth Module Structure

``` ts
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts           // For validating JWT token
│   ├── local.strategy.ts         // For email/password (current)
│   └── apple.strategy.ts         // For Apple Sign-In (future)
├── guards/
│   ├── jwt-auth.guard.ts         // Protect endpoints
│   ├── local-auth.guard.ts       // For login endpoint
│   └── public.guard.ts           // For public endpoints
└── dto/
    ├── register.dto.ts           // { email, password }
    ├── login.dto.ts              // { email, password }
    ├── apple-signin.dto.ts       // { identityToken } (future)
    └── auth-response.dto.ts      // { accessToken, user }
```

------------------------------------------------------------------------

## 🎯 Implementation Plan

### Phase 1: Email/Password Auth (current)

#### 1.1 Update Prisma Schema

``` prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  
  // Auth providers
  password  String?  // bcrypt hash, nullable for Apple
  appleId   String?  @unique  // for future integration
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  ownedGroup      Group?       @relation("GroupOwner")
  groupMembership GroupMember?

  @@map("users")
}
```

Migration:

``` bash
pnpm prisma migrate dev --name add_auth_providers
```

------------------------------------------------------------------------

#### 1.2 Auth Service (Universal)

``` ts
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

  // 1. Register with email/password
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

    const accessToken = this.generateToken(user.id);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  // 2. Login with email/password
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

  // 3. Validate user (used in LocalStrategy)
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

  // 4. Generate JWT token
  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  // 5. Remove sensitive data
  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }

  // ========== ADD LATER ==========

  // Apple Sign-In
  async signInWithApple(identityToken: string) {
    const appleUser = await this.verifyAppleToken(identityToken);
    
    let user = await this.usersService.findByAppleId(appleUser.sub);
    if (!user) {
      user = await this.usersService.create({
        email: appleUser.email,
        appleId: appleUser.sub,
      });
    }
    
    const accessToken = this.generateToken(user.id);
    
    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }
}
```

------------------------------------------------------------------------

#### 1.3 JWT Strategy (shared across providers)

``` ts
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
    return user;
  }
}
```

------------------------------------------------------------------------

#### 1.4 Auth Controller

``` ts
// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return req.user;
  }

  @Public()
  @Post('apple')
  async signInWithApple(@Body() dto: AppleSignInDto) {
    return this.authService.signInWithApple(dto.identityToken);
  }
}
```

------------------------------------------------------------------------

#### 1.5 DTOs with validation

``` ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

------------------------------------------------------------------------

#### 1.6 Guards

``` ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

``` ts
export const Public = () => SetMetadata('isPublic', true);
```

------------------------------------------------------------------------

#### 1.7 Auth Module

``` ts
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

------------------------------------------------------------------------

## 🔄 Adding Apple Sign-In Later

### Step 1

``` bash
pnpm add apple-signin-auth
```

### Step 2

``` ts
import appleSignIn from 'apple-signin-auth';

@Injectable()
export class AppleAuthService {
  async verifyToken(identityToken: string) {
    const appleUser = await appleSignIn.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID,
    });
    
    return {
      sub: appleUser.sub,
      email: appleUser.email,
    };
  }
}
```

------------------------------------------------------------------------

## 🔐 Global Protection with Exceptions

``` ts
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
]
```

Public endpoints:

``` ts
@Public()
@Post('auth/login')
```

------------------------------------------------------------------------

## 📦 Dependencies

``` bash
pnpm add @nestjs/jwt @nestjs/passport @nestjs/config passport passport-jwt bcrypt class-validator class-transformer
pnpm add -D @types/passport-jwt @types/bcrypt
```

------------------------------------------------------------------------

## 🧪 Postman Testing

### Register

    POST /auth/register

### Login

    POST /auth/login

### Get Profile

    GET /auth/me
    Authorization: Bearer TOKEN

------------------------------------------------------------------------

## ✅ Advantages of This Architecture

1.  Scalable --- easy to add providers (Google, Facebook)
2.  Single JWT system
3.  Flexible auth methods
4.  Clean separation of strategies
5.  Secure password hashing with bcrypt

------------------------------------------------------------------------

## 🚀 Implementation Order

1.  Update Prisma schema
2.  Create DatabaseModule + PrismaService
3.  Create UsersModule
4.  Create AuthModule
5.  Install dependencies
6.  Configure ConfigModule for JWT
