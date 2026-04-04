import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { WebhookProcessor } from '../queue/webhook.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'kyc',
    }),
  ],
  controllers: [KycController],
  providers: [KycService, WebhookProcessor],
  exports: [KycService],
})
export class KycModule {}
