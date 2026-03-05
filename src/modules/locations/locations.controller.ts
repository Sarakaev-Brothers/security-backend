import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('geo')
@ApiBearerAuth()
@Controller('geo')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update user location' })
  @ApiResponse({ status: 201 })
  async updateLocation(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.updateLocation(req.user.id, dto);
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Get locations for all members in a group' })
  @ApiResponse({ status: 200 })
  async getGroupLocations(@Param('groupId') groupId: string) {
    return this.locationsService.getGroupLocations(groupId);
  }
}
