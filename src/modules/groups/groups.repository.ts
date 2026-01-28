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
      data,
      include: {
        owner: true,
        plan: true,
        members: true,
        subscriptions: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.group.delete({
      where: { id },
    });
  }

  async update(id: string, data: { isActive?: boolean }) {
    return this.prisma.group.update({
      where: { id },
      data,
    });
  }

  async deleteMember(groupId: string, memberId: string) {
    return this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: memberId } },
    });
  }
}
