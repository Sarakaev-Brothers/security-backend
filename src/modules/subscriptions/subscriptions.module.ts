import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionsController } from './subscriptions.controller';
import { GroupsModule } from '../groups/groups.module';
import { PlansModule } from '../plans/plans.module';
import { AppleIapService } from './services/apple-iap.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => GroupsModule), PlansModule],
  providers: [SubscriptionsService, SubscriptionsRepository, AppleIapService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
