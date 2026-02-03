import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('geo')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Post('update')
  async updateLocation(
    @Request() req: { user: { id: string } },
    @Body() dto: { groupId: string; version: number; payload: string },
  ) {
    return this.locationsService.updateLocation(req.user.id, dto);
  }

  @Get('groups/:groupId')
  async getGroupLocations(@Param('groupId') groupId: string) {
    return this.locationsService.getGroupLocations(groupId);
  }
}
