import { ComplianceService } from './compliance.service';
export declare class ComplianceController {
    private readonly complianceService;
    constructor(complianceService: ComplianceService);
    getStatus(req: any): Promise<any>;
    blockUser(userId: string, req: any): Promise<void>;
    clearUser(userId: string, req: any): Promise<void>;
}
