import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MidnightAdapter } from './adapters/midnight.adapter';
import { AleoAdapter } from './adapters/aleo.adapter';
import { FhenixAdapter } from './adapters/fhenix.adapter';
import { RedisService } from '../core/redis/redis.service';
import { MidnightKycService } from '../midnight/midnight-kyc.service';
export declare class CredentialsService {
    private prisma;
    private configService;
    private midnightAdapter;
    private aleoAdapter;
    private fhenixAdapter;
    private redisService;
    private midnightKycService;
    constructor(prisma: PrismaService, configService: ConfigService, midnightAdapter: MidnightAdapter, aleoAdapter: AleoAdapter, fhenixAdapter: FhenixAdapter, redisService: RedisService, midnightKycService: MidnightKycService);
    handleComplianceCleared(payload: {
        userId: string;
    }): Promise<void>;
    issue(userId: string): Promise<{
        signature: string;
        credentialId: `${string}-${string}-${string}-${string}-${string}`;
        userId: string;
        walletAddress: any;
        issuedAt: number;
        expiresAt: number;
        claims: {
            kycVerified: boolean;
            kycTier: number;
            regionAllowed: boolean;
            sanctionsClear: boolean;
            complianceStatus: string;
            ageVerified: boolean;
        };
    }>;
    getCredential(userId: string): Promise<any>;
    revoke(userId: string): Promise<void>;
    refresh(userId: string): Promise<{
        signature: string;
        credentialId: `${string}-${string}-${string}-${string}-${string}`;
        userId: string;
        walletAddress: any;
        issuedAt: number;
        expiresAt: number;
        claims: {
            kycVerified: boolean;
            kycTier: number;
            regionAllowed: boolean;
            sanctionsClear: boolean;
            complianceStatus: string;
            ageVerified: boolean;
        };
    }>;
    getFormattedProof(userId: string, chain: 'midnight' | 'aleo' | 'fhenix'): Promise<any>;
}
