import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { SetPublicKeyDto } from './dto/set-public-key.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@Request() req: { user: { id: string } }) {
    return await this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMe(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return await this.usersService.update(req.user.id, dto);
  }

  @Post('public-keys')
  @ApiOperation({ summary: 'Set user Diffie-Hellman public key' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async setPublicKey(
    @Request() req: { user: { id: string } },
    @Body() dto: SetPublicKeyDto,
  ) {
    return await this.usersService.update(req.user.id, {
      dhPublicKey: dto.dhPublicKey,
    });
  }
}
