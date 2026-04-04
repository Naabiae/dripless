import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class KycService {
    private prisma;
    private configService;
    private kycQueue;
    private eventEmitter;
    constructor(prisma: PrismaService, configService: ConfigService, kycQueue: Queue, eventEmitter: EventEmitter2);
    handleAbandonedSessions(): Promise<void>;
    createSession(userId: string): Promise<{
        verificationUrl: string;
    }>;
    getStatus(userId: string): Promise<{
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
    processWebhook(payload: any): Promise<void>;
}
