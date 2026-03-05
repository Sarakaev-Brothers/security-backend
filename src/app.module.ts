import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlansModule } from './modules/plans/plans.module';
import { GroupsModule } from './modules/groups/groups.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { LocationsModule } from './modules/locations/locations.module';
import { EnvModule } from './config/env.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { EnvConfig } from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    EnvModule,
    RedisModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvConfig],
      useFactory: (config: EnvConfig) => ({
        type: 'single',
        url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,
      }),
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    PlansModule,
    GroupsModule,
    SubscriptionsModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
