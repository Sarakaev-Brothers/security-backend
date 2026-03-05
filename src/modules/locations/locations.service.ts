import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class LocationsService {
  constructor(
    @Inject(forwardRef(() => GroupsService))
    private groupsService: GroupsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private getGeoKey(groupId: string, userId: string): string {
    return `geo:${groupId}:${userId}`;
  }

  private getGeoIndexKey(groupId: string): string {
    return `geo:index:${groupId}`;
  }

  async updateLocation(
    userId: string,
    data: { groupId: string; version: number; payload: string },
  ) {
    const group = await this.groupsService.findById(data.groupId);

    if (data.version < (group.currentKeyVersion ?? 0)) {
      throw new BadRequestException({
        error: 'KEY_OUTDATED',
        currentKeyVersion: group.currentKeyVersion,
      });
    }

    const geoKey = this.getGeoKey(data.groupId, userId);
    const indexKey = this.getGeoIndexKey(data.groupId);

    await this.redis
      .multi()
      .set(geoKey, data.payload, 'EX', 60)
      .sadd(indexKey, userId)
      .expire(indexKey, 120)
      .exec();

    return { success: true };
  }

  async getGroupLocations(groupId: string): Promise<string[]> {
    const indexKey = this.getGeoIndexKey(groupId);
    const userIds = await this.redis.smembers(indexKey);

    if (userIds.length === 0) return [];

    const keys = userIds.map((userId) => this.getGeoKey(groupId, userId));
    const values = await this.redis.mget(...keys);

    return values.filter((v): v is string => v !== null);
  }

  async onGroupLeave(groupId: string, userId: string) {
    await this.redis
      .multi()
      .srem(this.getGeoIndexKey(groupId), userId)
      .del(this.getGeoKey(groupId, userId))
      .exec();
  }
}
