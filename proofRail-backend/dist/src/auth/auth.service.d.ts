import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletVerifyDto } from './dto/wallet-auth.dto';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private prisma;
    private jwtService;
    private redisService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, redisService: RedisService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    walletNonce(address: string): Promise<{
        nonce: string;
    }>;
    walletVerify(dto: WalletVerifyDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, token: string): Promise<void>;
    private generateTokens;
}
