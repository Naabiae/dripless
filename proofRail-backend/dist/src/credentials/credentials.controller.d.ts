import { CredentialsService } from './credentials.service';
export declare class CredentialsController {
    private readonly credentialsService;
    constructor(credentialsService: CredentialsService);
    getCredential(req: any): Promise<any>;
    getMidnightProof(req: any): Promise<any>;
    getAleoProof(req: any): Promise<any>;
    getFhenixProof(req: any): Promise<any>;
}
