import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { EscrowService } from './escrow.service';
import { TradesController } from './trades.controller';
import { BullModule } from '@nestjs/bullmq';
import { ComplianceModule } from '../compliance/compliance.module';
import { TradesProcessor } from '../queue/trades.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'trades',
    }),
    ComplianceModule,
  ],
  providers: [TradesService, EscrowService, TradesProcessor],
  controllers: [TradesController],
  exports: [TradesService, EscrowService],
})
export class TradesModule {}
