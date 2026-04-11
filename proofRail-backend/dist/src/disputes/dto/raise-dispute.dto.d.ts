import { DisputeResolution } from '@prisma/client';
export declare class RaiseDisputeDto {
    tradeId: string;
    reason: string;
}
export declare class SubmitEvidenceDto {
    evidence: any;
}
export declare class ResolveDisputeDto {
    resolution: DisputeResolution;
    notes?: string;
}
