import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class ProviderService implements OnModuleInit {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    getProofServerUrl(): string;
    getIndexerUrl(): string;
    getNodeUrl(): string;
}
