import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { LocationsService } from './locations.service';
import { LocationsRepository } from './locations.repository';
import { LocationsController } from './locations.controller';
import { GroupsModule } from '../groups/groups.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [DatabaseModule, forwardRef(() => GroupsModule), RedisModule],
  providers: [LocationsService, LocationsRepository],
  controllers: [LocationsController],
  exports: [LocationsService],
})
export class LocationsModule {}
