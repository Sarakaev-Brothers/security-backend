import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupOwnerGuard } from './guards/group-owner.guard';
import { GroupResponseDto } from './dto/group-response.dto';
import { InviteUsersDto } from './dto/invite-users.dto';
import { UpdateGroupKeysDto } from './dto/update-group-keys.dto';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user group' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  async getMyGroup(@CurrentUser() user: { id: string }) {
    return this.groupsService.getMyGroup(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, type: GroupResponseDto })
  async createGroup(@CurrentUser() user: { id: string }) {
    return this.groupsService.createGroup(user.id);
  }

  @Post(':groupId/invite')
  @UseGuards(GroupOwnerGuard)
  @ApiOperation({ summary: 'Invite users to group' })
  @ApiResponse({ status: 201 })
  async inviteUsers(
    @Param('groupId') groupId: string,
    @Body() dto: InviteUsersDto,
  ) {
    return this.groupsService.inviteUsers(groupId, dto.users);
  }

  @Delete(':groupId')
  @UseGuards(GroupOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete group' })
  @ApiResponse({ status: 204 })
  async deleteGroup(@Param('groupId') groupId: string): Promise<void> {
    await this.groupsService.deleteGroup(groupId);
  }

  @Delete(':groupId/members/:memberId')
  @UseGuards(GroupOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from group' })
  @ApiResponse({ status: 204 })
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    await this.groupsService.removeMember(groupId, memberId, user.id);
  }

  @Get(':groupId/members/public-keys')
  @ApiOperation({ summary: 'Get public keys of group members' })
  @ApiResponse({ status: 200 })
  async getMembersPublicKeys(@Param('groupId') groupId: string) {
    return this.groupsService.getMembersPublicKeys(groupId);
  }

  @Post(':groupId/keys')
  @ApiOperation({ summary: 'Update group keys' })
  @ApiResponse({ status: 201 })
  async updateKeys(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupKeysDto,
  ) {
    return this.groupsService.updateGroupKeys(groupId, dto.version, dto.keys);
  }

  @Get(':groupId/keys')
  @ApiOperation({ summary: 'Get my encrypted key for group' })
  @ApiResponse({ status: 200 })
  async getMyKey(
    @Param('groupId') groupId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.groupsService.getUserKey(groupId, user.id);
  }

  @Post(':groupId/rotate-key')
  @ApiOperation({ summary: 'Rotate group keys' })
  @ApiResponse({ status: 201 })
  async rotateKey(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupKeysDto,
  ) {
    return this.groupsService.updateGroupKeys(groupId, dto.version, dto.keys);
  }
}
