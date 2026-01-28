import { GroupResponseDto } from '../../groups/dto/group-response.dto';

export class SubscriptionResponseDto {
  id: string;
  groupId: string;
  group: GroupResponseDto;
  appleTransactionId: string;
  appleOriginalTransactionId: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
