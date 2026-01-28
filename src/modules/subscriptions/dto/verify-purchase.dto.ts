import { IsString } from 'class-validator';

export class VerifyPurchaseDto {
  @IsString()
  transactionId: string;

  @IsString()
  planId: string;
}
