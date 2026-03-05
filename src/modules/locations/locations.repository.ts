import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class LocationsRepository {
  constructor(private prisma: PrismaService) {}

  // async findAll(): Promise<Location[]> {
  //   return this.prisma.location.findMany();
  // }

  // async findById(id: string): Promise<Location | null> {
  //   return this.prisma.location.findUnique({ where: { id } });
  // }
}
