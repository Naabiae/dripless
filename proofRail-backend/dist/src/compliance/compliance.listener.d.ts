import { ComplianceService } from './compliance.service';
export declare class ComplianceListener {
    private complianceService;
    constructor(complianceService: ComplianceService);
    handleKycApprovedEvent(payload: {
        userId: string;
    }): void;
}
