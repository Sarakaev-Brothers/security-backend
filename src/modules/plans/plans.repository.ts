import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Plan } from 'generated/prisma/client';

@Injectable()
export class PlansRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      orderBy: { maxMembers: 'asc' },
    });
  }

  async findById(id: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({
      where: { id },
    });
  }
}
