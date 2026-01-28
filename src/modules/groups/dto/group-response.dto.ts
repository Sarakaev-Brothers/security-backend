import { UserResponseDto } from '../../users/dto/user-response.dto';
import { PlanResponseDto } from '../../plans/dto/plan-response.dto';

export class SubscriptionResponseDto {
  id: string;
  status: string;
  expiresAt: Date;
  appleTransactionId: string;
}

export class GroupMemberResponseDto {
  id: string;
  status: string;
  joinedAt: Date | null;
  user: UserResponseDto;
}

export class GroupResponseDto {
  id: string;
  ownerId: string;
  owner: UserResponseDto;
  planId: string;
  plan: PlanResponseDto;
  isActive: boolean;
  members: GroupMemberResponseDto[];
  subscriptions: SubscriptionResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
