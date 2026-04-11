import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SanctionsService } from './sanctions.service';
import { AmlService } from './aml.service';
export declare class ComplianceService {
    private prisma;
    private sanctionsService;
    private amlService;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, sanctionsService: SanctionsService, amlService: AmlService, eventEmitter: EventEmitter2);
    runFullCheck(userId: string): Promise<any>;
    getStatus(userId: string): Promise<any>;
    flagUser(userId: string, reason: string): Promise<void>;
    blockUser(userId: string, adminId: string): Promise<void>;
    clearUser(userId: string, adminId: string): Promise<void>;
}
