import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../core/redis/redis.service';
export declare class KycService {
    private prisma;
    private configService;
    private kycQueue;
    private eventEmitter;
    private redisService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, kycQueue: Queue, eventEmitter: EventEmitter2, redisService: RedisService);
    handleAbandonedSessions(): Promise<void>;
    createSession(userId: string): Promise<{
        verificationUrl: string;
    }>;
    getStatus(userId: string): Promise<any>;
    processWebhook(payload: any): Promise<void>;
}
