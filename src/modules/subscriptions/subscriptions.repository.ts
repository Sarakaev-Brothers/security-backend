import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionStatus } from 'generated/prisma/client';

@Injectable()
export class SubscriptionsRepository {
  constructor(private prisma: PrismaService) {}

  async findByGroupId(groupId: string) {
    return this.prisma.subscription.findFirst({
      where: { groupId },
      orderBy: { expiresAt: 'desc' },
      select: {
        id: true,
        userId: true,
        planId: true,
        groupId: true,
        appleTransactionId: true,
        appleOriginalTransactionId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByTransactionId(transactionId: string) {
    return this.prisma.subscription.findUnique({
      where: { appleTransactionId: transactionId },
      select: {
        id: true,
        userId: true,
        planId: true,
        groupId: true,
        appleTransactionId: true,
        appleOriginalTransactionId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: {
    userId: string;
    planId: string;
    appleTransactionId: string;
    appleOriginalTransactionId: string;
    status: SubscriptionStatus;
    expiresAt: Date;
  }) {
    return this.prisma.subscription.create({
      data,
      select: {
        id: true,
        userId: true,
        planId: true,
        groupId: true,
        appleTransactionId: true,
        appleOriginalTransactionId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      appleTransactionId?: string;
      status?: SubscriptionStatus;
      expiresAt?: Date;
      groupId?: string;
    },
  ) {
    return this.prisma.subscription.update({
      where: { id },
      data,
      select: {
        id: true,
        userId: true,
        planId: true,
        groupId: true,
        appleTransactionId: true,
        appleOriginalTransactionId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
      },
      orderBy: { expiresAt: 'desc' },
      select: {
        id: true,
        userId: true,
        planId: true,
        groupId: true,
        appleTransactionId: true,
        appleOriginalTransactionId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByOriginalTransactionId(originalTransactionId: string) {
    return this.prisma.subscription.findFirst({
      where: { appleOriginalTransactionId: originalTransactionId },
      orderBy: { expiresAt: 'desc' },
      select: {
        id: true,
        userId: true,
        planId: true,
        groupId: true,
        appleTransactionId: true,
        appleOriginalTransactionId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
