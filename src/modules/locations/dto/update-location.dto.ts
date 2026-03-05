import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 'group-id-123', description: 'ID of the group' })
  @IsString()
  groupId: string;

  @ApiProperty({ example: 1, description: 'Version of the location data' })
  @IsNumber()
  version: number;

  @ApiProperty({
    example: 'encrypted-location-payload',
    description: 'Encrypted location data',
  })
  @IsString()
  payload: string;
}
