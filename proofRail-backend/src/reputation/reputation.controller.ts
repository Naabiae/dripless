import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getTier(@Req() req: any) {
    return this.reputationService.getTier(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/:chain')
  getRepProof(@Param('chain') chain: 'midnight' | 'aleo' | 'fhenix', @Req() req: any) {
    return this.reputationService.getRepProof(req.user.id, chain);
  }

  @Get('user/:walletAddress')
  async getPublicReputation(@Param('walletAddress') walletAddress: string) {
    const user = await this.reputationService['prisma'].user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: { reputation: true }
    });

    if (!user || !user.reputation) {
      return { tier: 'BRONZE', tradeCount: 0 };
    }

    return {
      tier: user.reputation.tier,
      tradeCount: user.reputation.completedTrades,
    };
  }
}
