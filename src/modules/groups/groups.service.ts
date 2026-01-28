import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class GroupsService {
  constructor(
    private groupsRepository: GroupsRepository,
    @Inject(forwardRef(() => SubscriptionsService))
    private subscriptionsService: SubscriptionsService,
  ) {}

  async getMyGroup(userId: string) {
    const group = await this.groupsRepository.findByOwnerId(userId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async createGroup(ownerId: string) {
    const existingGroup = await this.groupsRepository.findByOwnerId(ownerId);
    if (existingGroup) {
      throw new BadRequestException('User already has a group');
    }

    const subscription =
      await this.subscriptionsService.findActiveSubscriptionByUserId(ownerId);
    if (!subscription || !subscription.planId) {
      throw new BadRequestException(
        'User does not have an active subscription',
      );
    }

    const group = await this.groupsRepository.create({
      ownerId,
      planId: subscription.planId,
    });

    await this.subscriptionsService.attachGroupToActiveSubscription(
      ownerId,
      group.id,
    );

    return group;
  }

  async deleteGroup(groupId: string) {
    try {
      return await this.groupsRepository.delete(groupId);
    } catch {
      throw new NotFoundException('Something went wrong');
    }
  }

  async removeMember(groupId: string, memberId: string, ownerId: string) {
    if (memberId === ownerId) {
      throw new BadRequestException('Owner cannot remove themselves');
    }

    try {
      return await this.groupsRepository.deleteMember(groupId, memberId);
    } catch {
      throw new NotFoundException('Something went wrong');
    }
  }

  async setGroupActive(groupId: string, isActive: boolean) {
    return this.groupsRepository.update(groupId, { isActive });
  }
}
