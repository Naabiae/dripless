import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { BullModule } from '@nestjs/bullmq';
import { EscrowService } from '../trades/escrow.service';
import { PrismaService } from '../core/prisma/prisma.service';
import { DisputesProcessor } from '../queue/disputes.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'disputes',
    }),
  ],
  controllers: [DisputesController],
  providers: [DisputesService, EscrowService, PrismaService, DisputesProcessor],
  exports: [DisputesService],
})
export class DisputesModule {}
