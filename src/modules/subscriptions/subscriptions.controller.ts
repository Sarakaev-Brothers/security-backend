import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { VerifyPurchaseDto } from './dto/verify-purchase.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post('verify')
  async verifyPurchase(
    @CurrentUser() user: { id: string },
    @Body() dto: VerifyPurchaseDto,
  ) {
    return this.subscriptionsService.verifyPurchase(
      user.id,
      dto.transactionId,
      dto.planId,
    );
  }

  @Get('my')
  async getMySubscription(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMySubscription(user.id);
  }
}
