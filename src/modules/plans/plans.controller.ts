import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PlanResponseDto } from './dto/plan-response.dto';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all available plans' })
  @ApiResponse({ status: 200, type: [PlanResponseDto] })
  async getAll() {
    return this.plansService.getAll();
  }

  @Get(':id')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async getById(@Param('id') id: string) {
    return this.plansService.getById(id);
  }
}
