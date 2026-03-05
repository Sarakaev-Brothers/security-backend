import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LocationsService } from '../locations/locations.service';
import * as crypto from 'crypto';

@Injectable()
export class GroupsService {
  constructor(
    private groupsRepository: GroupsRepository,
    @Inject(forwardRef(() => SubscriptionsService))
    private subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => LocationsService))
    private locationsService: LocationsService,
  ) {}

  private calculateMembersHash(memberIds: string[]): string {
    return crypto
      .createHash('sha256')
      .update(memberIds.sort().join(','))
      .digest('hex');
  }

  async getMyGroup(userId: string) {
    const group = await this.groupsRepository.findByMemberId(userId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async findById(id: string) {
    const group = await this.groupsRepository.findById(id);
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

    const membersHash = this.calculateMembersHash([ownerId]);
    await this.groupsRepository.update(group.id, { membersHash });

    await this.subscriptionsService.attachGroupToActiveSubscription(
      ownerId,
      group.id,
    );

    return group;
  }

  async inviteUsers(groupId: string, userIds: string[]) {
    await this.groupsRepository.addMembers(groupId, userIds);
    const allMemberIds =
      await this.groupsRepository.findGroupMemberIds(groupId);
    const membersHash = this.calculateMembersHash(allMemberIds);
    return this.groupsRepository.update(groupId, { membersHash });
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

    await this.groupsRepository.deleteMember(groupId, memberId);

    await this.locationsService.onGroupLeave(groupId, memberId);

    const allMemberIds =
      await this.groupsRepository.findGroupMemberIds(groupId);
    const membersHash = this.calculateMembersHash(allMemberIds);
    await this.groupsRepository.update(groupId, { membersHash });

    return { success: true };
  }

  async setGroupActive(groupId: string, isActive: boolean) {
    return this.groupsRepository.update(groupId, { isActive });
  }

  async getMembersPublicKeys(groupId: string) {
    return this.groupsRepository.findMembersPublicKeys(groupId);
  }

  async updateGroupKeys(
    groupId: string,
    version: number,
    keys: Record<string, string>,
  ) {
    return this.groupsRepository.updateKeys(groupId, version, keys);
  }

  async getUserKey(groupId: string, userId: string) {
    const group = await this.groupsRepository.findById(groupId);
    if (!group || group.currentKeyVersion === null) {
      throw new NotFoundException('Group or key version not found');
    }

    const key = await this.groupsRepository.findUserKey(
      groupId,
      userId,
      group.currentKeyVersion,
    );
    if (!key) {
      throw new NotFoundException('Key for user not found');
    }

    return key;
  }
}
