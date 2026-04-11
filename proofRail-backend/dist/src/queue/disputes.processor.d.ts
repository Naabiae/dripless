import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class DisputesProcessor extends WorkerHost {
    private prisma;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    process(job: Job<any, any, string>): Promise<any>;
}
