import { ConfigService } from '@nestjs/config';
export declare class SanctionsService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    screen(userId: string, kycData: any): Promise<{
        status: 'CLEAR' | 'FLAGGED';
        result: any;
    }>;
}
