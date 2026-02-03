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
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupOwnerGuard } from './guards/group-owner.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  async getMyGroup(@CurrentUser() user: { id: string }) {
    return this.groupsService.getMyGroup(user.id);
  }

  @Post()
  async createGroup(@CurrentUser() user: { id: string }) {
    return this.groupsService.createGroup(user.id);
  }

  @Post(':groupId/invite')
  @UseGuards(GroupOwnerGuard)
  async inviteUsers(
    @Param('groupId') groupId: string,
    @Body() dto: { users: string[] },
  ) {
    return this.groupsService.inviteUsers(groupId, dto.users);
  }

  @Delete(':groupId')
  @UseGuards(GroupOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('groupId') groupId: string): Promise<void> {
    await this.groupsService.deleteGroup(groupId);
  }

  @Delete(':groupId/members/:memberId')
  @UseGuards(GroupOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    await this.groupsService.removeMember(groupId, memberId, user.id);
  }

  @Get(':groupId/members/public-keys')
  async getMembersPublicKeys(@Param('groupId') groupId: string) {
    return this.groupsService.getMembersPublicKeys(groupId);
  }

  @Post(':groupId/keys')
  async updateKeys(
    @Param('groupId') groupId: string,
    @Body() dto: { version: number; keys: Record<string, string> },
  ) {
    return this.groupsService.updateGroupKeys(groupId, dto.version, dto.keys);
  }

  @Get(':groupId/keys')
  async getMyKey(
    @Param('groupId') groupId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.groupsService.getUserKey(groupId, user.id);
  }

  @Post(':groupId/rotate-key')
  async rotateKey(
    @Param('groupId') groupId: string,
    @Body() dto: { version: number; keys: Record<string, string> },
  ) {
    return this.groupsService.updateGroupKeys(groupId, dto.version, dto.keys);
  }
}
