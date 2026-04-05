import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Chain } from '@prisma/client';
import { MidnightEscrowService } from '../midnight/midnight-escrow.service';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(private midnightEscrowService: MidnightEscrowService) {}

  async validateEscrowTx(chain: Chain, tradeId: string, txHash: string, expectedAmount: number) {
    this.logger.log(`Validating escrow tx ${txHash} on ${chain} for amount ${expectedAmount}`);
    if (chain === 'MIDNIGHT') {
      const status = await this.midnightEscrowService.getEscrowStatus(tradeId);
      if (status !== 'LOCKED') {
         throw new BadRequestException('On-chain escrow is not LOCKED');
      }
    }
    return true;
  }

  async releaseInstruction(tradeId: string, resolution?: 'BUYER' | 'SELLER') {
    this.logger.log(`Generating release instruction for trade ${tradeId} to ${resolution || 'BUYER'}`);
    
    let txHash = null;
    if (resolution === 'SELLER') {
      txHash = await this.midnightEscrowService.releaseToSeller(tradeId);
    } else {
      txHash = await this.midnightEscrowService.releaseToBuyer(tradeId);
    }

    return {
      tradeId,
      action: 'RELEASE',
      recipient: resolution || 'BUYER',
      timestamp: Date.now(),
      txHash,
    };
  }
}

