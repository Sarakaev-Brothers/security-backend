import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPublicKeyDto {
  @ApiProperty({
    example: 'base64-encoded-public-key',
    description: 'Diffie-Hellman public key of the user',
  })
  @IsString()
  dhPublicKey: string;
}
