import { Controller, Get, Param } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async getAll() {
    return this.plansService.getAll();
  }

  @Get(':id')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async getById(@Param('id') id: string) {
    return this.plansService.getById(id);
  }
}
