import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Param, Get, ForbiddenException } from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { ConfirmPaymentDto, LockEscrowDto } from './dto/confirm-payment.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { KycVerifiedGuard } from '../core/guards/kyc-verified.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ComplianceService } from '../compliance/compliance.service';

@ApiTags('Trades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, KycVerifiedGuard)
@Controller('trades')
export class TradesController {
  constructor(
    private readonly tradesService: TradesService,
    private complianceService: ComplianceService,
  ) {}

  @Post()
  async createTrade(@Req() req: any, @Body() dto: CreateTradeDto) {
    const compliance = await this.complianceService.getStatus(req.user.id);
    if (compliance.status !== 'CLEAR') {
      throw new ForbiddenException('Compliance status must be CLEAR to trade');
    }
    return this.tradesService.createTrade(req.user.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/lock-escrow')
  lockEscrow(@Param('id') tradeId: string, @Req() req: any, @Body() dto: LockEscrowDto) {
    return this.tradesService.lockEscrow(tradeId, req.user.id, dto.txHash);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/payment-sent')
  markPaymentSent(@Param('id') tradeId: string, @Req() req: any) {
    return this.tradesService.markPaymentSent(tradeId, req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/confirm-payment')
  confirmPayment(@Param('id') tradeId: string, @Req() req: any) {
    return this.tradesService.confirmPayment(tradeId, req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/cancel')
  cancelTrade(@Param('id') tradeId: string, @Req() req: any) {
    return this.tradesService.cancelTrade(tradeId, req.user.id);
  }

  @Get('active')
  getActiveTrades(@Req() req: any) {
    return this.tradesService.getActiveTrades(req.user.id);
  }

  @Get(':id')
  getTrade(@Param('id') tradeId: string, @Req() req: any) {
    return this.tradesService.getTrade(tradeId, req.user.id);
  }
}
