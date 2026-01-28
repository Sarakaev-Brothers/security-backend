import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { GroupsController } from './groups.controller';
import { PlansModule } from '../plans/plans.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    DatabaseModule,
    PlansModule,
    UsersModule,
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [GroupsService, GroupsRepository],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
