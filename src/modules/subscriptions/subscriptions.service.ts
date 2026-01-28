import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';
import { GroupsService } from '../groups/groups.service';
import { PlansService } from '../plans/plans.service';
import { AppleIapService } from './services/apple-iap.service';
import { SubscriptionStatus } from 'generated/prisma';

@Injectable()
export class SubscriptionsService {
  constructor(
    private subscriptionsRepository: SubscriptionsRepository,
    @Inject(forwardRef(() => GroupsService))
    private groupsService: GroupsService,
    private plansService: PlansService,
    private appleIapService: AppleIapService,
  ) {}

  async verifyPurchase(userId: string, transactionId: string, planId: string) {
    const plan = await this.plansService.getById(planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const transaction = await this.appleIapService.verifyTransaction(
      transactionId,
      plan.appleProductId,
    );

    if (transaction.productId !== plan.appleProductId) {
      throw new BadRequestException(
        'Transaction product ID does not match plan',
      );
    }

    const existingTransaction =
      await this.subscriptionsRepository.findByTransactionId(transactionId);
    if (existingTransaction) {
      await this.syncGroupActiveStatus(existingTransaction);
      return existingTransaction;
    }

    const existingSubscription =
      await this.subscriptionsRepository.findByOriginalTransactionId(
        transaction.originalTransactionId,
      );

    if (existingSubscription && existingSubscription.userId !== userId) {
      throw new BadRequestException('Transaction belongs to another user');
    }

    if (existingSubscription) {
      const updatedSubscription = await this.subscriptionsRepository.update(
        existingSubscription.id,
        {
          appleTransactionId: transaction.transactionId,
          status: 'ACTIVE',
          expiresAt: transaction.expiresDate,
        },
      );
      await this.syncGroupActiveStatus(updatedSubscription);
      return updatedSubscription;
    }

    const subscription = await this.subscriptionsRepository.create({
      userId,
      planId,
      appleTransactionId: transaction.transactionId,
      appleOriginalTransactionId: transaction.originalTransactionId,
      status: 'ACTIVE',
      expiresAt: transaction.expiresDate,
    });

    await this.syncGroupActiveStatus(subscription);
    return subscription;
  }

  async getMySubscription(userId: string) {
    const subscription =
      await this.subscriptionsRepository.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async updateSubscription(
    id: string,
    data: { status?: SubscriptionStatus; expiresAt?: Date },
  ) {
    const subscription =
      await this.subscriptionsRepository.findByTransactionId(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updatedSubscription = await this.subscriptionsRepository.update(
      subscription.id,
      {
        status: data.status,
        expiresAt: data.expiresAt,
      },
    );

    await this.syncGroupActiveStatus(updatedSubscription);
    return updatedSubscription;
  }

  async findActiveSubscriptionByUserId(userId: string) {
    const subscription =
      await this.subscriptionsRepository.findByUserId(userId);
    if (!subscription) {
      return null;
    }

    if (
      subscription.status === 'ACTIVE' &&
      subscription.expiresAt <= new Date()
    ) {
      const expiredSubscription = await this.subscriptionsRepository.update(
        subscription.id,
        { status: 'EXPIRED' },
      );
      await this.syncGroupActiveStatus(expiredSubscription);
      return null;
    }

    if (subscription.status !== 'ACTIVE') {
      await this.syncGroupActiveStatus(subscription);
      return null;
    }

    await this.syncGroupActiveStatus(subscription);
    return subscription;
  }

  async attachGroupToActiveSubscription(userId: string, groupId: string) {
    const subscription = await this.findActiveSubscriptionByUserId(userId);
    if (!subscription) {
      throw new BadRequestException(
        'User does not have an active subscription',
      );
    }

    return this.subscriptionsRepository.update(subscription.id, { groupId });
  }

  private async syncGroupActiveStatus(subscription: {
    groupId: string | null;
    status: SubscriptionStatus;
    expiresAt: Date;
  }) {
    if (!subscription.groupId) {
      return;
    }

    const isActive =
      subscription.status === 'ACTIVE' && subscription.expiresAt > new Date();
    await this.groupsService.setGroupActive(subscription.groupId, isActive);
  }
}
