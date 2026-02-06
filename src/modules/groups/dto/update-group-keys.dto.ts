import { IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupKeysDto {
  @ApiProperty({ example: 1, description: 'Version of the keys' })
  @IsNumber()
  version: number;

  @ApiProperty({
    example: { 'member-id-1': 'encrypted-key-1' },
    description: 'Map of user IDs to their encrypted versions of the group key',
  })
  @IsObject()
  keys: Record<string, string>;
}
