import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { KycService } from '../kyc/kyc.service';

@Processor('kyc')
export class WebhookProcessor extends WorkerHost {
  constructor(private readonly kycService: KycService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    await this.kycService.processWebhook(job.data);
  }
}
