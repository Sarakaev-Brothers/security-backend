import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPurchaseDto {
  @ApiProperty({ example: '1000000123456789' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: 'premium_plan_monthly' })
  @IsString()
  planId: string;
}
