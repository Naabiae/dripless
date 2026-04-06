import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../core/prisma/prisma.service';
import { DisputesProcessor } from '../queue/disputes.processor';
import { TradesModule } from '../trades/trades.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'disputes',
    }),
    TradesModule,
  ],
  controllers: [DisputesController],
  providers: [DisputesService, PrismaService, DisputesProcessor],
  exports: [DisputesService],
})
export class DisputesModule {}
