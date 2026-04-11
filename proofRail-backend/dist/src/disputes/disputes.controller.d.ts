import { DisputesService } from './disputes.service';
import { RaiseDisputeDto, SubmitEvidenceDto, ResolveDisputeDto } from './dto/raise-dispute.dto';
export declare class DisputesController {
    private readonly disputesService;
    constructor(disputesService: DisputesService);
    raiseDispute(req: any, dto: RaiseDisputeDto): Promise<any>;
    submitEvidence(disputeId: string, req: any, dto: SubmitEvidenceDto): Promise<any>;
    getDispute(disputeId: string, req: any): Promise<any>;
    resolveDispute(disputeId: string, req: any, dto: ResolveDisputeDto): Promise<any>;
    listOpenDisputes(): Promise<any>;
}
