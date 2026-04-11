import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
export declare class KycWebhookController {
    private kycQueue;
    private configService;
    constructor(kycQueue: Queue, configService: ConfigService);
    webhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
}
