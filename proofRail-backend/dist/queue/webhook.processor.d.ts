import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { KycService } from '../kyc/kyc.service';
export declare class WebhookProcessor extends WorkerHost {
    private readonly kycService;
    constructor(kycService: KycService);
    process(job: Job<any, any, string>): Promise<any>;
}
