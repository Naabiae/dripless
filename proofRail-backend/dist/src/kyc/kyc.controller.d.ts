import { KycService } from './kyc.service';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    initiate(req: any): Promise<{
        verificationUrl: string;
    }>;
    getStatus(req: any): Promise<any>;
}
