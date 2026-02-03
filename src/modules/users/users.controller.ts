import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: { user: { id: string } }) {
    return await this.usersService.findById(req.user.id);
  }

  @Patch('me')
  async updateMe(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return await this.usersService.update(req.user.id, dto);
  }

  @Post('public-keys')
  async setPublicKey(
    @Request() req: { user: { id: string } },
    @Body() dto: { dhPublicKey: string },
  ) {
    return await this.usersService.update(req.user.id, {
      dhPublicKey: dto.dhPublicKey,
    });
  }
}
