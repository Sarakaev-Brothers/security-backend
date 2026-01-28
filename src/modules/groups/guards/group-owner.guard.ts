import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { GroupsRepository } from '../groups.repository';
import { AuthenticatedRequest } from 'src/common/types/request.types';

@Injectable()
export class GroupOwnerGuard implements CanActivate {
  constructor(private groupsRepository: GroupsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const groupId = request.params.groupId;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!groupId || typeof groupId !== 'string') {
      throw new ForbiddenException('Invalid group ID');
    }

    const group = await this.groupsRepository.findById(groupId);
    if (!group) {
      throw new ForbiddenException('Group not found');
    }

    if (group.ownerId !== user.id) {
      throw new ForbiddenException('Only group owner can perform this action');
    }

    return true;
  }
}
