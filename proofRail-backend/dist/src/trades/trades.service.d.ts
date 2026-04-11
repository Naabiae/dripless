import { PrismaService } from '../core/prisma/prisma.service';
import { AmlService } from '../compliance/aml.service';
import { EscrowService } from './escrow.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { MidnightEscrowService } from '../midnight/midnight-escrow.service';
export declare class TradesService {
    private prisma;
    private amlService;
    private escrowService;
    private eventEmitter;
    private tradesQueue;
    private midnightEscrowService;
    private readonly logger;
    constructor(prisma: PrismaService, amlService: AmlService, escrowService: EscrowService, eventEmitter: EventEmitter2, tradesQueue: Queue, midnightEscrowService: MidnightEscrowService);
    createTrade(buyerId: string, dto: CreateTradeDto): Promise<any>;
    lockEscrow(tradeId: string, sellerId: string, txHash: string): Promise<any>;
    markPaymentSent(tradeId: string, buyerId: string): Promise<any>;
    confirmPayment(tradeId: string, sellerId: string): Promise<any>;
    cancelTrade(tradeId: string, userId: string): Promise<any>;
    getActiveTrades(userId: string): Promise<any>;
    getTrade(tradeId: string, userId: string): Promise<any>;
    private getTradeIfParty;
}
