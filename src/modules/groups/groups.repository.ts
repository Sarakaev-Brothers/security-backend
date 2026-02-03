import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GroupsRepository {
  constructor(private prisma: PrismaService) {}

  async findByOwnerId(ownerId: string) {
    return this.prisma.group.findUnique({
      where: { ownerId },
      include: {
        owner: true,
        plan: true,
        members: {
          include: {
            user: true,
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findByMemberId(memberId: string) {
    return this.prisma.group.findFirst({
      where: { members: { some: { userId: memberId } } },
      include: {
        owner: true,
        plan: true,
        members: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.group.findUnique({
      where: { id },
      include: {
        owner: true,
        plan: true,
        members: {
          include: {
            user: true,
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async create(data: { ownerId: string; planId: string }) {
    return this.prisma.group.create({
      data: {
        ...data,
        members: {
          create: {
            userId: data.ownerId,
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        },
      },
      include: {
        owner: true,
        plan: true,
        members: true,
        subscriptions: true,
      },
    });
  }

  async addMembers(groupId: string, userIds: string[]) {
    return this.prisma.groupMember.createMany({
      data: userIds.map((userId) => ({
        groupId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  async findGroupMemberIds(groupId: string) {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async delete(id: string) {
    return this.prisma.group.delete({
      where: { id },
    });
  }

  async update(
    id: string,
    data: {
      isActive?: boolean;
      currentKeyVersion?: number;
      membersHash?: string;
    },
  ) {
    return this.prisma.group.update({
      where: { id },
      data,
    });
  }

  async findMembersPublicKeys(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                dhPublicKey: true,
              },
            },
          },
        },
      },
    });
    return group?.members.map((m) => m.user) || [];
  }

  async updateKeys(
    groupId: string,
    version: number,
    keys: Record<string, string>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const keyData = Object.entries(keys).map(([userId, encryptedKey]) => ({
        groupId,
        userId,
        version,
        encryptedKey,
      }));

      await tx.groupKey.createMany({
        data: keyData,
      });

      return tx.group.update({
        where: { id: groupId },
        data: {
          currentKeyVersion: version,
        },
      });
    });
  }

  async findUserKey(groupId: string, userId: string, version: number) {
    return this.prisma.groupKey.findUnique({
      where: {
        groupId_userId_version: {
          groupId,
          userId,
          version,
        },
      },
    });
  }

  async deleteMember(groupId: string, memberId: string) {
    return this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: memberId } },
    });
  }
}
