import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { VerifyPurchaseDto } from './dto/verify-purchase.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify Apple IAP purchase' })
  @ApiResponse({ status: 201, type: SubscriptionResponseDto })
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
  @ApiOperation({ summary: 'Get current user active subscription' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getMySubscription(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMySubscription(user.id);
  }
}
