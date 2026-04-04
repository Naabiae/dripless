import { KycService } from './kyc.service';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
export declare class KycController {
    private readonly kycService;
    private configService;
    private kycQueue;
    constructor(kycService: KycService, configService: ConfigService, kycQueue: Queue);
    initiate(req: any): Promise<{
        verificationUrl: string;
    }>;
    getStatus(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.KycStatus;
        sessionId: string;
        decisionData: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
    } | {
        status: "NOT_STARTED";
    }>;
    webhook(payload: any, signature: string): Promise<{
        received: boolean;
    }>;
}
