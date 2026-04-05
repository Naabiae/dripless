import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { EscrowService } from './escrow.service';
import { TradesController } from './trades.controller';
import { BullModule } from '@nestjs/bullmq';
import { ComplianceModule } from '../compliance/compliance.module';
import { TradesProcessor } from '../queue/trades.processor';
import { MidnightModule } from '../midnight/midnight.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'trades',
    }),
    ComplianceModule,
    MidnightModule,
  ],
  providers: [TradesService, EscrowService, TradesProcessor],
  controllers: [TradesController],
  exports: [TradesService, EscrowService],
})
export class TradesModule {}
