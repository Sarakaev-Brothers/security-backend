import { IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUsersDto {
  @ApiProperty({
    example: ['user-id-1', 'user-id-2'],
    description: 'Array of user IDs to invite',
  })
  @IsArray()
  @IsString({ each: true })
  users: string[];
}
