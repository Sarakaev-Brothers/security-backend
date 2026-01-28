import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PlansService } from './plans.service';
import { PlansRepository } from './plans.repository';
import { PlansController } from './plans.controller';

@Module({
  imports: [DatabaseModule],
  providers: [PlansService, PlansRepository],
  controllers: [PlansController],
  exports: [PlansService],
})
export class PlansModule {}
