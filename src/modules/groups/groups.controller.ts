import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
}
