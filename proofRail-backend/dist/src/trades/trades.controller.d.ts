import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { LockEscrowDto } from './dto/confirm-payment.dto';
import { ComplianceService } from '../compliance/compliance.service';
export declare class TradesController {
    private readonly tradesService;
    private complianceService;
    constructor(tradesService: TradesService, complianceService: ComplianceService);
    createTrade(req: any, dto: CreateTradeDto): Promise<any>;
    lockEscrow(tradeId: string, req: any, dto: LockEscrowDto): Promise<any>;
    markPaymentSent(tradeId: string, req: any): Promise<any>;
    confirmPayment(tradeId: string, req: any): Promise<any>;
    cancelTrade(tradeId: string, req: any): Promise<any>;
    getActiveTrades(req: any): Promise<any>;
    getTrade(tradeId: string, req: any): Promise<any>;
}
