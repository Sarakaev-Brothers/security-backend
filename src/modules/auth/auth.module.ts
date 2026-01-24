import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { EnvModule } from '../../config/env.module';
import { EnvConfig } from '../../config/env.config';
import { formatMs } from 'src/common/utils/format.utils';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvConfig],
      useFactory: (env: EnvConfig) => ({
        secret: env.JWT_SECRET,
        signOptions: {
          expiresIn: formatMs(env.JWT_ACCESS_EXPIRES_IN, 'm'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
