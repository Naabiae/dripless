import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    private redisService;
    constructor(configService: ConfigService, prisma: PrismaService, redisService: RedisService);
    validate(req: any, payload: any): Promise<{
        email: string | null;
        id: string;
        walletAddress: string | null;
        passwordHash: string | null;
        refreshToken: string | null;
        role: import("@prisma/client").$Enums.Role;
        kycStatus: import("@prisma/client").$Enums.KycStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
