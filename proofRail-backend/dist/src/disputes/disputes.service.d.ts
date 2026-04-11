import { PrismaService } from '../core/prisma/prisma.service';
import { EscrowService } from '../trades/escrow.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { RaiseDisputeDto, SubmitEvidenceDto, ResolveDisputeDto } from './dto/raise-dispute.dto';
export declare class DisputesService {
    private prisma;
    private escrowService;
    private eventEmitter;
    private disputesQueue;
    private readonly logger;
    constructor(prisma: PrismaService, escrowService: EscrowService, eventEmitter: EventEmitter2, disputesQueue: Queue);
    raise(userId: string, dto: RaiseDisputeDto): Promise<any>;
    submitEvidence(disputeId: string, userId: string, dto: SubmitEvidenceDto): Promise<any>;
    resolve(disputeId: string, adminId: string, dto: ResolveDisputeDto): Promise<any>;
    getDispute(disputeId: string, userId: string, role: string): Promise<any>;
    listOpen(): Promise<any>;
}
