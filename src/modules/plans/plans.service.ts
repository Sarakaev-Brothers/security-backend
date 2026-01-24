import { Injectable, NotFoundException } from '@nestjs/common';
import { PlansRepository } from './plans.repository';
import { Plan } from 'generated/prisma/client';

@Injectable()
export class PlansService {
  constructor(private plansRepository: PlansRepository) {}

  async getAll(): Promise<Plan[]> {
    return this.plansRepository.findAll();
  }

  async getById(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }
}
